import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Book } from "@/components/BookCard";

const empty = {
  title: "",
  author: "",
  track_code: "TNPSC",
  subject: "",
  edition: "",
  year: "",
  pages: "",
  download_url: "",
  cover_url: "",
  tucked_note: "",
};

export function AdminBooks() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...empty });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");

  const tracksQuery = useQuery({
    queryKey: ["exam_tracks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_tracks").select("code, name").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const booksQuery = useQuery({
    queryKey: ["admin_books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id, title, author, track_code, subject, year, pages, edition, cover_url, file_path, download_url, tucked_note")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Book[];
    },
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin_books"] });
    queryClient.invalidateQueries({ queryKey: ["books"] });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Your session expired — sign in again.");

      let filePath: string | null = null;
      if (file) {
        const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
        const { error: uploadError } = await supabase.storage.from("books").upload(path, file);
        if (uploadError) throw uploadError;
        filePath = path;
      }

      let coverPath: string | null = null;
      if (coverFile) {
        const path = `${crypto.randomUUID()}-${coverFile.name.replace(/[^\w.-]+/g, "_")}`;
        const { error: coverError } = await supabase.storage.from("covers").upload(path, coverFile, {
          contentType: coverFile.type || "image/jpeg",
        });
        if (coverError) throw coverError;
        coverPath = path;
      }

      const payload = {
        title: form.title.trim(),
        author: form.author.trim() || null,
        track_code: form.track_code,
        subject: form.subject.trim() || null,
        edition: form.edition.trim() || null,
        year: form.year ? Number(form.year) : null,
        pages: form.pages ? Number(form.pages) : null,
        download_url: form.download_url.trim() || null,
        cover_url: coverPath ?? (form.cover_url.trim() || null),
        tucked_note: form.tucked_note.trim() || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("books")
          .update(filePath ? { ...payload, file_path: filePath } : payload)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Book updated.");
      } else {
        const { error } = await supabase
          .from("books")
          .insert({ ...payload, file_path: filePath, created_by: userId });
        if (error) throw error;
        toast.success("Book added to the library.");
      }

      setForm({ ...empty });
      setEditingId(null);
      setFile(null);
      setCoverFile(null);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the book.");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(book: Book) {
    setEditingId(book.id);
    setForm({
      title: book.title,
      author: book.author ?? "",
      track_code: book.track_code,
      subject: book.subject ?? "",
      edition: book.edition ?? "",
      year: book.year ? String(book.year) : "",
      pages: book.pages ? String(book.pages) : "",
      download_url: book.download_url ?? "",
      cover_url: book.cover_url ?? "",
      tucked_note: book.tucked_note ?? "",
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(book: Book) {
    const { error } = await supabase.from("books").delete().eq("id", book.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (book.file_path) await supabase.storage.from("books").remove([book.file_path]);
    toast.success("Book removed.");
    if (editingId === book.id) {
      setEditingId(null);
      setForm({ ...empty });
    }
    refresh();
  }

  const field = "w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm text-ink outline-none";
  const books = (booksQuery.data ?? []).filter((book) =>
    filter ? `${book.title} ${book.author ?? ""} ${book.track_code}`.toLowerCase().includes(filter.toLowerCase()) : true,
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <form onSubmit={handleSubmit} className="h-fit space-y-3 rounded-2xl bg-paper p-6 ring-1 ring-border">
        <h3 className="font-serif text-xl text-ink">{editingId ? "Edit book" : "Add a book"}</h3>
        <input required className={field} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className={field} placeholder="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
        <select className={field} value={form.track_code} onChange={(e) => setForm({ ...form, track_code: e.target.value })}>
          {(tracksQuery.data ?? []).map((track) => (
            <option key={track.code} value={track.code}>
              {track.name}
            </option>
          ))}
        </select>
        <input className={field} placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <input className={field} placeholder="Edition (e.g. NCERT Class XI, 2023)" value={form.edition} onChange={(e) => setForm({ ...form, edition: e.target.value })} />
        <div className="flex gap-3">
          <input className={field} placeholder="Year" inputMode="numeric" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
          <input className={field} placeholder="Pages" inputMode="numeric" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} />
        </div>
        <input className={field} placeholder="Cover image link (optional)" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} />
        <input className={field} placeholder="Public file link (optional)" value={form.download_url} onChange={(e) => setForm({ ...form, download_url: e.target.value })} />
        <textarea className={field} rows={2} placeholder="A short note for readers" value={form.tucked_note} onChange={(e) => setForm({ ...form, tucked_note: e.target.value })} />
        <div>
          <label className="label-mono text-ink-soft">Upload a cover image</label>
          <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} className="mt-2 w-full text-xs text-ink-soft" />
        </div>
        <div>
          <label className="label-mono text-ink-soft">Upload a PDF</label>
          <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-2 w-full text-xs text-ink-soft" />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="flex-1 rounded-full bg-pine px-5 py-3 text-sm font-medium text-cream disabled:opacity-60">
            {busy ? "Saving…" : editingId ? "Save changes" : "Add to library"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ ...empty });
              }}
              className="rounded-full border border-border px-4 text-sm text-ink"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div>
        <div className="mb-4 flex items-center gap-3">
          <h3 className="font-serif text-xl text-ink">Catalogue</h3>
          <span className="label-mono text-ink-soft">{books.length} books</span>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter…"
            className="ml-auto w-40 rounded-full border border-border bg-cream px-4 py-1.5 text-xs text-ink outline-none"
          />
        </div>
        <div className="space-y-2">
          {books.map((book) => (
            <div key={book.id} className="flex items-center justify-between gap-4 rounded-xl bg-paper p-4 ring-1 ring-border">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{book.title}</p>
                <p className="truncate text-xs text-ink-soft">
                  {[book.author, book.edition, book.track_code].filter(Boolean).join(" · ")}
                  {book.download_url || book.file_path ? " · file attached" : " · no file"}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => startEdit(book)} className="rounded-full border border-border px-4 py-2 text-xs text-ink">
                  Edit
                </button>
                <button onClick={() => handleDelete(book)} className="rounded-full border border-border px-4 py-2 text-xs text-ink">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
