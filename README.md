# codebase-docs

A [Claude Code](https://claude.com/claude-code) plugin that documents **one module across several repos** and produces a handover-grade **Markdown + PDF**: architecture and user-flow diagrams in your brand colours, screenshots of the real screens, the packages the module actually uses, and what to watch for in security and operations.

Typical setup: one folder, several repos inside it.

```
/my-product
  web/      Next.js frontend
  api/      NestJS backend
  docs/     output lands here
    orders/
      orders.md
      orders.pdf
      assets/brand/        brand.css, logo
      assets/diagrams/     *.html (editable source) + *.png
      assets/screenshots/
```

See [`examples/orders/`](examples/orders/) for a complete generated document (fictional module, fictional brand): [`orders.pdf`](examples/orders/orders.pdf).

## Requirements

| Needed for | Requirement |
|---|---|
| Everything | [Claude Code](https://claude.com/claude-code) 2.1.211 or newer (plugins need 2.0.12+, saving screenshots to disk needs 2.1.211+) and Node.js 20+ |
| Diagrams and PDF | Google Chrome or Chromium (found automatically; set `CHROME=/path/to/binary` otherwise). Under WSL use a Linux Chrome, not the Windows one |
| Markdown → HTML | `marked` 18, fetched once through `npx` and cached; the first build needs network |
| PDF read-back (QA) | `pdftoppm` from poppler, required — `brew install poppler` on macOS, `sudo apt-get install poppler-utils` on Debian/Ubuntu. Without it the skill cannot check its own PDF and stops before reporting |
| Screenshots | the Claude in Chrome browser extension, signed in to your app |
| Optional: Pro diagrams | a Google AI Studio key exported as `GEMINI_API_KEY` (about $0.13 per image) |

No other dependencies. Nothing is installed into your repos.

## Install

From any Claude Code session:

```
/plugin marketplace add grebe-vladin/codebase-docs
/plugin install codebase-docs@codebase-docs
```

Restart the session and check that `/codebase-docs:document` shows up in the slash-command list.

To run a local checkout instead (development):

```
claude --plugin-dir /path/to/codebase-docs
```

Update later with `/plugin update codebase-docs@codebase-docs`.

## Use

Start Claude Code **in the folder that contains the repos**, then:

```
/codebase-docs:document orders
```

The wizard asks, in your language:

1. **Company / brand** — pick a saved brand or create one from a website URL, a folder of brand assets, or typed values (logo, primary and accent colour). Brands live in `~/.codebase-docs/brands/<company>/` and are reused across projects; the logo is copied there.
2. **Language** of the document, **audience** (onboarding, handover, client delivery, audit) and **depth** (concise or deep).
3. **Output folder** — default `<root>/docs`.
4. **Screenshots** — the URL of the running app, or none. You sign in yourself in the Chrome tab; the plugin never types credentials.
5. **Diagram engine** — `html` (default) or `pro` (see below).
6. **Funded project** — for EU or grant-funded projects (POCIDIF, PNRR, POC, others) the wizard asks for the programme, its identifiers (SMIS code, contract, project title, beneficiary), the official sentence and the banners, and where to place them (footer or header of every page, both, or cover only). It stops and asks when anything is missing; it never guesses funding data.

   Official logo sets ship with the plugin for **PoCIDIF** (EU "Cofinanțat de Uniunea Europeană" + Guvernul României + PoCIDIF) and **PNRR** (EU NextGenerationEU + Guvernul României + PNRR), downloaded from ec.europa.eu, identitate.gov.ro and mfe.gov.ro and checked against the programmes' visual-identity manuals. The wizard still shows them to you and asks you to confirm. For any other programme `funding-assets.mjs fetch <programme>` pulls the official packs (sources and rules in `skills/document/templates/funding/programs.json`) and you confirm which files are the banners. The EU emblem is free to use by beneficiaries; the Romanian government and programme logos are mandated by the funding manuals.

Then the skill runs a preflight (`doctor.sh`: Node, Chrome, poppler, git), maps the repos, discovers the module in each of them (framework notes for NestJS, Next.js, Express, Laravel, Django, FastAPI, Rails, Spring), writes the document, fact-checks every route in the API table against the code, draws and checks the diagrams, takes and annotates the screenshots, builds the PDF (plus a dated copy in `history/`, optionally a one-pager and a DOCX), reads the PDF back page by page to fix anything off, and refreshes the documentation index before it reports.

```
/codebase-docs:document --check      # freshness report + index refresh, generates nothing
```

### Dependencies

The dependency section lists the packages the module's files actually import — npm (JS/TS), Composer (PHP) and pip (Python) — with declared, installed and latest versions, release age, licence, deprecation and audit advisories (`npm audit`, `composer audit`, `pip-audit`). Registry lookups are cached for 24 hours in `~/.codebase-docs/cache/`. Ruby and JVM stacks get framework notes but no automatic dependency table yet.

### What the document contains

Summary → how it works and why → architecture (diagram + component table) → user flows (one swimlane each, numbered steps, screenshots, failure paths) → data model → API surface → integrations and background work → configuration → dependencies (packages the module's files import, declared/installed/latest versions, age, `npm audit` advisories, and a watch list) → security: what to watch for (findings with file references) → operations: what to monitor (signal, where, normal value, what to do) → known limitations → glossary.

### Keeping documents current

Every document starts with a stamp: the commit SHA of each repo and the paths it covers. On the next run the skill diffs those paths (committed and uncommitted changes), tells you which documents went stale, offers to update them first, rewrites only the affected sections and adds a "What changed since …" section for readers of the previous version.

`docs/README.md` and `docs/index.html` (a static site you can publish as-is) list every module with its status; `docs/glossary.md` merges the glossaries and flags terms defined differently in two modules; `docs/assets/modules.png` maps which module calls which.

A GitHub Actions template in `skills/document/templates/ci/docs-stale.yml` comments on pull requests that touch code covered by a document.

### Diagram engines

- **html** — every diagram is a small HTML file on a brand-styled template, rendered to PNG by headless Chrome. Exact text, exact colours, editable next time, free. This is always the source of truth.
- **pro** — after the HTML render passes its checklist, [Nano Banana Pro](https://ai.google.dev/gemini-api/docs/image-generation) (Gemini's image model) restyles it using the render as a reference, so layout, labels and arrows stay fixed and only the finish changes. The result is checked again; if a label or arrow changed, the HTML render is kept. Needs `GEMINI_API_KEY` in your shell before starting Claude Code. The key is read from the environment only and never written anywhere.

```
export GEMINI_API_KEY=...   # only if you want the pro engine
claude
```

## Troubleshooting

- **"Chrome not found"** — install Google Chrome or set `CHROME=/full/path/to/chrome` in your shell.
- **"pdftoppm not found"** — install poppler (see Requirements). The PDF builds, but the skill refuses to call the document done until it has read the pages back.
- **Blank or unstyled PDF fonts** — the print stylesheet loads Inter from Google Fonts; offline it falls back to your system font, which is fine.
- **Screenshots stop at a login page** — sign in in that Chrome tab and tell Claude to continue.
- **Pro engine skipped** — `GEMINI_API_KEY` was not set when Claude Code started.

## Repository layout

```
.claude-plugin/       plugin.json, marketplace.json
skills/document/
  SKILL.md            the procedure
  WIZARD.md           questions and the brand store
  DISCOVERY.md        finding the module across repos
  DOC-TEMPLATE.md     document structure and writing rules
  DIAGRAMS.md         diagram primitives, layout rules, checklist
  NANO-BANANA.md      the optional image-model polish pass
  QA.md               the read-back loop
  frameworks/         per-framework discovery notes
  scripts/            doctor.sh, brand.mjs, render-diagram.sh, build-pdf.mjs, pdf-pages.sh, check-stale.mjs,
                      changes-since.mjs, verify-endpoints.mjs, deps-report.mjs, docs-index.mjs, annotate.mjs,
                      gen-image.mjs, find-chrome.sh
  templates/          diagram.html, doc.html, doc.css, examples/, funding/ (programme banners + programs.json)
examples/orders/        a complete generated document
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

Issues and pull requests are welcome. Keep the principles: the HTML diagram is the source of truth, the skill reads its own output back before reporting, and no credential is ever stored by the plugin. Run the scripts on `examples/orders` to check a change:

```
node skills/document/scripts/build-pdf.mjs examples/orders/orders.md
bash skills/document/scripts/render-diagram.sh examples/orders/assets/diagrams/architecture.html
```

## License

[MIT](LICENSE) © Vladin Grebenita
