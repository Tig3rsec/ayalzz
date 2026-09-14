import type { CSSProperties } from "react";
import type { Book } from "@/components/BookCard";
import { useCoverUrl } from "@/lib/cover";

const PALETTES = [
  "from-pine to-moss",
  "from-cognac to-pine",
  "from-moss to-cognac",
  "from-pine/90 to-cognac/80",
];

export function BookTile({ book, onOpen, saved }: { book: Book; onOpen: (book: Book) => void; saved?: boolean }) {
  const palette = PALETTES[book.title.length % PALETTES.length];
  const cover = useCoverUrl(book.cover_url);
  const seed = [...book.title].reduce((total, character) => total + character.charCodeAt(0), 0);
  const lean = ((seed % 7) - 3) * 0.55;
  const height = 94 + (seed % 7);
  const depth = 7 + (seed % 4);
  const bookStyle = {
    "--book-lean": `${lean}deg`,
    "--book-height": `${height}%`,
    "--book-depth": `${depth}px`,
  } as CSSProperties;

  return (
    <button
      onClick={() => onOpen(book)}
      className="book-hitbox group relative w-full shrink-0 text-left focus:outline-none"
      style={bookStyle}
      aria-label={`Open ${book.title}`}
    >
      <div className="book-stage relative aspect-[2/3]">
        <div className="book-volume">
          <div className={`book-spine bg-gradient-to-b ${palette}`} aria-hidden="true">
            <span className="book-spine-title font-serif text-cream/80">{book.title}</span>
          </div>
          <div className="book-pages" aria-hidden="true" />
          <div className={`book-cover relative h-full overflow-hidden bg-gradient-to-br ${palette}`}>
            {cover ? (
              <img src={cover} alt={`${book.title} cover`} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            ) : null}
            {cover ? <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" /> : null}
            <div className="book-cover-groove" aria-hidden="true" />
            <div className="relative flex h-full flex-col justify-between p-3 sm:p-4">
              <span className="label-mono text-cream/70">{book.track_code}</span>
              <div>
                <p className="font-serif text-sm leading-tight text-cream line-clamp-4 sm:text-lg">{book.title}</p>
                <p className="mt-1.5 text-[10px] text-cream/70 line-clamp-1 sm:mt-2 sm:text-[11px]">{book.author ?? "Unknown author"}</p>
              </div>
            </div>

            {saved ? (
              <span className="absolute right-2 top-2 rounded-full bg-cream/90 px-2 py-0.5 text-[10px] font-medium text-pine">
                Saved
              </span>
            ) : null}
            <div className="book-cover-sheen" aria-hidden="true" />
          </div>
        </div>
      </div>
      <p className="mt-2 truncate text-xs text-ink-soft">{book.subject ?? book.track_code}</p>
    </button>
  );
}

export function BookRow({
  title,
  books,
  onOpen,
  savedIds,
}: {
  title: string;
  books: Book[];
  onOpen: (book: Book) => void;
  savedIds: Set<string>;
}) {
  if (books.length === 0) return null;
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-serif text-xl text-ink">{title}</h3>
        <span className="label-mono text-ink-soft">{books.length}</span>
      </div>
      <div className="book-shelf-rail -mx-1 flex snap-x items-end gap-4 overflow-x-auto px-2 pt-8 pb-7">
        {books.map((book) => (
          <div key={book.id} className="w-[130px] shrink-0 snap-start sm:w-[170px]">
            <BookTile book={book} onOpen={onOpen} saved={savedIds.has(book.id)} />
          </div>
        ))}
      </div>
    </section>
  );
}
