import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { useDisplayName } from "@/hooks/useDisplayName";
import { useAvatarUrl } from "@/lib/avatar";
import { Logo } from "@/components/Logo";

export type SliceId = "library" | "discover" | "shelf" | "assistant" | "manage";

function Avatar({ url, initial }: { url: string | null; initial: string }) {
  const resolved = useAvatarUrl(url);
  if (resolved) {
    return (
      <img
        src={resolved}
        alt=""
        className="size-8 shrink-0 rounded-full object-cover ring-1 ring-border"
      />
    );
  }
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-pine text-xs font-medium text-cream">
      {initial}
    </span>
  );
}

export function SiteHeader({
  slice,
  onSlice,
}: {
  slice?: SliceId;
  onSlice?: (slice: SliceId) => void;
}) {
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const { name, initial, avatarUrl } = useDisplayName(user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const tabs: Array<{ id: SliceId; label: string; show: boolean }> = [
    { id: "library", label: "Library", show: true },
    { id: "discover", label: "Find online", show: true },
    { id: "shelf", label: "My shelf", show: Boolean(user) },
    { id: "assistant", label: "Assistant", show: true },
    { id: "manage", label: "Manage", show: isAdmin },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-cream/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <Logo className="size-9 sm:size-10" />
          <span className="font-serif text-lg tracking-tight text-ink sm:text-xl">Ayal</span>
        </Link>

        {onSlice ? (
          <nav className="hidden items-center gap-1 md:flex">
            {tabs
              .filter((tab) => tab.show)
              .map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onSlice(tab.id)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    slice === tab.id ? "bg-pine text-cream" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
          </nav>
        ) : null}

        {user ? (
          <div className="relative flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full p-1 pr-3 ring-1 ring-border transition hover:bg-paper"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <Avatar url={avatarUrl} initial={initial} />
              <span className="hidden max-w-[120px] truncate text-sm text-ink sm:inline" title={user.email ?? ""}>
                {name}
              </span>
            </button>

            {menuOpen ? (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl bg-paper p-2 shadow-lg ring-1 ring-border">
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-xl px-4 py-2 text-sm text-ink hover:bg-cream"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      void handleSignOut();
                    }}
                    className="w-full rounded-xl px-4 py-2 text-left text-sm text-ink hover:bg-cream"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <Link
            to="/auth"
            className="rounded-full bg-pine px-4 py-2 text-sm font-medium text-cream ring-1 ring-pine sm:px-5"
          >
            Sign in
          </Link>
        )}
      </div>

      {onSlice ? (
        <div className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
          {tabs
            .filter((tab) => tab.show)
            .map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSlice(tab.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${
                  slice === tab.id ? "bg-pine text-cream" : "bg-paper text-ink-soft ring-1 ring-border"
                }`}
              >
                {tab.label}
              </button>
            ))}
        </div>
      ) : null}
    </header>
  );
}
