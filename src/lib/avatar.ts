import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolves an avatar path into a signed URL. External URLs are used as-is.
 */
export function useAvatarUrl(path?: string | null) {
  const isRemote = Boolean(path && /^https?:\/\//i.test(path));

  const signed = useQuery({
    queryKey: ["avatar", path],
    enabled: Boolean(path) && !isRemote,
    staleTime: 45 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("avatars").createSignedUrl(path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });

  if (!path) return null;
  if (isRemote) return path;
  return signed.data ?? null;
}
