import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Reset password — Ayal" },
      {
        name: "description",
        content: "Set a new password for your Ayal account.",
      },
      { property: "og:title", content: "Reset password — Ayal" },
      { property: "og:description", content: "Set a new password for your Ayal account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // The recovery link opens this page with a session already in the URL hash.
    // Kick the client so it picks up the session before we try to update.
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        toast.error("This reset link has expired or was already used.");
        navigate({ to: "/auth", replace: true });
      }
    });
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast.success("Password updated. You can sign in now.");
      setTimeout(() => navigate({ to: "/auth", replace: true }), 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reset password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-cream px-6 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <Logo className="size-10" />
          <span className="font-serif text-2xl text-ink">Ayal</span>
        </Link>

        <div className="rounded-2xl bg-paper p-7 ring-1 ring-border">
          {done ? (
            <div className="text-center">
              <h1 className="font-serif text-2xl text-ink">Password updated</h1>
              <p className="mt-2 text-sm text-ink-soft">
                Your new password is set. Redirecting you to sign in…
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-2xl text-ink">Set a new password</h1>
              <p className="mt-1 text-sm text-ink-soft">Choose a new password for your Ayal account.</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full rounded-xl border border-border bg-cream px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-soft/70"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded-xl border border-border bg-cream px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-soft/70"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full bg-pine px-5 py-3 text-sm font-medium text-cream disabled:opacity-60"
                >
                  {busy ? "Saving…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
