/**
 * tests/feasibility.test.js — Unit tests for the feasibility assessment logic.
 *
 * Runs with Node (built-in assert). No external test framework, $0 cost.
 * Usage: node tests/feasibility.test.js   (or: npm test)
 */

import assert from 'node:assert/strict';
import {
  assess,
  verdictFromScore,
  generateRisks,
  clamp,
  escapeHtml,
  BUILD_BUY_OPTIONS,
} from '../src/assess.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`✗ ${name}\n  ${err.message}`);
  }
}

// ------------------------------------------------------------------
// clamp
// ------------------------------------------------------------------
test('clamp stays within bounds', () => {
  assert.strictEqual(clamp(5, 0, 100), 5);
  assert.strictEqual(clamp(-10, 0, 100), 0);
  assert.strictEqual(clamp(200, 0, 100), 100);
});

// ------------------------------------------------------------------
// escapeHtml
// ------------------------------------------------------------------
test('escapeHtml neutralizes HTML', () => {
  assert.strictEqual(escapeHtml('<script>alert("x")</script>'), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
});

// ------------------------------------------------------------------
// assess
// ------------------------------------------------------------------
test('assess returns scores within 0-100', () => {
  const { scores, overall } = assess('A neighborhood tool-lending platform for drills and ladders.');
  for (const [key, value] of Object.entries(scores)) {
    assert.ok(value >= 0 && value <= 100, `${key} out of range: ${value}`);
  }
  assert.ok(overall >= 0 && overall <= 100, `overall out of range: ${overall}`);
});

test('assess signals affect problem-solution score', () => {
  const vague = assess('Something about stuff.');
  const detailed = assess(
    'A neighborhood platform where residents can borrow and lend tools to reduce cost and waste.'
  );
  assert.ok(
    detailed.scores.problemSolution >= vague.scores.problemSolution,
    'detailed idea should score >= vague idea on problem-solution fit'
  );
});

test('assess detects users/outcome signals', () => {
  const withUsers = assess('Residents in a community can save money by sharing tools.');
  const withoutUsers = assess('A tool system.');
  assert.ok(withUsers.scores.problemSolution >= withoutUsers.scores.problemSolution);
});

test('assess overall is a weighted combination', () => {
  const { scores, overall } = assess('x');
  const expected = Math.round(
    scores.problemSolution * 0.3 +
      scores.technical * 0.25 +
      scores.operational * 0.25 +
      scores.financial * 0.2
  );
  assert.strictEqual(overall, expected);
});

// ------------------------------------------------------------------
// verdictFromScore
// ------------------------------------------------------------------
test('verdict bands', () => {
  assert.strictEqual(verdictFromScore(100).name, 'Proceed');
  assert.strictEqual(verdictFromScore(75).name, 'Proceed');
  assert.strictEqual(verdictFromScore(74).name, 'Validate Further');
  assert.strictEqual(verdictFromScore(60).name, 'Validate Further');
  assert.strictEqual(verdictFromScore(59).name, 'Pivot');
  assert.strictEqual(verdictFromScore(40).name, 'Pivot');
  assert.strictEqual(verdictFromScore(39).name, 'Stop');
  assert.strictEqual(verdictFromScore(0).name, 'Stop');
});

// ------------------------------------------------------------------
// generateRisks
// ------------------------------------------------------------------
test('generateRisks returns risks and assumptions', () => {
  const risks = generateRisks({ operational: 50 });
  assert.ok(risks.length > 0);
  const hasRisk = risks.some((r) => r.type === 'risk');
  const hasAssumption = risks.some((r) => r.type === 'assumption');
  assert.ok(hasRisk, 'expected at least one risk');
  assert.ok(hasAssumption, 'expected at least one assumption');
  const opRisk = risks.find((r) => r.text.includes('Operational complexity'));
  assert.ok(opRisk, 'expected operational risk when operational score < 60');
});

test('generateRisks omits operational risk when score is high', () => {
  const risks = generateRisks({ operational: 80 });
  const opRisk = risks.find((r) => r.text.includes('Operational complexity'));
  assert.ok(!opRisk, 'expected no operational risk when operational score >= 60');
});

// ------------------------------------------------------------------
// BUILD_BUY_OPTIONS
// ------------------------------------------------------------------
test('BUILD_BUY_OPTIONS has three entries with required fields', () => {
  assert.strictEqual(BUILD_BUY_OPTIONS.length, 3);
  for (const o of BUILD_BUY_OPTIONS) {
    assert.ok(o.option);
    assert.ok(Array.isArray(o.pros) && o.pros.length > 0);
    assert.ok(Array.isArray(o.cons) && o.cons.length > 0);
    assert.ok(o.effort);
  }
});

// ------------------------------------------------------------------
// Summary
// ------------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed out of ${passed + failed}`);
process.exit(failed > 0 ? 1 : 0);
