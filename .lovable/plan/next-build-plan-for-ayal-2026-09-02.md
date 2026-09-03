# Next build plan for Ayal

## Goal
Fix the live UX issues the user reported and add a profile page:

1. **Mobile responsiveness** – make the home library, book tiles, detail modal, and Find-online panels usable on small screens.
2. **Reliable downloads / external links** – avoid popup-blockers on mobile by resolving links first, then opening them synchronously or showing a clickable result.
3. **Profile page** – let signed-in users upload an avatar and edit their display name / exam track.
4. **Forgot password visibility** – ensure the existing reset flow is easy to find and robust.

## Files to change / create

- `src/styles.css` – add small-screen utility tweaks.
- `src/routes/index.tsx` – responsive grid/flex adjustments for hero, filters, and rows.
- `src/components/BookTile.tsx` – larger touch targets, better row scrolling on mobile.
- `src/components/BookDetail.tsx` – stack cover/details vertically on small screens, full-width action buttons.
- `src/components/DiscoverPanel.tsx` – responsive dork grid, explicit external link handling.
- `src/lib/download.ts` – resolve link before opening; fall back to a copyable link when a popup is blocked.
- `src/components/SiteHeader.tsx` – add avatar/profile link and dropdown for signed-in users.
- `src/routes/_authenticated/profile.tsx` – new page: edit display name, exam track, upload avatar.
- `src/integrations/supabase/types.ts` – add `avatar_url` to `profiles`.
- `supabase/migrations/2026*_profile_avatars.sql` – add `avatar_url` column + `avatars` storage bucket + RLS policies.
- `src/routes/auth.tsx` – move "Forgot password?" closer to the password field.

## Verification
- TypeScript check passes.
- Preview checked at 375 px and 1280 px widths.
- Signed-in user can open profile, change name, upload avatar.
- Download and Find-online links open without popup warnings.
