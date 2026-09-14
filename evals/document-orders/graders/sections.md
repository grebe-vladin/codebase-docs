---
type: regex
pattern: '^## \d+\. (Summary|How it works|Architecture|User flows|API surface|Dependencies|Security)'
flags: m
match: count:5
target: { source: file, path: docs/orders/orders.md }
weight: 1
---
