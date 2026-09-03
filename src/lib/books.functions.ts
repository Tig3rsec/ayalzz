import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DownloadInput = z.object({ bookId: z.string().uuid() });

export const getBookDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DownloadInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: book, error } = await supabase
      .from("books")
      .select("file_path, title")
      .eq("id", data.bookId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!book?.file_path) throw new Error("This book has no file uploaded yet.");

    const { data: signed, error: signError } = await supabase.storage
      .from("books")
      .createSignedUrl(book.file_path, 60 * 10, { download: `${book.title}.pdf` });

    if (signError || !signed?.signedUrl) {
      throw new Error(signError?.message ?? "Could not create a download link.");
    }

    return { url: signed.signedUrl };
  });
