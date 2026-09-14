import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Book } from "@/components/BookCard";
import { useCoverUrl } from "@/lib/cover";
import { resolveBookLink, type ResolvedLink } from "@/lib/download";

export function BookDetail({
  book,
  onClose,
  signedIn,
  saved,
  onToggleSave,
}: {
  book: Book | null;
  onClose: () => void;
  signedIn: boolean;
  saved: boolean;
  onToggleSave?: (book: Book) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<ResolvedLink | null>(null);
  const [opened, setOpened] = useState(false);
  const [closing, setClosing] = useState(false);
  const cover = useCoverUrl(book?.cover_url);

  useEffect(() => {
    setLink(null);
    setBusy(false);
    setClosing(false);
    if (!book) {
      setOpened(false);
      return;
    }
    const frame = requestAnimationFrame(() => setOpened(true));
    return () => cancelAnimationFrame(frame);
  }, [book?.id]);

  function requestClose() {
    if (closing) return;
    setClosing(true);
    setOpened(false);
    window.setTimeout(onClose, 520);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") requestClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closing, onClose]);

  if (!book) return null;

  async function handleResolve() {
    if (!book) return;
    setBusy(true);
    try {
      const resolved = await resolveBookLink(book, { signedIn });
      setLink(resolved);
      if (resolved.kind === "search") {
        toast.info("No free full copy found — here's a search for this title.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not prepare the link.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      toast.success("Link copied.");
    } catch {
      toast.error("Copy failed — long-press the link to copy it.");
    }
  }

  return (
    <div
      className={`book-detail-backdrop fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/60 p-3 backdrop-blur-sm sm:p-4 ${opened ? "is-open" : ""}`}
      onClick={requestClose}
      role="presentation"
    >
      <div
        className={`book-detail-panel my-6 w-full max-w-3xl overflow-hidden rounded-2xl bg-paper ring-1 ring-border ${opened ? "is-open" : ""}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid gap-4 p-4 sm:grid-cols-[180px_1fr] sm:gap-6 sm:p-8">
          <div className={`book-detail-stage mx-auto w-32 sm:mx-0 sm:w-auto ${opened ? "is-open" : ""}`}>
            <div className="book-detail-volume aspect-[2/3]">
              <div className="book-detail-page-block" aria-hidden="true" />
              <div className="book-detail-endpaper bg-cream" aria-hidden="true">
                <span className="font-serif text-ink/20">Ayal</span>
              </div>
              <div className="book-detail-cover overflow-hidden rounded-r-xl bg-gradient-to-br from-pine to-moss p-4">
                {cover ? (
                  <img src={cover} alt={`${book.title} cover`} className="absolute inset-0 h-full w-full object-cover" />
                ) : null}
                {cover ? <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" /> : null}
                <div className="book-detail-cover-groove" aria-hidden="true" />
                <div className="relative">
                  <span className="label-mono text-cream/70">{book.track_code}</span>
                  <p className="mt-4 font-serif text-base leading-tight text-cream sm:mt-6 sm:text-xl">{book.title}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <p className="label-mono text-cognac">{book.subject ?? book.track_code} · Available</p>
            <h2 className="mt-2 font-serif text-xl leading-tight text-ink sm:text-3xl">{book.title}</h2>
            <p className="mt-2 text-sm text-ink-soft">
              {book.author ? `by ${book.author}` : "Unknown author"}
              {book.year ? ` · ${book.year}` : ""}
              {book.edition ? ` · ${book.edition}` : ""}
            </p>

            <dl className="mt-4 grid grid-cols-3 gap-2 text-center sm:mt-5 sm:gap-3">
              {[
                ["Exam", book.track_code],
                ["Pages", book.pages ? String(book.pages) : "—"],
                ["Subject", book.subject ?? "General"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-cream p-2 ring-1 ring-border sm:p-3">
                  <dt className="label-mono text-ink-soft">{label}</dt>
                  <dd className="mt-1 truncate text-xs text-ink sm:text-sm">{value}</dd>
                </div>
              ))}
            </dl>

            {book.tucked_note ? (
              <p className="mt-4 rounded-xl bg-moss/10 p-3 text-sm text-ink sm:mt-5 sm:p-4">“{book.tucked_note}”</p>
            ) : null}

            {link ? (
              <div className="mt-5 rounded-xl bg-cream p-4 ring-1 ring-border">
                <p className="label-mono text-ink-soft">
                  {link.kind === "search" ? "Search result" : "Ready"} · {link.source}
                </p>
                <p className="mt-2 break-all font-mono text-[11px] text-ink-soft">{link.url}</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-pine px-6 py-3 text-center text-sm font-medium text-cream"
                  >
                    {link.kind === "search" ? "Open search" : "Open / download"}
                  </a>
                  <button
                    onClick={copyLink}
                    className="rounded-full border border-border px-5 py-3 text-sm font-medium text-ink"
                  >
                    Copy link
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              {!link ? (
                <button
                  onClick={handleResolve}
                  disabled={busy}
                  className="w-full rounded-full bg-pine px-6 py-3 text-sm font-medium text-cream disabled:opacity-50 sm:w-auto"
                >
                  {busy ? "Finding a link…" : "Get download link"}
                </button>
              ) : null}
              {signedIn && onToggleSave ? (
                <button
                  onClick={() => onToggleSave(book)}
                  className="w-full rounded-full border border-border px-5 py-3 text-sm font-medium text-ink sm:w-auto"
                >
                  {saved ? "Remove from shelf" : "Save to shelf"}
                </button>
              ) : null}
              <button onClick={requestClose} className="py-2 text-sm text-ink-soft hover:text-ink sm:ml-auto">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

