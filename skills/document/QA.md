# QA pass

Read the document the way the reader will: as pages and as pictures. Findings are fixed at the source (`.md`, diagram `.html`, screenshot), then rebuilt, then re-read. Stop only after a pass with zero findings.

## 1. Pages

`bash scripts/pdf-pages.sh <module>.pdf <scratchpad>/pages 80` then read every `page-NN.png` (a contact sheet is fine for layout, single pages for text).

- Cover: title, subtitle, company, audience, date, repo SHAs, logo — all filled, no `{{…}}`.
- Contents: every `##`/`###` present, in order.
- Headings never sit alone at the bottom of a page; insert `<div class="page-break"></div>` before an orphaned heading.
- Tables fit the width, no cut columns; long paths wrap rather than overflow.
- Figures render (no broken image), are readable at page width, and have captions.
- Language consistent — no English sentence in a Romanian document (identifiers excepted).
- No placeholder, "TODO", "lorem", stray brackets, duplicated paragraph, or numbered list that restarts.
- Code blocks do not overflow the page.
- Page count within the depth target.
- Funded project: banners, sentence and identifiers on the cover; the bar on every page at the chosen placement, not overlapping text; the sentence spelled exactly as the programme requires.
- A faint grey box around images in the `pdftoppm` renders (1 level off white) is a poppler colour-profile artefact, not a defect — real viewers show white. Anything darker than that is a defect.

## 2. Diagrams

The `DIAGRAMS.md` checklist on every PNG, including polished ones (`NANO-BANANA.md` fidelity check).

## 3. Screenshots

Readable, same viewport size, no personal data (blur or re-shoot a seeded/demo account), each referenced by the step it illustrates.

## 4. Content

- Every claim traces to a file you read; the endpoint table equals the discovery map; step numbers in text equal the swimlane.
- Summary answers what, why, how in ≤150 words.
- The "why" of each design choice has a source or is marked inferred.
- Nothing in the document belongs to another module (scope creep) and nothing the module owns is missing.
- Dependencies table matches the report output; every "watch list" and security/monitoring item points to a file or a package, none is generic advice.
- `verify-endpoints.mjs` reports every route found (re-run it after any edit to the API table).
- One-pager: exactly one page. Index: every module listed, the module map renders, glossary conflicts reported to the user.

## 5. Loop

Fix → `node scripts/build-pdf.mjs` → re-read the pages you touched → full pass again. Report leftovers explicitly ("screenshot of step 4 not captured: page requires admin role").
