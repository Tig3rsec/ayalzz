import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAvatarUrl } from "@/lib/avatar";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Your profile — Ayal study library" },
      {
        name: "description",
        content:
          "Update your Ayal profile: change your display name, pick your exam track and upload a profile picture.",
      },
      { property: "og:title", content: "Your Ayal profile" },
      {
        property: "og:description",
        content: "Edit your display name, exam track and profile picture.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [examTrack, setExamTrack] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const tracksQuery = useQuery({
    queryKey: ["exam_tracks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_tracks")
        .select("code, name")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const profileQuery = useQuery({
    queryKey: ["profile-page", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, exam_track, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    setDisplayName(profileQuery.data.display_name ?? "");
    setExamTrack(profileQuery.data.exam_track ?? "");
    setAvatarPath(profileQuery.data.avatar_url ?? null);
  }, [profileQuery.data]);

  const avatarUrl = useAvatarUrl(avatarPath);

  async function handleUpload(file: File) {
    if (!user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Please pick an image under 2 MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
      if (error) throw error;

      setAvatarPath(path);
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["profile-page", user.id] });
      toast.success("Profile picture updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          exam_track: examTrack || null,
        })
        .eq("id", user.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["profile-page", user.id] });
      toast.success("Profile saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
        <p className="label-mono text-cognac">Your account</p>
        <h1 className="mt-2 font-serif text-2xl text-ink sm:text-3xl">Profile</h1>
        <p className="mt-2 text-sm text-ink-soft break-all">{user?.email}</p>

        <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl bg-paper p-5 ring-1 ring-border sm:flex-row sm:items-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Your profile picture"
              className="size-20 rounded-full object-cover ring-1 ring-border"
            />
          ) : (
            <span className="grid size-20 place-items-center rounded-full bg-pine font-serif text-2xl text-cream">
              {(displayName || user?.email || "A").charAt(0).toUpperCase()}
            </span>
          )}
          <div className="text-center sm:text-left">
            <p className="text-sm text-ink">Profile picture</p>
            <p className="mt-1 text-xs text-ink-soft">JPG or PNG, up to 2 MB.</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUpload(file);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="mt-3 rounded-full border border-border px-4 py-2 text-xs font-medium text-ink disabled:opacity-60"
            >
              {uploading ? "Uploading…" : avatarPath ? "Change picture" : "Upload picture"}
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-4 rounded-2xl bg-paper p-5 ring-1 ring-border">
          <div>
            <label htmlFor="display-name" className="label-mono text-ink-soft">
              Display name
            </label>
            <input
              id="display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="How should we call you?"
              className="mt-2 w-full rounded-xl border border-border bg-cream px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-soft/70"
            />
          </div>

          <div>
            <label htmlFor="exam-track" className="label-mono text-ink-soft">
              Exam track
            </label>
            <select
              id="exam-track"
              value={examTrack}
              onChange={(event) => setExamTrack(event.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-cream px-4 py-3 text-sm text-ink outline-none"
            >
              <option value="">No preference</option>
              {(tracksQuery.data ?? []).map((track) => (
                <option key={track.code} value={track.code}>
                  {track.code} — {track.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-pine px-6 py-3 text-sm font-medium text-cream disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <Link to="/" className="text-sm text-ink-soft hover:text-ink">
              Back to library
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
