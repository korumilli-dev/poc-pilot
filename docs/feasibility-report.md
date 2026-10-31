# P2 — Feasibility & Build-vs-Buy Report

## Idea under assessment: Community Tool Library

## 1. Structured feasibility assessment

| Dimension | Score (0–100) | Basis |
|-----------|---------------|-------|
| Problem-solution fit | 78 | Clear, common pain (idle tools, duplicate purchases); validated anecdotally by Buy Nothing / neighborhood apps |
| Technical feasibility | 85 | Simple CRUD + listings; no complex integrations; static web POC runs today |
| Operational feasibility | 60 | Trust, safety, pickup logistics, and damage liability are non-trivial; require manual oversight at MVP |
| Financial viability | 70 | Low cost to operate; revenue model unclear (membership vs transaction fee vs free) |
| Overall feasibility | 73 | |

## 2. Risks and assumptions

### Risks
- **Trust & safety**: strangers entering homes to exchange tools; injury/liability exposure.
- **Supply liquidity**: a tool library needs enough listed tools nearby to be useful; cold-start problem.
- **Damage/dispute**: who pays if a borrowed tool is broken or not returned.
- **Low frequency**: borrowing is occasional; retention may be weak.

### Assumptions
- Pilot neighborhood is geographically compact (walking/biking distance).
- Initial tool inventory comes from a small founding group (seed supply).
- Disputes handled manually by platform admin at MVP (no automated insurance).
- No monetary transactions at MVP (free borrowing, deposit optional).

## 3. Build-versus-buy alternatives

| Option | Description | Pros | Cons | Estimated effort |
|--------|-------------|------|------|------------------|
| **Build in-house** | Custom platform for this community | Full control, fits local workflow, no per-user fees | Development + maintenance burden, trust/safety built from scratch | 8–12 weeks MVP |
| **Buy SaaS** | Existing rental/sharing platform (e.g. Fat Llama, ShareGrid-style) | Fast launch, trust/payments/insurance included | Fees, less local control, not tool-specific, may not operate in pilot area | 2–4 weeks setup |
| **Hybrid** | Manual process (WhatsApp/Spreadsheet) + simple listing site | Fastest, lowest cost, tests demand before building | Does not scale, no safety scaffolding | 1–2 weeks |

### Recommendation on build vs buy
Start with the **hybrid** approach to validate demand (P1–P2 evidence). If borrowing volume validates, move to **build in-house** for a lightweight local platform; avoid expensive SaaS fees until volume justifies them.

## 4. Estimated costs (MVP, local)

| Item | Estimate | Notes |
|------|----------|-------|
| Development (POC) | $0 (this repo, volunteer/employee time) | Vanilla HTML/JS, no framework |
| Hosting | $0–$15/mo | Static site (GitHub Pages / Netlify free tier) |
| Domain | $0–$12/yr | Optional |
| Liability/insurance | TBD | Not covered in POC; requires legal review |
| AI / external APIs | $0 | Deterministic template assessment; no paid calls |

## 5. Decision-relevant gaps
- Legal review of liability/waiver language (unverified)
- Demand validation not yet performed (unverified)
- No trust/safety design (unverified)
