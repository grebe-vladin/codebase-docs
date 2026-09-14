<!-- codebase-docs {"module": "orders", "title": "Orders module — one-pager", "subtitle": "The essentials for decision makers", "company": "Acme Test", "audience": "Developers + product (handover)", "language": "en", "generated": "2026-09-14", "engine": "html", "repos": {"web": {"sha": "a1b2c3d4e5f6a7b8c9d0", "branch": "main", "paths": ["src/app/orders/**", "src/hooks/useOrders.ts", "src/lib/api/orders.ts", "src/components/orders/**"]}, "api": {"sha": "0f1e2d3c4b5a69788796", "branch": "main", "paths": ["src/orders/**"]}}, "funding": {"program": "pnrr", "placement": "footer", "banners": ["funding/eu.png", "funding/guvern.png", "funding/pnrr.png"], "text": "Finanțat de Uniunea Europeană – NextGenerationEU", "identifiers": {"projectTitle": "Acme Orders Platform", "contractNumber": "760123/23.05.2024", "beneficiary": "Acme Test SRL"}}, "dirty": []} -->

# Orders module

## What it is

Operators create orders in the web app; the API queues fulfilment; a worker charges the payment provider and stores the result; the web app polls until done. It replaced a spreadsheet process that had no history.

![Architecture](assets/diagrams/architecture.png)

## Three things to know

1. **Polling, not websockets** — a deliberate choice; jobs take 5–40 s.
2. **Any operator can retry any order** — no ownership check yet on `POST /orders/:id/retry`.
3. **`stripe` is one major behind** — contained in one file, upgrade planned.

## What to monitor

| Signal | Normal | When off |
|---|---|---|
| `fulfilment` queue depth | < 20 | worker down or provider slow |
| Failed jobs per day | 0–2 | inspect `order_jobs.error` |

## Contacts

- Owner: platform team · Docs: `docs/orders/orders.pdf`
