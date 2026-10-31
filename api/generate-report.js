/**
 * api/generate-report.js — Serverless function for LLM-powered feasibility report
 *
 * Deploy to: Vercel (/api/generate-report.js) or Netlify (netlify/functions/generate-report.js)
 *
 * Environment variables required (set in your hosting dashboard or .env for local dev):
 *   OPENROUTER_API_KEY  — OpenRouter API key (preferred)
 *   LLM_BASE_URL        — OpenRouter base URL (default: https://openrouter.ai/api/v1)
 *   LLM_MODEL           — Model to use (default: nvidia/nemotron-3-ultra-550b-a55b:free)
 *   ANTHROPIC_API_KEY   — Anthropic Claude API key (fallback)
 *   OPENAI_API_KEY      — OpenAI API key (fallback)
 *
 * Request body:  { idea: string, scores: object, overall: number }
 * Response:      { feasibilitySummary, architecture, implementationPlan, costEstimate, infrastructure, risks, nextSteps }
 *
 * Falls back to a deterministic report if no LLM API key is configured
 * or if the LLM call fails — the UI never breaks.
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

/**
 * Validate that the LLM response matches the expected schema.
 * Returns the sanitized report or null if validation fails.
 */
function validateReport(report) {
  if (!report || typeof report !== 'object') return null;

  const requiredStringFields = ['feasibilitySummary'];
  for (const field of requiredStringFields) {
    if (typeof report[field] !== 'string' || report[field].trim().length === 0) {
      return null;
    }
  }

  // Architecture
  if (report.architecture && typeof report.architecture === 'object') {
    if (typeof report.architecture.overview !== 'string') report.architecture.overview = '';
    if (!Array.isArray(report.architecture.components)) report.architecture.components = [];
    if (!Array.isArray(report.architecture.techStack)) report.architecture.techStack = [];
  } else {
    report.architecture = { overview: '', components: [], techStack: [] };
  }

  // Implementation plan
  if (report.implementationPlan && typeof report.implementationPlan === 'object') {
    if (!Array.isArray(report.implementationPlan.phases)) report.implementationPlan.phases = [];
    if (typeof report.implementationPlan.totalTimeline !== 'string') report.implementationPlan.totalTimeline = 'TBD';
  } else {
    report.implementationPlan = { phases: [], totalTimeline: 'TBD' };
  }

  // Cost estimate
  if (report.costEstimate && typeof report.costEstimate === 'object') {
    const dev = report.costEstimate.development || {};
    const ops = report.costEstimate.monthlyOperating || {};
    report.costEstimate = {
      development: {
        low: typeof dev.low === 'number' ? dev.low : 0,
        high: typeof dev.high === 'number' ? dev.high : 0,
        currency: typeof dev.currency === 'string' ? dev.currency : 'USD',
      },
      monthlyOperating: {
        low: typeof ops.low === 'number' ? ops.low : 0,
        high: typeof ops.high === 'number' ? ops.high : 0,
        currency: typeof ops.currency === 'string' ? ops.currency : 'USD',
      },
      assumptions: typeof report.costEstimate.assumptions === 'string' ? report.costEstimate.assumptions : 'Costs scale with usage.',
    };
  } else {
    report.costEstimate = {
      development: { low: 0, high: 0, currency: 'USD' },
      monthlyOperating: { low: 0, high: 0, currency: 'USD' },
      assumptions: 'Costs scale with usage; validate demand before committing to paid tiers.',
    };
  }

  // Infrastructure
  if (report.infrastructure && typeof report.infrastructure === 'object') {
    if (typeof report.infrastructure.hosting !== 'string') report.infrastructure.hosting = 'Static hosting';
    if (!Array.isArray(report.infrastructure.services)) report.infrastructure.services = [];
    if (!Array.isArray(report.infrastructure.security)) report.infrastructure.security = [];
    if (typeof report.infrastructure.scalability !== 'string') report.infrastructure.scalability = 'Unlimited';
  } else {
    report.infrastructure = { hosting: 'Static hosting', services: [], security: [], scalability: 'Unlimited' };
  }

  // Risks
  if (!Array.isArray(report.risks)) report.risks = [];
  report.risks = report.risks.filter(r => typeof r === 'string').slice(0, 6);

  // Next steps
  if (!Array.isArray(report.nextSteps)) report.nextSteps = [];
  report.nextSteps = report.nextSteps.filter(s => typeof s === 'string').slice(0, 6);

  return report;
}

function deterministicReport(idea, scores, overall) {
  const verdict =
    overall >= 75
      ? 'Proceed'
      : overall >= 60
      ? 'Validate Further'
      : overall >= 40
      ? 'Pivot'
      : 'Stop';

  return {
    feasibilitySummary: `This idea received an overall deterministic score of ${overall}/100. Based on keyword-signal analysis across problem–solution fit, technical feasibility, operational feasibility, and financial viability, the recommendation is to ${verdict.toLowerCase()}. Configure an LLM API key for a detailed AI-generated architecture, implementation plan, and cost estimate.`,
    architecture: {
      overview: 'Deterministic fallback — LLM not configured.',
      components: ['Frontend (HTML/CSS/JS)', 'Assessment engine (assess.js)'],
      techStack: ['HTML5', 'CSS3', 'JavaScript (ES6)'],
    },
    implementationPlan: {
      phases: [
        {
          name: 'Assessment',
          duration: 'Immediate',
          deliverables: ['Feasibility scores', 'Verdict recommendation'],
        },
      ],
      totalTimeline: 'N/A (deterministic only)',
    },
    costEstimate: {
      development: { low: 0, high: 0, currency: 'USD' },
      monthlyOperating: { low: 0, high: 0, currency: 'USD' },
      assumptions: 'No LLM API configured — $0 cost, client-side only.',
    },
    infrastructure: {
      hosting: 'Static hosting (Vercel, Netlify, GitHub Pages, or file://)',
      services: ['None required'],
      security: ['CSP headers recommended'],
      scalability: 'Unlimited (static files)',
    },
    risks: ['LLM report not available — configure API key for detailed analysis'],
    nextSteps: [
      'Set OPENROUTER_API_KEY (or ANTHROPIC_API_KEY / OPENAI_API_KEY) in your hosting dashboard',
      'Redeploy the serverless function',
      'Resubmit your idea to generate the full AI report',
    ],
  };
}

