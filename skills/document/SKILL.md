---
name: document
description: Document one module across the repos in the current folder — handover-grade Markdown + PDF with branded diagrams and screenshots.
disable-model-invocation: true
---

# Document a module

Produce a **handover-grade** technical document for one module that spans the repos under the current folder (typically a Next.js frontend and a NestJS backend). The reader has never seen the code. The document explains **how it works and why** before it lists what exists, and it is concise: every paragraph earns its place.

Output, under `<docs>/<module>/`: `<module>.md`, `<module>.pdf`, `assets/brand/`, `assets/diagrams/*.html + *.png`, `assets/screenshots/*.png`.

Arguments: `$ARGUMENTS` = one module name. Several names → run the whole procedure once per module, in the order given. Empty → ask which module after step 1, offering the candidates you found. `--check` (alone or with names) → **check mode**: steps 0, 1 and 9b only — report every document's freshness (`check-stale.mjs`, plus `changes-since.mjs` for the stale ones) and refresh the index; generate nothing, ask nothing.

All relative paths below are inside this skill's base directory (shown when the skill loads). Scripts run with `node` or `bash`; they need Chrome and Node, nothing else.

## 0. Preflight

`bash scripts/doctor.sh` (add `--pro` once the wizard chose the Pro engine). `NOT READY` → show the user exactly what is missing with the install command printed, and stop; the document cannot be checked without these tools. Warnings do not stop the run.

## 1. Map the ground

- Root = current working directory. Two shapes:
  - **Multi-repo folder**: child directories with their own `package.json`/`composer.json`/`.git` (also `apps/*`, `packages/*` in a monorepo) are the repos.
  - **Single repo** (cwd itself has `.git` and a `package.json`/`composer.json`/`pyproject.toml`, and no child repos): the one repo is `"."` — a monolith such as Laravel + Blade/Inertia or Django + templates is both frontend and backend. Stamp, stale check and index all accept `"."` as the repo key.
  - Neither shape (cwd is a plain folder without repos, or a subfolder of a repo): stop and ask where the root is.
  Classify each repo by dependencies (`next` → frontend, `@nestjs/core` → backend, `laravel/framework` → monolith, …) per the detection table in `DISCOVERY.md`. A repo with no relation to the module is still listed, then ignored.
- Read `<root>/.codebase-docs.json` if it exists — the previous wizard answers, including `outputDir`. `<docs>` = that `outputDir`, else `<root>/docs`.
- Run `node scripts/check-stale.mjs <docs> <root>` — existing docs and whether the code they cover changed (committed or uncommitted) since they were generated. `BAD-STAMP` and `UNSTAMPED` docs are reported to the user as well.

**Done when:** every repo has a label, the root is confirmed, and you know every existing doc and its freshness.

## 2. Wizard

Follow [`WIZARD.md`](WIZARD.md). Ask with AskUserQuestion, at most three rounds. Stale docs are offered first: "Y changed since its doc. Update Y first, then X?"

**Done when:** every answer in the wizard checklist is written to `<root>/.codebase-docs.json`, the brand is exported to `<docs>/<module>/assets/brand/`, and — for a funded project — every banner and identifier the programme requires is on disk and in the config. Funding data that is missing or unclear stops the run here: ask, wait, never guess.

## 3. Discover the module

Follow [`DISCOVERY.md`](DISCOVERY.md) — it names the framework notes to load per repo. One Explore agent per repo, in parallel; you verify their claims by reading the files they name. Keep the module map in the scratchpad, never in `<docs>`. Save the module's file list per repo (`<scratchpad>/files-<repo>.txt`): the dependency report and the stamp's `paths` come from it.

**Done when:** every backend endpoint of the module has its frontend caller (or "no UI caller"), every frontend screen of the module has its backend calls, every external system it touches is named, the 3–7 user flows are listed with their steps, the dependency report exists per repo, and the security/operations notes carry file references.

## 4. Write the document

Follow [`DOC-TEMPLATE.md`](DOC-TEMPLATE.md). Write `<docs>/<module>/<module>.md` with the stamp comment on line 1, filled in now: per repo the current `HEAD` SHA and the covered paths, `dirty` listing every repo whose covered paths have uncommitted changes (`git status --porcelain -- <paths>`), language, labels, funding. The cover is built from this stamp, so it is complete before the first build. Reference diagrams and screenshots by their future paths and keep a list of them — steps 5 and 6 create them.

