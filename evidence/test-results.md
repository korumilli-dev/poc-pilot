# P5 — Test Evidence

## Test command
`npm test`  →  `node tests/feasibility.test.js`
Run from: `/home/rajesh/projects/poc-pilot`
Node version: v24.22.1

## Observed result (actual)
```
✓ clamp stays within bounds
✓ escapeHtml neutralizes HTML
✓ assess returns scores within 0-100
✓ assess signals affect problem-solution score
✓ assess detects users/outcome signals
✓ assess overall is a weighted combination
✓ verdict bands
✓ generateRisks returns risks and assumptions
✓ generateRisks omits operational risk when score is high
✓ BUILD_BUY_OPTIONS has three entries with required fields

10 passed, 0 failed out of 10
```

Exit code: 0 (all tests passed)

## Test type
Unit tests (automated), run with Node built-in `assert`. No external test framework, no browser/DOM required.

## What was tested
- `clamp` boundary behavior
- `escapeHtml` XSS neutralization (works in Node and browser)
- `assess` score ranges (0–100), signal sensitivity, weighted overall formula
- `verdictFromScore` bands (Proceed ≥75, Validate Further ≥60, Pivot ≥40, Stop <40)
- `generateRisks` risk/assumption generation incl. conditional operational risk
- `BUILD_BUY_OPTIONS` structure (3 entries, required fields)

## Limitations / unverified
- UI interaction (form submission, DOM rendering) is NOT covered by automated tests — verified manually by opening `src/index.html` in a browser.
- The assessment is template-based/deterministic; not a production-grade AI evaluation.
- No paid API calls were made ($0 cost).
- No external deployment performed.

## Files & artifacts
- `tests/feasibility.test.js` — test suite
- `src/assess.js` — tested module
- `package.json` — test script (`npm test`)
