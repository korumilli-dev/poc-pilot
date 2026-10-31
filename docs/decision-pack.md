# P6 — Management Decision Pack

## Recommendation: Validate Further

## Idea: Community Tool Library

### Overall feasibility score: ~73 / 100 (dimension scores documented in docs/feasibility-report.md)

### Why "Validate Further" rather than "Proceed"
The idea scores well on problem-solution fit and technical feasibility (a simple listings platform is cheap and fast to build). However, operational feasibility is the limiting factor (~60): trust, safety, pickup logistics, and damage liability require careful design and likely manual oversight at MVP. Demand has not yet been validated in a specific neighborhood. We recommend a time-boxed validation step before committing to build.

### Recommended next step (hybrid, 1–2 weeks)
Run a manual pilot in one neighborhood:
1. Seed 20–30 tools from a founding group.
2. Use a simple spreadsheet/listing + WhatsApp/Signal for coordination.
3. Track borrowings, disputes, and retention for 6–8 weeks.

If borrowing volume and repeat usage validate demand, proceed to build a lightweight local platform (build in-house). If not, pivot or stop.

### Build-versus-buy recommendation
Start with the **hybrid** approach (lowest cost, validates demand). Avoid buying a SaaS platform until volume justifies fees. If validated, build in-house rather than subscribing long-term.

### Estimated costs (MVP)
| Item | Estimate |
|------|----------|
| POC development | $0 (this repo) |
| Hosting | $0–$15/mo static |
| Domain | $0–$12/yr optional |
| Legal / liability review | TBD (not in POC) |
| Paid APIs | $0 (deterministic assessment) |

### Risks requiring attention before build
1. Trust & safety (liability, injury, theft) — legal review required
2. Supply liquidity / cold start — needs seed inventory
3. Damage / dispute resolution — no automated insurance at MVP
4. Low frequency / retention — unproven

### Evidence
- POC runs locally: `src/index.html` (no build, no server, no dependencies)
- Tests pass: `npm test` (see docs/evidence/test-results.md)
- Design tokens & accessibility floor: `docs/architecture.md`
- Full feasibility detail: `docs/feasibility-report.md`

### Decision options (per project governance)
- [ ] Proceed — build full platform
- [x] Validate Further — run hybrid manual pilot first
- [ ] Pivot — change model / target market
- [ ] Stop — do not pursue
