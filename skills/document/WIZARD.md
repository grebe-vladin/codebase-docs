# Wizard

Ask with **AskUserQuestion**: at most four questions per call. Ask in the user's language. Pre-fill from `<root>/.codebase-docs.json` and from the brand store — a remembered answer becomes the first option, marked "(Recommended)". Skip a question whose answer is already known and unchanged. Facts you can look up yourself (repo names, existing brands, programme lists) are never questions.

## Round A — always

1. **Stale docs** (only if `check-stale.mjs` reported any): list them with the number of changed files, committed and uncommitted. Options: update them first, then `<module>` / only `<module>` now / skip.
2. **Company / brand**: options from `node scripts/brand.mjs list` plus "New company". The brand is keyed by company so the same brand serves every project of that company.
3. **Language** of the document: Romanian / English / other.
4. **Audience & purpose** — sets tone and depth (table in `DOC-TEMPLATE.md`): Developers, onboarding / Developers + product, handover / Client delivery, external / Audit, due diligence.

## Round B — always

5. **Output folder**: `<root>/docs` (Recommended) / another path.
6. **Screenshots**: URL of the running app (local `http://localhost:3000`, staging URL) / no screenshots. The user signs in themselves in the Chrome tab.
7. **Diagram engine**: HTML (Recommended — exact text, editable, free) / Pro polish (Nano Banana Pro restyles each HTML diagram; needs `GEMINI_API_KEY` in the environment; ~$0.13 per image; layout and text stay fixed by the reference image). If Pro is chosen and the key is not set, say so and fall back to HTML — never ask for the key in chat.
8. **Funded project?** No / Yes. A funded project (EU, PNRR, national grant) must carry the programme's banners and wording on the document — Round D collects them.
9. **Extra outputs**: none (Recommended) / one-pager PDF for decision makers / DOCX for clients who edit (needs pandoc) / both. Stored as `extras` in the config.

## Round C — new company only

10. **Where does the brand come from?** A website URL / a folder on disk (logos, brand guidelines, banners) / I will type it. Then:
   - URL or folder → `node scripts/brand.mjs probe --website <url> | --folder <dir> --out <scratchpad>/brand-probe`. It downloads logo/icon candidates and lists the most used colours. **Look at every candidate image** (Read) and pick the real logo; take the primary colour from the site's theme-colour or the dominant brand colour, the accent from the second one. Show the user your pick (logo file, two hex colours) as the recommended option of the next question, with "other" open.
   - Typed → ask: logo path (absolute; copied into the store, or "none"), primary hex, accent hex.
11. **Font**: Inter (Recommended) / another Google Font name.

Then: `node scripts/brand.mjs set --name "<Company>" --logo <path> --primary "#…" --accent "#…" [--font "…"]`. The company's own permanent banners (partner logos it always prints) go in with `--banner <file>`; funding banners do **not** — they are per project (Round D).

## Round D — funded project only

`node scripts/funding-assets.mjs list` first: it prints every programme on file (`templates/funding/programs.json`), its confirmed banner set, its official sources and its rules.

12. **Programme**: the entries of `programs.json` by name, plus "Other / not listed". Funding wording and logos differ per programme (PoCIDIF ≠ PNRR ≠ POC), so this is never assumed.
13. **Identifiers** the programme requires (`requires`): SMIS code, contract number, project title, beneficiary — one question, free text, all of them. PoCIDIF also needs the funding mix: FEDR + state budget → "Cofinanțat de Uniunea Europeană", FEDR only → "Finanțat de Uniunea Europeană" (`textVariants`). "Other" programmes: the official sentence too.
14. **Banners** — the official set, confirmed by a person:
   - Programme has `banners` confirmed (`confirmedBy`, `confirmedAt` in `programs.json`): show the three images (Read them, name them: EU emblem with the statement, Guvernul României, programme logo) and ask "Use this official set (Recommended — verified against <manual> on <date>) / replace with my own files". Yes → done.
   - No confirmed set: `node scripts/funding-assets.mjs fetch <programme>` downloads the official packs (ec.europa.eu, mfe.gov.ro, identitate.gov.ro; ZIPs are unzipped, `.ai`/`.pdf` logos rasterised and trimmed), then prints the recommended files. **Look at each one**, show the user which file plays which role, ask for confirmation, then `node scripts/funding-assets.mjs confirm <programme> <files…> --by "<user name>"` — the files are copied into `templates/funding/<programme>/` and recorded in `programs.json`.
   - Download fails or "Other" programme: ask for a folder or file paths (or a website to probe) and confirm the same way. Never assemble a set from memory or from unofficial sources.
15. **Placement**: the programme's default (`placement` in `programs.json`, from its manual) is the recommended option; header on every page / footer on every page / both / cover only.

**Done when:** programme, every required identifier, a confirmed banner set on disk, the sentence, and the placement are all known. Anything missing or contradictory (a code that does not look like a SMIS code, a banner for another programme) → ask again and wait. A funded-project document is never produced with incomplete or guessed funding data.

## After the wizard

- `node scripts/brand.mjs export --company <slug> --out <docs>/<module>/assets/brand` — writes `brand.css`, `brand.json`, the logo and company banners; diagrams and the PDF link to these.
- Funded project: copy the programme's banners to `<docs>/<module>/assets/brand/funding/` and put the funding block in the stamp (`DOC-TEMPLATE.md`).
- Write `<root>/.codebase-docs.json`: `{ "company": "<slug>", "language", "audience", "outputDir", "screenshotsUrl", "engine", "depth", "extras": ["onepager","docx"], "funding": { "program", "placement", "identifiers": {…}, "text", "banners": [ "funding/eu.png", … ] } | null, "updatedAt" }`.

Brand store: `~/.codebase-docs/brands/<slug>/brand.json` + logo + `banners/`. Outside the plugin, so plugin updates never lose it. Funding assets live inside the plugin under `templates/funding/<programme>/` (confirmed PNGs are committed; `downloads/` is not).
