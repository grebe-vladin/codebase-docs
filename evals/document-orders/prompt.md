---
name: document-orders
description: Document the orders module of the fixture repos end to end
tags: [smoke]
runs: 1
max_turns: 120
timeout_seconds: 1800
allowed_tools: [Read, Glob, Grep, Bash, Write, Edit, Skill, Agent, AskUserQuestion]
append_system_prompt: "You are in an eval. When the wizard asks, answer yourself with defaults: company 'Acme Test' (new, no logo, primary #1a56db, accent #f59e0b), language English, audience 'Developers, onboarding', output folder docs, no screenshots, engine html, depth concise, not a funded project. Do not wait for a human."
---

/codebase-docs:document orders
