# P3 — Architecture & Design Tokens

## Tech stack (POC, smallest useful set)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | Vanilla HTML5 + CSS3 + ES6 JS | No build step, runs in any browser, zero dependencies |
| Styling | Hand-authored CSS (design tokens below) | No framework; full control over distinctive visual identity |
| Logic | Client-side JS feasibility engine | Deterministic, no API calls, $0 cost, offline-capable |
| Deployment | Static file (`src/index.html`) | Open locally; deployable to any static host later |

## Design tokens (per `frontend-design` skill)

### Color — workshop / tool-library subject matter
Distinctive palette, avoiding generic AI defaults (no cream #F4F1EA + terracotta #D97757, no near-black + acid green, no SaaS-card grey shadows).

| Token | Hex | Role |
|-------|-----|------|
| `--color-surface` | `#FFFFFF` | Page background |
| `--color-ink` | `#0F172A` | Primary text (deep slate, not tinted near-black) |
| `--color-accent` | `#D97706` | Accent / primary action (amber, construction-safety) |
| `--color-accent-hover` | `#B45309` | Accent on hover/focus |
| `--color-muted` | `#64748B` | Secondary text |
| `--color-border` | `#CBD5E1` | Hairline borders (structural, not decorative) |
| `--color-success` | `#15803D` | Proceed recommendation |
| `--color-validate` | `#D97706` | Validate Further recommendation |
| `--color-pivot` | `#DC2626` | Pivot recommendation |
| `--color-stop` | `#7F1D1D` | Stop recommendation |
| `--color-shadow` | `rgba(15, 23, 42, 0.08)` | Subtle elevation, only where structure needs it |

### Type
- Headlines: serif (`Georgia`, `Times New Roman`, serif) — workshop signage character
- Body: sans-serif (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif)
- One family per role, clearly distinct; no ALL-CAPS labels, no single-word accenting

### Layout
- Hero opens with the most characteristic element (bold headline + short purpose line)
- Sections left-aligned; no numbered `01/02/03` markers unless content is a true sequence
- Max content width ~72ch for readability (< 80 chars per line)
- Responsive: single column on mobile, two-column on desktop for results

## Accessibility floor (per `web-design-guidelines`)
- Semantic HTML (`<header>`, `<main>`, `<section>`, `<form>`, `<label>`, `<fieldset>`)
- Visible keyboard focus (`:focus-visible` outline)
- Reduced motion respected (`prefers-reduced-motion`)
- Color contrast meets WCAG AA (ink on surface ≥ 4.5:1; accent checked against surface)
- Form fields have explicit labels; errors are specific and actionable
