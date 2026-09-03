import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in to Ayal — exam study library" },
      {
        name: "description",
        content:
          "Sign in to Ayal with Google or email to save books to your shelf, download PDFs and ask the study assistant.",
      },
      { property: "og:title", content: "Sign in to Ayal" },
      {
        property: "og:description",
        content: "Access your shelf, downloads and the AI study assistant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          toast.success("Check your email to confirm your account.");
          return;
        }
        toast.success("Welcome to Ayal.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    try {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed.");
    }
  }

  async function handleForgotPassword(event: React.FormEvent) {
    event.preventDefault();
    if (!email) {
      toast.error("Enter your email first.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Check your email for a reset link.");
      setForgotMode(false);
      setBusy(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send reset email.");
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-cream px-6 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-pine">
            <span className="font-serif text-lg text-cream">A</span>
          </span>
          <span className="font-serif text-2xl text-ink">Ayal</span>
        </Link>

        <div className="rounded-2xl bg-paper p-7 ring-1 ring-border">
          <h1 className="font-serif text-2xl text-ink">
            {mode === "signin" ? "Welcome back" : "Create your shelf"}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Sign in to save books, download PDFs and ask the study assistant.
          </p>

          <button
            onClick={handleGoogle}
            className="mt-6 w-full rounded-full border border-border bg-cream px-5 py-3 text-sm font-medium text-ink transition hover:bg-cream/70"
          >
            Continue with Google
          </button>

          {forgotMode ? (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-ink-soft">
                <span className="h-px flex-1 bg-border" /> reset password
                <span className="h-px flex-1 bg-border" />
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-border bg-cream px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-soft/70"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full bg-pine px-5 py-3 text-sm font-medium text-cream disabled:opacity-60"
                >
                  {busy ? "Sending…" : "Send reset link"}
                </button>
                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="w-full text-center text-xs text-ink-soft hover:text-ink"
                >
                  ← Back to sign in
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-ink-soft">
                <span className="h-px flex-1 bg-border" /> or use email
                <span className="h-px flex-1 bg-border" />
              </div>

          {sent ? (
            <p className="rounded-xl bg-moss/10 p-4 text-sm text-ink">
              We sent a confirmation link to <strong>{email}</strong>. Open it to finish signing up.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-border bg-cream px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-soft/70"
              />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-border bg-cream px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-soft/70"
              />
              {mode === "signin" ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    className="text-xs font-medium text-moss underline-offset-2 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              ) : null}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-pine px-5 py-3 text-sm font-medium text-cream disabled:opacity-60"
              >
                {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-ink-soft">
            {mode === "signin" ? "New to Ayal?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setSent(false);
              }}
              className="font-medium text-moss underline-offset-2 hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>

            </>
          )}
        </div>
      </div>
    </div>
  );
}
