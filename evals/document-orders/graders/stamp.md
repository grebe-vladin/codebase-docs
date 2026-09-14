---
type: regex
pattern: '^<!-- codebase-docs \{.*"repos":\{.*"sha":"[0-9a-f]{7,40}".*\} -->'
flags: m
target: { source: file, path: docs/orders/orders.md }
weight: 1
---
