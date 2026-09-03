import type { Book } from "@/components/BookCard";
import { resolveDirectLink } from "@/lib/download.functions";
import { getBookDownloadUrl } from "@/lib/books.functions";

/** A stored search page is not a real link — we resolve a better one live. */
export function isSearchLink(url: string | null | undefined) {
  if (!url) return true;
  return /archive\.org\/search|duckduckgo|google\.[a-z.]+\/search|bing\.com\/search/i.test(url);
}

/**
 * Returns an immediately usable link if we already have one.
 * Stored files and search-page placeholders return null so the caller resolves.
 */
export function resolveDownloadUrl(book: Book): string | null {
  if (book.file_path) return null;
  if (book.download_url && !isSearchLink(book.download_url)) return book.download_url;
  return null;
}

export type ResolvedLink = { url: string; kind: "pdf" | "search" | string; source: string };

/**
 * Resolves a usable link WITHOUT opening a tab.
 * Safe on mobile: the caller renders the link so the user taps it directly.
 */
export async function resolveBookLink(
  book: Book,
  opts: { signedIn: boolean },
): Promise<ResolvedLink> {
  const ready = resolveDownloadUrl(book);
  if (ready) return { url: ready, kind: "pdf", source: "Library" };

  if (book.file_path) {
    if (!opts.signedIn) throw new Error("Sign in to download this book.");
    const { url } = await getBookDownloadUrl({ data: { bookId: book.id } });
    return { url, kind: "pdf", source: "Library" };
  }

  return resolveDirectLink({
    data: { bookId: book.id, title: book.title, author: book.author },
  });
}

/**
 * Opens a direct, downloadable or viewable link for a book.
 * Order: stored file → saved direct link → live lookup (Archive/Open Library/Google Books).
 */

export async function openBookLink(book: Book, opts: { signedIn: boolean }) {
  // Open the tab synchronously so browsers don't block it after awaits.
  const tab = typeof window !== "undefined" ? window.open("about:blank", "_blank", "noopener") : null;

  const finish = (url: string) => {
    if (tab) tab.location.href = url;
    else window.open(url, "_blank", "noopener");
  };

  try {
    const ready = resolveDownloadUrl(book);
    if (ready) {
      finish(ready);
      return { url: ready, kind: "pdf" as const, source: "Library" };
    }

    if (book.file_path) {
      if (!opts.signedIn) {
        tab?.close();
        throw new Error("Sign in to download this book.");
      }
      const { url } = await getBookDownloadUrl({ data: { bookId: book.id } });
      finish(url);
      return { url, kind: "pdf" as const, source: "Library" };
    }

    const link = await resolveDirectLink({
      data: { bookId: book.id, title: book.title, author: book.author },
    });
    finish(link.url);
    return link;
  } catch (error) {
    tab?.close();
    throw error;
  }
}
