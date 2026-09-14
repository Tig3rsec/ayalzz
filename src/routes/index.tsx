import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, type SliceId } from "@/components/SiteHeader";
import { AssistantPanel } from "@/components/AssistantPanel";
import { DiscoverPanel } from "@/components/DiscoverPanel";
import { BookRow, BookTile } from "@/components/BookTile";
import { BookDetail } from "@/components/BookDetail";
import { AdminBooks } from "@/components/AdminBooks";
import { Logo } from "@/components/Logo";
import { LibraryLoader } from "@/components/LibraryLoader";
import type { Book } from "@/components/BookCard";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { useDisplayName } from "@/hooks/useDisplayName";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Ayal — Search & download TNPSC, NEET and UPSC books" },
      {
        name: "description",
        content:
          "Ayal is one quiet page for exam prep: browse a premium book shelf, hunt any title across the internet with search dorks, and ask an AI study assistant.",
      },
      { property: "og:title", content: "Ayal — Exam study library" },
      {
        property: "og:description",
        content: "Browse, hunt and download exam prep books with an AI study assistant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Home() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const { name: displayName } = useDisplayName(user);
  const queryClient = useQueryClient();
  const [slice, setSlice] = useState<SliceId>("library");
  const [query, setQuery] = useState("");
  const [track, setTrack] = useState("ALL");
  const [sort, setSort] = useState<"newest" | "title" | "year">("newest");
  const [onlyDownloadable, setOnlyDownloadable] = useState(false);
  const [open, setOpen] = useState<Book | null>(null);

  const tracksQuery = useQuery({
    queryKey: ["exam_tracks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_tracks")
        .select("code, name, description")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const booksQuery = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id, title, author, track_code, subject, year, pages, edition, cover_url, file_path, download_url, tucked_note")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Book[];
    },
  });

  const savedQuery = useQuery({
    queryKey: ["saved_books", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_books").select("book_id");
      if (error) throw error;
      return data.map((row) => row.book_id);
    },
  });

  const books = booksQuery.data ?? [];
  const savedIds = new Set(savedQuery.data ?? []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = books.filter((book) => {
      const matchesTrack = track === "ALL" || book.track_code === track;
      const matchesQuery =
        !needle ||
        [book.title, book.author, book.subject, book.track_code, book.edition]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle));
      const matchesFile = !onlyDownloadable || Boolean(book.download_url || book.file_path);
      return matchesTrack && matchesQuery && matchesFile;
    });
    if (sort === "title") return [...list].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "year") return [...list].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    return list;
  }, [books, query, track, sort, onlyDownloadable]);

  const shelf = books.filter((book) => savedIds.has(book.id));
  const assistantContext = (slice === "shelf" && shelf.length ? shelf : books)
    .slice(0, 30)
    .map((book) => `- ${book.title} (${book.track_code}${book.subject ? `, ${book.subject}` : ""})`)
    .join("\n");

  async function toggleSave(book: Book) {
    if (!user) {
      toast.error("Sign in to save books to your shelf.");
      return;
    }
    if (savedIds.has(book.id)) {
      const { error } = await supabase.from("saved_books").delete().eq("book_id", book.id).eq("user_id", user.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Removed from your shelf");
    } else {
      const { error } = await supabase.from("saved_books").insert({ book_id: book.id, user_id: user.id });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Tucked into your shelf");
    }
    queryClient.invalidateQueries({ queryKey: ["saved_books", user.id] });
  }

  const trackCodes = (tracksQuery.data ?? []).map((item) => item.code);

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader slice={slice} onSlice={setSlice} />

      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-24">
        {slice === "library" ? (
          <>
            <section className="pt-8 pb-4 text-center sm:pt-12 sm:pb-6">
              <Logo className="mx-auto size-16 sm:size-24" />
              <p className="label-mono mt-4 text-cognac">Knowledge from elsewhere</p>
              <h1 className="mx-auto mt-3 max-w-3xl font-serif text-[1.75rem] leading-[1.15] text-ink sm:text-5xl sm:leading-[1.1]">
                Every book your exam asks for,
                <br />
                <span className="italic text-moss">quietly within reach.</span>
              </h1>

              <div className="mx-auto mt-6 flex max-w-2xl flex-col gap-2 rounded-2xl bg-paper p-3 ring-1 ring-border sm:mt-8 sm:flex-row sm:items-center sm:rounded-full sm:p-2 sm:pl-6">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search a title, author, subject or exam…"
                  className="flex-1 bg-transparent px-2 py-1 text-sm text-ink outline-none placeholder:text-ink-soft/70"
                />
                <button
                  onClick={() => setSlice("discover")}
                  className="w-full rounded-full bg-pine px-5 py-2.5 text-sm font-medium text-cream sm:w-auto"
                >
                  Search the web
                </button>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                {["ALL", ...trackCodes].map((code) => (
                  <button
                    key={code}
                    onClick={() => setTrack(code)}
                    className={`rounded-full px-4 py-2 text-xs font-medium ring-1 transition ${
                      track === code ? "bg-moss text-cream ring-moss" : "bg-paper text-ink-soft ring-border hover:text-ink"
                    }`}
                  >
                    {code === "ALL" ? "All exams" : code}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-ink-soft">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={onlyDownloadable}
                    onChange={(event) => setOnlyDownloadable(event.target.checked)}
                  />
                  Downloadable only
                </label>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as typeof sort)}
                  className="rounded-full border border-border bg-paper px-3 py-1.5 text-xs text-ink"
                >
                  <option value="newest">Newest first</option>
                  <option value="title">Title A–Z</option>
                  <option value="year">Year</option>
                </select>
              </div>
            </section>

            {booksQuery.isLoading ? (
              <LibraryLoader />
            ) : filtered.length === 0 ? (
              <div className="rounded-xl bg-paper p-6 text-sm text-ink-soft ring-1 ring-border">
                Nothing matches yet.{" "}
                <button onClick={() => setSlice("discover")} className="font-medium text-moss hover:underline">
                  Hunt for it across the internet
                </button>
                .
              </div>
            ) : (
              <>
                <BookRow title="Fresh on the shelf" books={filtered.slice(0, 12)} onOpen={setOpen} savedIds={savedIds} />
                {trackCodes.map((code) => (
                  <BookRow
                    key={code}
                    title={code}
                    books={filtered.filter((book) => book.track_code === code)}
                    onOpen={setOpen}
                    savedIds={savedIds}
                  />
                ))}
                <section className="mt-12">
                  <h3 className="mb-4 font-serif text-xl text-ink">Everything ({filtered.length})</h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
                    {filtered.map((book) => (
                      <BookTile key={book.id} book={book} onOpen={setOpen} saved={savedIds.has(book.id)} />
                    ))}
                  </div>
                </section>
              </>
            )}
          </>
        ) : null}

        {slice === "discover" ? (
          <section className="pt-8 sm:pt-12">
            <DiscoverPanel track={track} />
          </section>
        ) : null}

        {slice === "shelf" ? (
          <section className="pt-8 sm:pt-12">
            <p className="label-mono text-cognac">Your reading room</p>
            <h2 className="mt-3 font-serif text-2xl text-ink sm:text-3xl">My shelf</h2>
            <p className="mt-2 text-sm text-ink-soft">
              {shelf.length} book{shelf.length === 1 ? "" : "s"} saved · signed in as {displayName}
            </p>
            {shelf.length === 0 ? (
              <div className="mt-8 rounded-xl bg-paper p-6 text-sm text-ink-soft ring-1 ring-border">
                Your shelf is empty.{" "}
                <button onClick={() => setSlice("library")} className="font-medium text-moss hover:underline">
                  Browse the library
                </button>{" "}
                and tuck a few books away.
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
                {shelf.map((book) => (
                  <BookTile key={book.id} book={book} onOpen={setOpen} saved />
                ))}
              </div>
            )}
          </section>
        ) : null}

        {slice === "assistant" ? (
          <section className="grid gap-8 pt-8 sm:pt-12 lg:grid-cols-[1fr_360px]">
            <div>
              <p className="label-mono text-cognac">Ask, explain, quiz, plan</p>
              <h2 className="mt-3 font-serif text-2xl text-ink sm:text-3xl">Your study assistant</h2>
              <p className="mt-3 max-w-xl text-sm text-ink-soft">
                The assistant reads the {books.length} books in the catalogue{user ? " and your saved shelf" : ""} and
                answers in four modes: a direct answer, a first-principles explanation, a five-question mock quiz, or a
                dated study plan.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-ink-soft">
                <li>· “Explain the Preamble the way TNPSC asks it.”</li>
                <li>· “Quiz me on human physiology for NEET.”</li>
                <li>· “Plan my next 7 days for UPSC prelims polity.”</li>
              </ul>
            </div>
            <AssistantPanel context={assistantContext} />
          </section>
        ) : null}

        {slice === "manage" ? (
          <section className="pt-8 sm:pt-12">
            <p className="label-mono text-cognac">Librarian tools</p>
            <h2 className="mt-3 mb-8 font-serif text-2xl text-ink sm:text-3xl">Manage books</h2>
            {isAdmin ? (
              <AdminBooks />
            ) : (
              <p className="text-sm text-ink-soft">
                Admins only. Ask an existing admin to grant you access, or{" "}
                <Link to="/auth" className="text-moss hover:underline">
                  sign in
                </Link>
                .
              </p>
            )}
          </section>
        ) : null}
      </main>

      <BookDetail
        book={open}
        onClose={() => setOpen(null)}
        signedIn={Boolean(user)}
        saved={open ? savedIds.has(open.id) : false}
        onToggleSave={toggleSave}
      />

      <footer className="border-t border-border py-8 text-center">
        <Logo className="mx-auto size-10" />
        <p className="mt-2 font-serif text-lg text-ink">Ayal</p>
        <p className="mt-1 text-xs text-ink-soft">Knowledge from elsewhere, kept close.</p>
      </footer>
    </div>
  );
}
