import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

function fromEmail(email?: string | null) {
  if (!email) return "";
  const handle = email.split("@")[0] ?? "";
  return handle
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Profile display name, else the name from the Google/Gmail account, else the email handle. */
export function useDisplayName(user: User | null) {
  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, exam_track")
        .eq("id", user!.id)
        .maybeSingle();
      return data ?? null;
    },
  });

  if (!user) return { name: "", initial: "", avatarUrl: null, examTrack: null };

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const metaName =
    (typeof meta?.["full_name"] === "string" && meta["full_name"]) ||
    (typeof meta?.["name"] === "string" && meta["name"]) ||
    (typeof meta?.["display_name"] === "string" && meta["display_name"]) ||
    "";

  const name = (profile.data?.display_name || metaName || fromEmail(user.email) || "Reader").toString();
  return {
    name,
    initial: name.charAt(0).toUpperCase(),
    avatarUrl: profile.data?.avatar_url ?? null,
    examTrack: profile.data?.exam_track ?? null,
  };
}
