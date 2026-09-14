# Animate only the books

## Scope
Keep the page structure, search, filters, navigation, colors, and data unchanged. Modify only book presentation and book-related loading states.

## Changes
- Rework each book tile into a tactile 3D book with a visible spine, page edges, subtle cover depth, and varied physical proportions derived from existing book data.
- Add the requested shelf feel directly behind book rows: grounded shelf rails, perspective, and gentle lift/tilt on hover or keyboard focus.
- Animate opening from the selected book into the existing detail view: the book moves forward and its cover swings open before the details settle.
- Use the existing animated bound-book mark while book data loads.
- Preserve every current action: opening details, saving, downloading, filtering, and keyboard close.
- Respect reduced-motion settings and keep the effect usable on mobile.

## Technical details
- Extend `BookTile`/`BookRow` with deterministic physical styling from each existing book's title, page count, and cover.
- Extend `BookDetail` with an entrance/exit phase and CSS 3D cover hinge; no data or backend changes.
- Add scoped shelf, book, opening, and loader animation classes in the global stylesheet.
- Replace only the library's plain loading text with the existing `LibraryLoader`.
- Verify compilation plus desktop and mobile rendering in the live preview.
