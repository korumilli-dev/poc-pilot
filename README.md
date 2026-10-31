# POC Pilot — Idea Feasibility POC

A small, end-to-end vertical slice that helps businesses evaluate an idea, assess feasibility, compare build-versus-buy alternatives, and reach a evidence-backed investment decision (Proceed / Validate Further / Pivot / Stop).

## Repository structure

```
poc-pilot/
├── skills.md            # Project governance & operating rules
├── opencode.json        # OpenCode configuration
├── README.md            # This file
├── docs/
│   ├── idea-brief.md            # P1: clarified business idea
│   ├── feasibility-report.md    # P2: feasibility & build-vs-buy
│   ├── architecture.md          # P3: tech stack + design tokens
│   └── decision-pack.md         # P6: management decision pack
├── src/
│   ├── index.html   # P4: POC UI (single page, runs locally)
│   ├── app.js       # P4: feasibility assessment logic
│   └── style.css    # P4: styling (frontend-design tokens)
├── tests/
│   └── feasibility.test.js  # P5: unit tests
└── evidence/
    └── test-results.md        # P5: recorded test results
```

## How to run

Open `src/index.html` in any modern browser. No build step, no dependencies, no server required.

## Approval status

Planning approved. POC implemented as the smallest useful end-to-end vertical slice. No paid APIs, no external deployment, $0 infrastructure cost.
