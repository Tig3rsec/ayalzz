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

  return (
    <button
      onClick={() => onOpen(book)}
      className="group relative w-full shrink-0 text-left focus:outline-none"
    >
      <div
        className={`relative aspect-[2/3] overflow-hidden rounded-xl bg-gradient-to-br ${palette} shadow-[0_10px_30px_-16px_rgba(0,0,0,0.6)] ring-1 ring-border transition duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_22px_40px_-18px_rgba(0,0,0,0.65)] group-focus-visible:-translate-y-1.5`}
      >
        {cover ? (
          <img src={cover} alt={`${book.title} cover`} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        {cover ? <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" /> : null}
        <div className="absolute inset-y-0 left-0 w-2 bg-ink/20" />
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
        <div className="absolute inset-0 grid place-items-center bg-ink/45 opacity-0 backdrop-blur-[1px] transition group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="rounded-full bg-cream px-4 py-2 text-xs font-medium text-pine">View book</span>
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
      <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-3">
        {books.map((book) => (
          <div key={book.id} className="w-[130px] shrink-0 snap-start sm:w-[170px]">

            <BookTile book={book} onOpen={onOpen} saved={savedIds.has(book.id)} />
          </div>
        ))}
      </div>
    </section>
  );
}
