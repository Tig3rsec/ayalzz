import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  bookId: z.string().uuid().optional(),
  title: z.string().min(2).max(300),
  author: z.string().max(200).nullish(),
});

export type DirectLink = {
  url: string;
  kind: "pdf" | "reader" | "search";
  source: string;
};

function escapeLucene(value: string) {
  return value.replace(/["\\]/g, " ").replace(/\s+/g, " ").trim();
}

async function archiveIds(q: string): Promise<string[]> {
  const searchUrl =
    "https://archive.org/advancedsearch.php?" +
    new URLSearchParams({ q, "fl[]": "identifier", rows: "5", page: "1", output: "json" }).toString();
  const res = await fetch(searchUrl, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const payload = (await res.json()) as { response?: { docs?: Array<{ identifier?: string }> } };
  return (payload.response?.docs ?? []).map((d) => d.identifier).filter(Boolean) as string[];
}

/** Find a readable/downloadable file inside an Internet Archive item. */
async function archiveItemLink(title: string, author?: string | null): Promise<DirectLink | null> {
  const words = escapeLucene([title, author].filter(Boolean).join(" "));
  const ids = [
    ...(await archiveIds(`${words} AND mediatype:(texts)`)),
    ...(await archiveIds(`title:("${escapeLucene(title)}") AND mediatype:(texts)`)),
  ];

  const keywords = title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3);
  const relevant = (haystack: string) => {
    if (!keywords.length) return true;
    const text = haystack.toLowerCase();
    const hits = keywords.filter((w) => text.includes(w)).length;
    return hits / keywords.length >= 0.5;
  };

  let fallback: DirectLink | null = null;

  for (const id of ids) {
    const metaRes = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}`);
    if (!metaRes.ok) continue;
    const meta = (await metaRes.json()) as {
      metadata?: { title?: string | string[] };
      files?: Array<{ name?: string; format?: string }>;
    };
    const itemTitle = Array.isArray(meta.metadata?.title)
      ? meta.metadata?.title.join(" ")
      : (meta.metadata?.title ?? "");
    const pdf = (meta.files ?? []).find(
      (f) => f.format?.toLowerCase().includes("pdf") || f.name?.toLowerCase().endsWith(".pdf"),
    );
    const link: DirectLink = pdf?.name
      ? {
          url: `https://archive.org/download/${encodeURIComponent(id)}/${encodeURIComponent(pdf.name)}`,
          kind: "pdf",
          source: "Internet Archive",
        }
      : { url: `https://archive.org/details/${encodeURIComponent(id)}`, kind: "reader", source: "Internet Archive" };

    if (relevant(`${id} ${itemTitle}`)) return link;
    fallback ??= link;
  }

  return fallback;
}

/** Open Library full-text read link (public domain scans). */
async function openLibraryLink(title: string): Promise<DirectLink | null> {
  const res = await fetch(
    `https://openlibrary.org/search.json?${new URLSearchParams({
      q: title,
      fields: "title,ia,ebook_access",
      limit: "5",
    }).toString()}`,
  );
  if (!res.ok) return null;
  const payload = (await res.json()) as {
    docs?: Array<{ ia?: string[]; ebook_access?: string }>;
  };
  const doc = (payload.docs ?? []).find(
    (d) => d.ia?.length && (d.ebook_access === "public" || d.ebook_access === "borrowable"),
  );
  const id = doc?.ia?.[0];
  if (!id) return null;
  return {
    url: `https://archive.org/details/${encodeURIComponent(id)}`,
    kind: "reader",
    source: "Open Library",
  };
}

/** Google Books preview/reader link. */
async function googleBooksLink(title: string, author?: string | null): Promise<DirectLink | null> {
  const q = [`intitle:${title}`, author ? `inauthor:${author}` : ""].filter(Boolean).join("+");
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?${new URLSearchParams({ q, maxResults: "5" }).toString()}`,
  );
  if (!res.ok) return null;
  const payload = (await res.json()) as {
    items?: Array<{
      accessInfo?: {
        pdf?: { isAvailable?: boolean; downloadLink?: string };
        webReaderLink?: string;
        viewability?: string;
      };
    }>;
  };
  for (const item of payload.items ?? []) {
    const pdf = item.accessInfo?.pdf;
    if (pdf?.isAvailable && pdf.downloadLink) {
      return { url: pdf.downloadLink, kind: "pdf", source: "Google Books" };
    }
  }
  for (const item of payload.items ?? []) {
    const access = item.accessInfo;
    if (access?.webReaderLink && access.viewability !== "NO_PAGES") {
      return { url: access.webReaderLink, kind: "reader", source: "Google Books" };
    }
  }
  return null;
}

/**
 * Resolves a real, openable link for a book: a direct PDF when a free copy
 * exists, otherwise an online reader page, otherwise a search page.
 * Successful hits are cached back onto the book row.
 */
export const resolveDirectLink = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<DirectLink> => {
    const title = data.title.trim();
    const author = data.author?.trim() || null;

    let found: DirectLink | null = null;
    for (const attempt of [
      () => archiveItemLink(title, author),
      () => openLibraryLink(title),
      () => googleBooksLink(title, author),
    ]) {
      try {
        found = await attempt();
      } catch {
        found = null;
      }
      if (found) break;
    }

    if (!found) {
      const query = [title, author].filter(Boolean).join(" ");
      return {
        url: `https://archive.org/search?query=${encodeURIComponent(query)}`,
        kind: "search",
        source: "Internet Archive search",
      };
    }

    if (data.bookId) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("books").update({ download_url: found.url }).eq("id", data.bookId);
      } catch {
        // caching is best-effort
      }
    }

    return found;
  });
