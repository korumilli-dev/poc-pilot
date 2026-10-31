/**
 * assess.js — Core feasibility assessment logic (POC)
 *
 * Deterministic, template-based assessment. No external API calls, $0 cost.
 * Exported as an ES module so it can be used by the UI (app.js) and tested
 * directly (tests/feasibility.test.js).
 */

/**
 * Clamp a value between min and max.
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Escape HTML to prevent XSS when rendering user input.
 * DOM-independent so it works in both browser and Node (tests).
 */
export function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text ?? '').replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Build-vs-buy options (static, POC).
 */
export const BUILD_BUY_OPTIONS = [
  {
    option: 'Build in-house',
    pros: [
      'Full control over local workflow',
      'No per-user platform fees',
      'Fits neighborhood context exactly',
    ],
    cons: [
      'Development + maintenance burden',
      'Trust and safety built from scratch',
      'Requires legal review of liability',
    ],
    effort: '8–12 weeks MVP',
  },
  {
    option: 'Buy SaaS (existing sharing platform)',
    pros: [
      'Fast launch (2–4 weeks)',
      'Trust, payments, insurance included',
      'Proven platform patterns',
    ],
    cons: [
      'Transaction / membership fees',
      'Less local control',
      'May not operate in pilot area',
      'Not tool-specific',
    ],
    effort: '2–4 weeks setup',
  },
  {
    option: 'Hybrid (manual + simple listing)',
    pros: [
      'Fastest, lowest cost (1–2 weeks)',
      'Validates demand before building',
      'No platform fees',
    ],
    cons: [
      'Does not scale',
      'No safety scaffolding',
      'Manual coordination only',
    ],
    effort: '1–2 weeks',
  },
];

/**
 * Run a deterministic, keyword-signal-based feasibility assessment.
 *
 * @param {string} idea - User-submitted business idea description
 * @returns {{scores: Object, overall: number, signals: Object}}
 */
export function assess(idea) {
  const text = String(idea ?? '').toLowerCase();

  const signals = {
    mentionsProblem: /\b(problem|pain|struggle|difficult|expensive|waste|idle|unused)\b/.test(text),
    mentionsUsers: /\b(users|residents|neighbors|customers|people|households|community)\b/.test(text),
    mentionsOutcome: /\b(outcome|goal|save|reduce|help|enable|allow)\b/.test(text),
    mentionsPlatform: /\b(platform|app|website|portal|marketplace)\b/.test(text),
    mentionsSimpleCrud: /\b(list|browse|search|request|message|profile)\b/.test(text),
    mentionsComplexIntegration: /\b(payment|integration|api|gps|calendar|booking)\b/.test(text),
    mentionsTrust: /\b(trust|verify|identity|background|insurance|waiver|liability)\b/.test(text),
    mentionsLogistics: /\b(pickup|dropoff|drop.?off|delivery|location|distance|neighborhood|local)\b/.test(text),
    mentionsManual: /\b(manual|admin|review|moderate|approve)\b/.test(text),
    mentionsRevenue: /\b(revenue|fee|charge|pay|monetize|subscription|membership)\b/.test(text),
    mentionsCost: /\b(cost|budget|free|cheap|affordable|save money)\b/.test(text),
  };

  const weights = {
    problemSolution: {
      base: 50,
      signals: {
        mentionsProblem: +18,
        mentionsUsers: +12,
        mentionsOutcome: +10,
      },
    },
    technical: {
      base: 50,
      signals: {
        mentionsPlatform: +12,
        mentionsSimpleCrud: +18,
        mentionsComplexIntegration: -10,
      },
    },
    operational: {
      base: 50,
      signals: {
        mentionsTrust: -12,
        mentionsLogistics: -8,
        mentionsManual: +10,
      },
    },
    financial: {
      base: 50,
      signals: {
        mentionsRevenue: +8,
        mentionsCost: +10,
      },
    },
  };

  const scores = {};
  Object.keys(weights).forEach((dim) => {
    const w = weights[dim];
    let score = w.base;
    Object.entries(w.signals).forEach(([sig, delta]) => {
      if (signals[sig]) score += delta;
    });
    scores[dim] = clamp(Math.round(score), 0, 100);
  });

  const overall = Math.round(
    scores.problemSolution * 0.3 +
      scores.technical * 0.25 +
      scores.operational * 0.25 +
      scores.financial * 0.2
  );

  return { scores, overall, signals };
}

/**
 * Convert an overall score into a decision recommendation.
 * @param {number} score - Overall feasibility score (0–100)
 * @returns {{name: string, color: string, soft: string}}
 */
export function verdictFromScore(score) {
  if (score >= 75) {
    return { name: 'Proceed', color: '--color-proceed', soft: '--color-proceed-soft' };
  }
  if (score >= 60) {
    return { name: 'Validate Further', color: '--color-validate', soft: '--color-validate-soft' };
  }
  if (score >= 40) {
    return { name: 'Pivot', color: '--color-pivot', soft: '--color-pivot-soft' };
  }
  return { name: 'Stop', color: '--color-stop', soft: '--color-stop-soft' };
}

/**
 * Generate risks & assumptions for the idea.
 * @param {Object} scores - Dimension scores from assess()
 * @returns {Array<{text: string, type: 'risk'|'assumption'}>}
 */
export function generateRisks(scores) {
  const risks = [
    { text: 'Trust & safety: strangers exchanging tools; injury and liability exposure.', type: 'risk' },
    { text: 'Supply liquidity: cold-start problem — needs enough listed tools nearby to be useful.', type: 'risk' },
    { text: 'Damage & disputes: who pays if a borrowed tool is broken or not returned.', type: 'risk' },
    { text: 'Low frequency: borrowing is occasional; retention may be weak.', type: 'risk' },
  ];
  if (scores.operational < 60) {
    risks.push({ text: 'Operational complexity is high — trust, safety, and pickup logistics need manual oversight.', type: 'risk' });
  }
  risks.push({ text: 'Pilot neighborhood is geographically compact (walking/biking distance).', type: 'assumption' });
  risks.push({ text: 'Initial tool inventory comes from a small founding group (seed supply).', type: 'assumption' });
  risks.push({ text: 'Disputes handled manually by platform admin at MVP (no automated insurance).', type: 'assumption' });
  return risks;
}