Then `node scripts/verify-endpoints.mjs <module.md> --repo <root>/<backend>` — every row of the API table must be `found`; a `NOT FOUND` row is either a wrong path in the table or a route you have not read yet, and both are fixed before going on. When the wizard asked for a one-pager, write `<module>.onepager.md` too (template in `DOC-TEMPLATE.md`).

**Done when:** every template section is filled or deliberately removed, no sentence is a placeholder, and the endpoint verifier reports every route found.

## 5. Diagrams

Follow [`DIAGRAMS.md`](DIAGRAMS.md). Every diagram is hand-authored HTML from `templates/diagram.html`, rendered with `bash scripts/render-diagram.sh`, then **looked at** and fixed. With engine `pro`, the checked PNG is then polished by `node scripts/gen-image.mjs` per [`NANO-BANANA.md`](NANO-BANANA.md) and checked again.

**Done when:** every PNG the document references exists, has been viewed, and passes the checklist in `DIAGRAMS.md`.

## 6. Screenshots (only when the wizard gave a URL)

Load the `claude-in-chrome` skill. Open a new tab, resize the window to 1440×900. For each screen named in a user flow: navigate, wait for the data to load, screenshot with `save_to_disk: true`, copy the file to `assets/screenshots/<flow>-<step>.png`. If you land on a login page, ask the user to sign in in that tab, then continue. Never type credentials. Where a step points at a control, mark it: `node scripts/annotate.mjs <in.png> <out.png> --mark x,y,"label"` (coordinates from the screenshot you looked at; numbers match the flow's steps) and reference the annotated file.

**Done when:** every screen named in a flow has a screenshot, or the document says "not captured: <reason>" where the image would be.

## 7. Build

`node scripts/build-pdf.mjs <docs>/<module>/<module>.md --history` → `<module>.html`, `<module>.pdf` and a dated copy under `history/`. Add `--docx` when the wizard asked for DOCX. One-pager: `node scripts/build-pdf.mjs <docs>/<module>/<module>.onepager.md --compact --history`.

## 8. QA — the document is not done until you have read it the way the reader will

Follow [`QA.md`](QA.md): rasterize the PDF with `bash scripts/pdf-pages.sh`, read every page, read every PNG, fix, rebuild, read again. Loop until one full pass finds nothing.

**Done when:** one complete pass with zero findings, and every leftover known issue is written in the final report.

## 9. Confirm the stamp and report

Re-read each repo's `HEAD` and dirty state. If either changed since step 4 (someone committed while you worked), update the stamp, rebuild (step 7) and re-read the cover page; otherwise the stamp stands. Update `<root>/.codebase-docs.json` with `updatedAt`.

### 9b. Index

`node scripts/docs-index.mjs <docs> <root>` — rewrites `<docs>/README.md`, `<docs>/index.html` (static site entry, links every module's HTML/PDF/one-pager), `<docs>/glossary.md` (terms from every module; a term defined differently twice is flagged — align the documents) and `<docs>/assets/modules.png` (module map from each stamp's `calls`). Open `index.html` once in the renderer if it is the first time (`bash scripts/render-diagram.sh <docs>/index.html <scratchpad>/index.png`) and look at it.

Report to the user: the `.md`, `.pdf` and index paths, page count, diagram count, screenshots captured or skipped, repos generated from a dirty tree, glossary conflicts, and anything you could not verify. On macOS open the PDF for the user (`open <pdf>`).

## Updating a stale document

When step 1 finds the module's doc stale: `node scripts/changes-since.mjs <module.md> <root>` gives the commits, changed files and the route/entity/config lines added or removed since the stamp. Read the changed files, update only the affected sections and diagrams, keep the rest word for word, and write the **"What changed since <date>"** section (template in `DOC-TEMPLATE.md`) right after the summary — the previous reader reads only that. Then run steps 4's verifier and 7–9. A doc with no stamp cannot be diffed: ask whether to regenerate or to fold the existing text in.
