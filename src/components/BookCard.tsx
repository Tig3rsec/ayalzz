import { useState } from "react";
import { toast } from "sonner";
import { openBookLink } from "@/lib/download";

export type Book = {
  id: string;
  title: string;
  author: string | null;
  track_code: string;
  subject: string | null;
  year: number | null;
  pages: number | null;
  file_path: string | null;
  download_url?: string | null;
  edition?: string | null;
  cover_url?: string | null;
  tucked_note: string | null;
};

export function BookCard({
  book,
  signedIn,
  saved,
  onToggleSave,
}: {
  book: Book;
  signedIn: boolean;
  saved?: boolean;
  onToggleSave?: (book: Book) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    setBusy(true);
    try {
      const link = await openBookLink(book, { signedIn });
      if (link.kind === "search") {
        toast.info("No free full copy found — opened a search for this title.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-xl bg-cream p-4 ring-1 ring-border">
      <div className="flex gap-3">
        <div className="grid h-20 w-16 shrink-0 place-items-center rounded-lg bg-moss/15">
          <span className="font-serif text-lg text-moss">{book.title.charAt(0)}</span>
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-cognac">
            {book.subject ?? book.track_code} ·{" "}
            "Download"
          </p>
          <h3 className="mt-0.5 font-serif text-base leading-snug text-ink">{book.title}</h3>
          <p className="mt-1 text-xs text-ink-soft">
            {book.author ? `by ${book.author}` : "Unknown author"}
            {book.year ? ` · ${book.year}` : ""}
          </p>
          {book.edition ? (
            <p className="mt-0.5 text-xs text-ink-soft/80">{book.edition}</p>
          ) : null}
        </div>
      </div>

      {book.tucked_note ? (
        <p className="mt-3 text-xs text-ink-soft/80">Tucked note: “{book.tucked_note}”</p>
      ) : null}

      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-[10px] text-ink-soft">
          {book.pages ? `${book.pages} pages` : book.track_code}
        </span>
        <div className="flex items-center gap-2">
          {signedIn && onToggleSave ? (
            <button
              onClick={() => onToggleSave(book)}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink"
            >
              {saved ? "Saved" : "Save"}
            </button>
          ) : null}
          <button
            onClick={handleDownload}
            disabled={busy}
            className="rounded-full bg-pine px-3 py-1.5 text-xs font-medium text-cream ring-1 ring-pine disabled:opacity-60"
          >
            {busy ? "Preparing…" : "Download"}
          </button>
        </div>
      </div>
    </article>
  );
}
