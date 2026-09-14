# Diagrams

Every diagram is a hand-authored HTML page in `assets/diagrams/<name>.html`, rendered to `<name>.png` (2× pixels) by `bash scripts/render-diagram.sh <name>.html`. The HTML is the source of truth: exact text, brand colours, editable next time. Start every diagram by copying `templates/diagram.html`; the worked examples in `templates/examples/` (`architecture.html`, `swimlane.html`) show the primitives composed.

## Canvas

`<body data-width="1400" data-height="800">` and the matching `--w/--h` on `.canvas`. The PNG prints at ~178 mm text width, so fewer pixels means bigger text: 1400 wide by default, 1600 only for five or more lanes. Set the height to the content — an empty band at the bottom is a finding. Aspect ≤ 2:1.

## Primitives (in the template's CSS — compose, don't restyle)

- `.node` + `.node--fe | --be | --db | --ext | --user | --emph`, with `<span class="kind">` and `<span class="name">`, optional `<ul>` for sub-parts.
- `.group` with `<span class="label">` — a repo or boundary.
- `.lanes` grid: `.lane-label` + `.lane` rows; `.step data-n="3"` boxes inside; `.step--alt` for async/background, `.step--end` for the terminal step.
- `.entity` cards for data models (`<header>` + `<table>`; `td.k` marks PK/FK).
- `.state`, `.state--initial`, `.state--final` pills.
- `.note` callout, `.legend`, `.brandmark` (logo + brand name, bottom-right).
- Arrows: `connect('#from', '#to', {label, from, to, offset, at, cls, labelAt, dx, dy})` in the script block — orthogonal, with a paper-coloured label backing. `cls:'alt'` = dashed accent (async), `cls:'soft'` = grey (secondary).

## Layout rules per type

- **Architecture**: left → right: actor → frontend group → backend group → data/external column. ≤ 12 nodes; sub-parts as bullets inside a node, never as more nodes. Leave a corridor of ≥ 120 px between columns that exchange several arrows; give each arrow in a corridor its own `at` (0.25 / 0.5 / 0.75) and `offset` (±18) so no two share a line or an edge point.
- **Swimlane** (one per user flow): lanes = actors (User, Web app, API, Worker, Database, External), time flows left → right, one step per column, steps numbered to match the document's list, one arrow per request/response labelled verb + object (`POST /orders`, `200 JSON`).
- **Data model**: entity cards in a grid, relations as arrows labelled with cardinality (`1`, `*`), FK fields marked.
- **State**: pills left → right in the happy path, transitions labelled with the trigger, initial and final marked.

## Checklist — by looking at the PNG, every time

- No box overlaps another; no label sits on a line or on a box edge; no text is clipped or wraps mid-word.
- Arrows start and end on box edges; solid arrows cross nothing; a dashed async arrow may cross at most two solid lines, never text.
- Text ≥ 14 px at 1× (28 px in the PNG) except `.kind` labels; names ≥ 17 px.
- Colours match the legend; the legend is present when more than one node kind is used.
- Names, step numbers and endpoint paths match the document word for word.
- Brand: primary/accent from `brand.css`, logo in `.brandmark` when the brand has one.
- No empty band: the content fills the canvas within ~40 px of each edge.

Fix in the HTML, re-render, look again. Two passes are normal; ship only a pass with no findings.

## Engine `pro`

After the HTML PNG passes the checklist, polish it with Nano Banana Pro using the PNG as the reference image — see `NANO-BANANA.md`. The polished PNG replaces the HTML PNG in `assets/diagrams/` only if it passes the same checklist plus the text-fidelity check; otherwise keep the HTML render.
