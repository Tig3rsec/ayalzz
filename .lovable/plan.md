# Build the Ayal library features

## Scope
- Add a public “Recommended to me” book shelf and visitor submission form.
- Add signed-in reading status and pages-read tracking to the existing book detail view.
- Connect the library search field to natural-language matching against the current book catalogue, with clear error handling.
- Refine the existing book rendering so the shelf stays warm and tactile, and opening a book visibly reveals its inside pages.

## Approach
1. Add recommendations and owner-only reading progress using additive Lovable Cloud tables, explicit grants, and row-level policies. Enforce form limits and page-count bounds in the database as well as the interface.
2. Build the visitor recommendation shelf/form and signed-in progress controls using the existing book-detail and library patterns.
3. Add a server-only AI search function that ranks only validated catalogue IDs and updates the current search results; retain ordinary text search if AI is unavailable.
4. Refine book-cover, spine, shelf, hover, and opening states using the existing warm palette and the uploaded HTML as the visual reference, without replacing page navigation or existing book actions.
5. Test page-count limits and verify submission, progress, search, book opening, and preview health.

## Technical details
- Keep recommendations publicly readable and insertable, with database-enforced input length bounds; do not collect visitor email addresses.
- Keep reading progress scoped to the signed-in owner and an existing catalogue book.
- Use the existing TanStack server-function boundary and Lovable AI Gateway for AI search; never expose the AI key in the browser.
- Preserve reduced-motion support, mobile layout, and existing saved/download behavior.