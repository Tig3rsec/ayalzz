import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Cover images are stored either as an external link or as a path inside the
 * private "covers" storage bucket. This resolves both into a usable src.
 */
export function useCoverUrl(coverUrl?: string | null) {
  const isRemote = Boolean(coverUrl && /^https?:\/\//i.test(coverUrl));

  const signed = useQuery({
    queryKey: ["cover", coverUrl],
    enabled: Boolean(coverUrl) && !isRemote,
    staleTime: 45 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("covers").createSignedUrl(coverUrl!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });

  if (!coverUrl) return null;
  if (isRemote) return coverUrl;
  return signed.data ?? null;
}