const SYSTEM_PROMPT = `You are a senior product architect and feasibility analyst. Analyze the business idea below along with its deterministic assessment scores, and return a JSON object ONLY (no markdown, no explanatory text).

Idea: "\${{IDEA}}"
Deterministic scores: Problem–solution fit: \${{PROBLEM_SOLUTION}}/100, Technical: \${{TECHNICAL}}/100, Operational: \${{OPERATIONAL}}/100, Financial: \${{FINANCIAL}}/100, Overall: \${{OVERALL}}/100.

Return this exact JSON schema:
{
  "feasibilitySummary": "2-4 sentence narrative assessing idea viability",
  "architecture": {
    "overview": "2-3 sentence high-level architecture description",
    "components": ["component 1", "component 2", "component 3"],
    "techStack": ["tech 1", "tech 2", "tech 3"]
  },
  "implementationPlan": {
    "phases": [
      {"name": "Phase name", "duration": "X weeks", "deliverables": ["deliverable 1", "deliverable 2"]}
    ],
    "totalTimeline": "X-Y weeks"
  },
  "costEstimate": {
    "development": {"low": number, "high": number, "currency": "USD"},
    "monthlyOperating": {"low": number, "high": number, "currency": "USD"},
    "assumptions": "brief assumptions text"
  },
  "infrastructure": {
    "hosting": "recommended hosting",
    "services": ["service 1", "service 2"],
    "security": ["security measure 1", "security measure 2"],
    "scalability": "scalability notes"
  },
  "risks": ["risk 1", "risk 2", "risk 3"],
  "nextSteps": ["next step 1", "next step 2", "next step 3"]
}

Be realistic, specific to the idea, and do not fabricate certainty. Avoid inventing market size figures, pricing, or timelines that cannot be inferred from the idea itself. Use qualifiers like "estimated," "typically," or "depends on scope" where appropriate.`;

function buildSystemPrompt(idea, scores, overall) {
  return SYSTEM_PROMPT
    .replace('${{IDEA}}', idea)
    .replace('${{PROBLEM_SOLUTION}}', scores.problemSolution)
    .replace('${{TECHNICAL}}', scores.technical)
    .replace('${{OPERATIONAL}}', scores.operational)
    .replace('${{FINANCIAL}}', scores.financial)
    .replace('${{OVERALL}}', overall);
}

async function callOpenRouter(idea, scores, overall) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || 'https://openrouter.ai/api/v1';
  const model = process.env.LLM_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b:free';

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const systemPrompt = buildSystemPrompt(idea, scores, overall);

  // 10-second timeout so the UI never hangs waiting for the LLM
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pocpilot.app',
        'X-Title': 'PocPilot Feasibility Report',
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate the feasibility report JSON.' },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const parsed = JSON.parse(text);
    return validateReport(parsed);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callAnthropic(idea, scores, overall, apiKey) {
  const systemPrompt = buildSystemPrompt(idea, scores, overall);

  // 10-second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        temperature: 0.4,
        system: systemPrompt,
        messages: [{ role: 'user', content: 'Generate the feasibility report JSON.' }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No JSON found in Anthropic response');
    }
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd));
    return validateReport(parsed);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callOpenAI(idea, scores, overall, apiKey) {
  const systemPrompt = buildSystemPrompt(idea, scores, overall);

  // 10-second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate the feasibility report JSON.' },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const parsed = JSON.parse(text);
    return validateReport(parsed);
  } finally {
    clearTimeout(timeoutId);
  }
}

export default async (req, res) => {
  // CORS
  Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body;
  try {
    body = req.body || {};
  } catch (_) {
    body = {};
  }

  const { idea, scores, overall } = body;

  if (!idea || typeof idea !== 'string') {
    res.status(400).json({ error: 'Idea is required' });
    return;
  }

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openrouterKey && !anthropicKey && !openaiKey) {
    // No LLM configured — return deterministic fallback
    res.status(200).json(deterministicReport(idea, scores, overall));
    return;
  }

  try {
    let report;
    if (openrouterKey) {
      report = await callOpenRouter(idea, scores, overall);
    } else if (anthropicKey) {
      report = await callAnthropic(idea, scores, overall, anthropicKey);
    } else if (openaiKey) {
      report = await callOpenAI(idea, scores, overall, openaiKey);
    }

    // Validate the LLM response; fall back to deterministic if invalid
    if (!report) {
      throw new Error('LLM response failed validation');
    }

    res.status(200).json(report);
  } catch (err) {
    // LLM failed or returned invalid data — return deterministic fallback so UI never breaks
    res.status(200).json(deterministicReport(idea, scores, overall));
  }
};
