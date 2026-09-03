import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { AssistantPanel } from "@/components/AssistantPanel";
import { BookCard, type Book } from "@/components/BookCard";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "My shelf — Ayal" },
      {
        name: "description",
        content: "The books you saved on Ayal, ready to download, with the study assistant alongside.",
      },
      { property: "og:title", content: "My shelf — Ayal" },
      { property: "og:description", content: "Your saved exam prep books on Ayal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const savedQuery = useQuery({
    queryKey: ["shelf", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_books")
        .select(
          "book_id, books(id, title, author, track_code, subject, year, pages, edition, file_path, download_url, tucked_note)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => row.books).filter(Boolean) as unknown as Book[];
    },
  });

  const books = savedQuery.data ?? [];

  async function removeBook(book: Book) {
    if (!user) return;
    const { error } = await supabase
      .from("saved_books")
      .delete()
      .eq("book_id", book.id)
      .eq("user_id", user.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Removed from your shelf");
    queryClient.invalidateQueries({ queryKey: ["shelf", user.id] });
  }

  const context = books
    .map((book) => `- ${book.title} (${book.track_code}${book.subject ? `, ${book.subject}` : ""})`)
    .join("\n");

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 pb-20 pt-12">
        <p className="label-mono text-cognac">Your reading room</p>
        <h1 className="mt-3 font-serif text-4xl text-ink">My shelf</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {books.length} book{books.length === 1 ? "" : "s"} saved · signed in as {user?.email}
        </p>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            {savedQuery.isLoading ? (
              <p className="text-sm text-ink-soft">Fetching your shelf…</p>
            ) : books.length === 0 ? (
              <div className="rounded-xl bg-paper p-6 text-sm text-ink-soft ring-1 ring-border">
                Your shelf is empty.{" "}
                <Link to="/" className="font-medium text-moss hover:underline">
                  Browse the library
                </Link>{" "}
                and tuck a few books away.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {books.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    signedIn
                    saved
                    onToggleSave={removeBook}
                  />
                ))}
              </div>
            )}
          </div>
          <AssistantPanel context={context} />
        </section>
      </main>
    </div>
  );
}
