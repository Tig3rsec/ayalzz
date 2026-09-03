import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { AdminBooks } from "@/components/AdminBooks";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Manage books — Ayal admin" },
      {
        name: "description",
        content: "Add, upload, edit and remove exam prep books in the Ayal library.",
      },
      { property: "og:title", content: "Manage books — Ayal" },
      { property: "og:description", content: "Admin tools for the Ayal exam library." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function AdminPage() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-cream">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="font-serif text-3xl text-ink">Admins only</h1>
          <p className="mt-3 text-sm text-ink-soft">
            This page manages the library catalogue. Ask an existing admin to grant you access, or{" "}
            <Link to="/auth" className="text-moss hover:underline">
              sign in
            </Link>{" "}
            with an admin account.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 pb-20 pt-12">
        <p className="label-mono text-cognac">Librarian tools</p>
        <h1 className="mt-3 mb-8 font-serif text-4xl text-ink">Manage books</h1>
        <AdminBooks />
      </main>
    </div>
  );
}
