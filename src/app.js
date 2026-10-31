/**
 * app.js — POC UI controller
 *
 * Imports the deterministic assessment logic from assess.js and handles
 * DOM interaction. Runs entirely in the browser; no external API calls.
 */

import { assess, verdictFromScore, generateRisks, escapeHtml, BUILD_BUY_OPTIONS } from './assess.js';

(function () {
  const form = document.getElementById('idea-form');
  const inputSection = document.getElementById('input-section');
  const resultsSection = document.getElementById('results-section');
  const submitBtn = document.getElementById('submit-btn');
  const resetBtn = document.getElementById('reset-btn');
  const backBtn = document.getElementById('back-btn');
  const scoreGrid = document.getElementById('score-grid');
  const verdictBox = document.getElementById('verdict-box');
  const compareBody = document.getElementById('compare-table').querySelector('tbody');
  const riskList = document.getElementById('risk-list');
  const ideaInput = document.getElementById('idea');
  const ideaError = document.getElementById('idea-error');
  const resultsHeading = document.getElementById('results-heading');
  const overallScoreEl = document.getElementById('overall-score');
  const assessmentIdeaEl = document.getElementById('assessment-idea');

  // Last assessment data — used by the report retry button
  let lastAssessment = null;

  // LLM report elements
  const reportLoading = document.getElementById('report-loading');
  const reportError = document.getElementById('report-error');
  const reportSection = document.getElementById('llm-report');
  const reportArchitectureSection = document.getElementById('report-architecture-section');
  const reportArchitectureBody = document.getElementById('report-architecture');
  const reportImplementationSection = document.getElementById('report-implementation-section');
  const reportImplementationBody = document.getElementById('report-implementation');
  const reportCostSection = document.getElementById('report-cost-section');
  const reportCostBody = document.getElementById('report-cost');
  const reportTeamSection = document.getElementById('report-team-section');
  const reportTeamBody = document.getElementById('report-team');
  const reportRisksSection = document.getElementById('report-risks-section');
  const reportRisksBody = document.getElementById('report-risks');
  const reportNextStepsSection = document.getElementById('report-nextsteps-section');
  const reportNextStepsBody = document.getElementById('report-nextsteps');
  const reportFeasibilitySection = document.getElementById('report-feasibility-section');
  const reportFeasibilityBody = document.getElementById('report-feasibility');
  const scheduleKickoff = document.getElementById('schedule-kickoff');

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function scrollToSection(el) {
    el.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
  }

  function showIdeaError() {
    ideaError.hidden = false;
    ideaInput.setAttribute('aria-invalid', 'true');
    ideaInput.focus();
  }

  function clearIdeaError() {
    if (ideaError.hidden) return;
    ideaError.hidden = true;
    ideaInput.removeAttribute('aria-invalid');
  }

  // ------------------------------------------------------------------
  // Rendering
  // ------------------------------------------------------------------
  function renderOverallScore(overall) {
    if (overallScoreEl) {
      overallScoreEl.textContent = overall;
    }
  }

  function renderAssessmentIdea(idea) {
    if (assessmentIdeaEl) {
      assessmentIdeaEl.textContent = escapeHtml(idea);
    }
  }

  function renderScores(scores) {
    const dims = [
      { key: 'problemSolution', label: 'Problem–solution fit' },
      { key: 'technical', label: 'Technical feasibility' },
      { key: 'operational', label: 'Operational feasibility' },
      { key: 'financial', label: 'Financial viability' },
    ];

    // Tier letter grade + meter color per dimension score
    function tierFor(score) {
      if (score >= 80) return { letter: 'A', cls: 'tier-a', meter: 'indigo' };
      if (score >= 65) return { letter: 'B+', cls: 'tier-b-plus', meter: 'indigo' };
      if (score >= 50) return { letter: 'B', cls: 'tier-b', meter: 'violet' };
      return { letter: 'C', cls: 'tier-c', meter: 'amber' };
    }

    // One-line context per dimension
    function contextFor(key, score) {
      const ctx = {
        problemSolution:
          score >= 60
            ? 'Clear problem and audience signals; demand risk is manageable.'
            : 'Problem definition or target audience needs sharpening.',
        technical:
          score >= 60
            ? 'Straightforward build with standard integrations.'
            : 'Complex integrations or custom engineering may be required.',
        operational:
          score >= 60
            ? 'Operations can be handled with light manual oversight.'
            : 'Trust, safety, and logistics need dedicated process.',
        financial:
          score >= 60
            ? 'Revenue model and cost structure are well defined.'
            : 'Monetization path and cost base need clarification.',
      };
      return ctx[key] || '';
    }

    scoreGrid.innerHTML = dims
      .map(
        (d) => {
          const score = scores[d.key];
          const t = tierFor(score);
          return `
        <div class="score-card">
          <div class="score-card-header">
            <span class="score-dimension">${escapeHtml(d.label)}</span>
            <span class="score-tier ${t.cls}">${t.letter}</span>
          </div>
          <span class="score-value">${score}</span>
          <span class="score-label">${escapeHtml(d.label)}</span>
          <div class="score-meter">
            <div class="score-meter-fill ${t.meter}" style="width: ${score}%"></div>
          </div>
          <p class="score-context">${escapeHtml(contextFor(d.key, score))}</p>
        </div>
      `;
        }
      )
      .join('');
  }

  function renderVerdict(score) {
    const v = verdictFromScore(score);
    const key = v.name.toLowerCase().replace(/\s+/g, '-');

    const explanations = {
      'proceed': 'Strong problem–solution fit with manageable execution risk. Consider moving forward with a focused MVP.',
      'validate-further': 'Promising signals but some uncertainty remains. Test key assumptions before committing significant resources.',
      'pivot': 'Core concept may need refinement. Consider adjusting the target problem, audience, or approach.',
      'stop': 'Significant barriers detected. Revisit the problem and explore alternative approaches.',
    };

    // CTA button pairs per verdict type
    const actions = {
      'proceed': [
        { label: 'Start MVP build', kind: 'primary', href: '#' },
        { label: 'View roadmap', kind: 'link', href: '#' },
      ],
      'validate-further': [
        { label: 'Run assumption tests', kind: 'primary', href: '#' },
        { label: 'Review risks', kind: 'link', href: '#' },
      ],
      'pivot': [
        { label: 'Explore alternatives', kind: 'primary', href: '#' },
        { label: 'Refine concept', kind: 'link', href: '#' },
      ],
      'stop': [
        { label: 'Assess another idea', kind: 'primary', href: '#' },
        { label: 'Browse examples', kind: 'link', href: '#' },
      ],
    };

    const actionButtons = (actions[key] || actions['validate-further'])
      .map(
        (a) => `
        ${a.kind === 'primary'
          ? `<button class="btn btn-primary">${escapeHtml(a.label)}</button>`
          : `<a href="${escapeHtml(a.href)}" class="btn-link">${escapeHtml(a.label)}</a>`
        }
      `
      )
      .join('');

    verdictBox.className = `verdict verdict--${key}`;
    verdictBox.innerHTML = `
      <div class="verdict-icon" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 2 C5 2 2 5 2 10 C2 15 5 18 10 18 C15 18 18 15 18 10 C18 5 15 2 10 2 Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M7 10 L10 13 L13 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="verdict-content">
        <span class="verdict-label">Decision recommendation</span>
        <h3 class="verdict-name">${escapeHtml(v.name)}</h3>
        <p class="verdict-explanation">${explanations[key]}</p>
      </div>
      <div class="verdict-actions">
        ${actionButtons}
      </div>
    `;
  }

  function renderBuildBuy() {
    // Badge per option: first row (Build) = IP control, second (Buy) = fastest, third (Hybrid) = recommended
    const badges = ['ip-control', 'fastest', 'recommended'];
    compareBody.innerHTML = BUILD_BUY_OPTIONS.map(
      (o, i) => `
      <tr>
        <td>
          <strong>${escapeHtml(o.option)}</strong>
          <span class="option-badge ${badges[i]}">${badgeLabel(badges[i])}</span>
        </td>
        <td><ul>${o.pros.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul></td>
        <td><ul>${o.cons.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul></td>
        <td>${escapeHtml(o.effort)}</td>
      </tr>
    `
    ).join('');
  }

  function badgeLabel(cls) {
    const labels = {
      'recommended': 'Recommended',
      'fastest': 'Fastest',
      'ip-control': 'IP control',
    };
    return labels[cls] || '';
  }

  function renderRisks(risks) {
    riskList.innerHTML = risks
      .map(
        (r) => `<li class="${r.type}">${escapeHtml(r.text)}</li>`
      )
      .join('');
  }

  // ------------------------------------------------------------------
  // LLM Report rendering
  // ------------------------------------------------------------------
  function showReportLoading() {
    const el = document.getElementById('report-loading');
    if (el) el.hidden = false;
    const errEl = document.getElementById('report-error');
    if (errEl) errEl.hidden = true;
    const secEl = document.getElementById('llm-report');
    if (secEl) secEl.hidden = true;
    // Hide all individual report sections until populated
    [reportArchitectureSection, reportImplementationSection, reportCostSection, reportTeamSection, reportRisksSection, reportNextStepsSection, reportFeasibilitySection].forEach((s) => {
      if (s) s.hidden = true;
    });
  }

  function hideReportLoading() {
    const el = document.getElementById('report-loading');
    if (el) el.hidden = true;
  }

  function showReportError(message) {
    hideReportLoading();
    const errEl = document.getElementById('report-error');
    if (errEl) {
      errEl.hidden = false;
      const p = errEl.querySelector('p');
      if (p && message) p.textContent = message;
    }
    const secEl = document.getElementById('llm-report');
    if (secEl) secEl.hidden = true;
  }

  function renderReport(report) {
    const llmReport = document.getElementById('llm-report');
    if (!llmReport) return;

    hideReportLoading();
    llmReport.hidden = false;

    // Show all section wrappers so they can be revealed as content is injected
    [reportArchitectureSection, reportImplementationSection, reportCostSection, reportTeamSection, reportRisksSection, reportNextStepsSection, reportFeasibilitySection].forEach((s) => {
      if (s) s.hidden = false;
    });

    // ------------------------------------------------------------------
    // Feasibility summary — LLM narrative assessment
    // ------------------------------------------------------------------
    if (reportFeasibilityBody && report.feasibilitySummary) {
      reportFeasibilityBody.innerHTML = `
        <p class="report-feasibility-summary">${escapeHtml(report.feasibilitySummary)}</p>
      `;
    }

    // ------------------------------------------------------------------
    // Architecture — layered component cards (architecture-layers CSS)
    // ------------------------------------------------------------------
    if (reportArchitectureBody && report.architecture) {
      const a = report.architecture;
      const layers = [
        { tag: 'Frontend', name: 'Client UI', desc: 'Vanilla HTML/CSS/JS, module-based app.js controller' },
        { tag: 'Assessment', name: 'Deterministic engine', desc: 'Keyword-signal scoring in assess.js (client-side, $0)' },
        { tag: 'API', name: 'Report endpoint', desc: 'Serverless function calling LLM for detailed analysis' },
        { tag: 'Deploy', name: 'Static hosting', desc: 'Vercel, Netlify, GitHub Pages, or file://' },
      ];
      reportArchitectureBody.innerHTML = `
        <p>${escapeHtml(a.overview || '')}</p>
        <div class="architecture-layers">
          ${layers.map((l) => `
            <div class="architecture-layer">
              <div class="layer-tag"><span>${escapeHtml(l.tag)}</span><span class="layer-name">${escapeHtml(l.name)}</span></div>
              <p class="layer-desc">${escapeHtml(l.desc)}</p>
            </div>
          `).join('')}
        </div>
        ${a.components ? `<p><strong>Components:</strong> ${a.components.map(c => escapeHtml(c)).join(', ')}</p>` : ''}
        ${a.techStack ? `<p><strong>Tech stack:</strong> ${a.techStack.map(t => escapeHtml(t)).join(', ')}</p>` : ''}
        <div class="architecture-footer">
          <span>Surface: presentation &amp; interaction</span>
          <span>Logic: assessment &amp; orchestration</span>
        </div>
      `;
    }

    // ------------------------------------------------------------------
    // Implementation — phased roadmap timeline (roadmap-timeline CSS)
    // ------------------------------------------------------------------
    if (reportImplementationBody && report.implementationPlan) {
      const p = report.implementationPlan;
      const phasesHtml = (p.phases || []).map(
        (ph, idx) => `
        <div class="roadmap-phase phase-${idx + 1}">
          <div class="roadmap-phase-header">
            <span class="roadmap-phase-name">${escapeHtml(ph.name)}</span>
            <span class="roadmap-phase-week">${escapeHtml(ph.duration || '')}</span>
          </div>
          <p class="roadmap-phase-desc">${(ph.deliverables || []).map(d => escapeHtml(d)).join(' · ')}</p>
        </div>
      `
      ).join('');
      reportImplementationBody.innerHTML = `
        <div class="roadmap-timeline">
          ${phasesHtml}
        </div>
        ${p.totalTimeline ? `<div class="roadmap-footer"><span>Total timeline</span><span class="gate">${escapeHtml(p.totalTimeline)}</span></div>` : ''}
      `;
    }

    // ------------------------------------------------------------------
    // Cost — estimate grid + break-even callout (cost-estimate-grid CSS)
    // ------------------------------------------------------------------
    if (reportCostBody && report.costEstimate) {
      const c = report.costEstimate;
      const dev = c.development || {};
      const ops = c.monthlyOperating || {};
      reportCostBody.innerHTML = `
        <div class="cost-estimate-grid">
          <div class="cost-item">
            <span class="cost-item-label">Development cost</span>
            <span class="cost-item-value">${dev.currency || 'USD'} ${dev.low ? dev.low.toLocaleString() : '–'} – ${dev.high ? dev.high.toLocaleString() : '–'}</span>
            <p class="cost-item-note">One-time build effort to MVP.</p>
          </div>
          <div class="cost-item">
            <span class="cost-item-label">Monthly operating</span>
            <span class="cost-item-value">${ops.currency || 'USD'} ${ops.low ? ops.low.toLocaleString() : '–'} – ${ops.high ? ops.high.toLocaleString() : '–'}</span>
            <p class="cost-item-note">Recurring cloud + third-party services.</p>
          </div>
        </div>
        <div class="cost-breakeven">
          <span class="cost-breakeven-icon" aria-hidden="true">●</span>
          <div class="cost-breakeven-text">
            <strong>Break-even note:</strong> ${escapeHtml(c.assumptions || 'Costs scale with usage; validate demand before committing to paid tiers.')}
          </div>
        </div>
      `;
    }

    // ------------------------------------------------------------------
    // Team — role requirements (team-requirement CSS)
    // ------------------------------------------------------------------
    if (reportTeamBody) {
      const roles = [
        { name: 'Product lead', role: 'Defines scope, prioritizes backlog, owns go/no-go decisions', alloc: '25%' },
        { name: 'Engineer', role: 'Builds MVP, integrates third-party services, maintains code', alloc: '50%' },
        { name: 'Designer (part-time)', role: 'UI/UX, brand application, responsive layouts', alloc: '15%' },
        { name: 'Operations (part-time)', role: 'Trust & safety, dispute handling, onboarding', alloc: '10%' },
      ];
      reportTeamBody.innerHTML = `
        ${roles.map((r) => `
          <div class="team-requirement">
            <div class="team-requirement-info">
              <span class="team-requirement-icon" aria-hidden="true">●</span>
              <div>
                <div class="team-requirement-name">${escapeHtml(r.name)}</div>
                <div class="team-requirement-role">${escapeHtml(r.role)}</div>
              </div>
            </div>
            <span class="team-requirement-alloc">${escapeHtml(r.alloc)}</span>
          </div>
        `).join('')}
      `;
    }

    // ------------------------------------------------------------------
    // Risks vs Assumptions — two-column grid (risk-assumption-grid CSS)
    // ------------------------------------------------------------------
    if (reportRisksBody) {
      const riskItems = (report.risks || []).slice(0, 4).map(r => escapeHtml(r));
      const assumptionItems = [
        'Pilot neighborhood is geographically compact (walking/biking distance).',
        'Initial tool inventory comes from a small founding group (seed supply).',
        'Disputes handled manually by platform admin at MVP.',
      ];
      reportRisksBody.innerHTML = `
        <div class="risk-assumption-grid">
          <div class="risk-column">
            <div class="risk-column-title">
              <span style="width:10px;height:10px;border-radius:50%;background:var(--color-amber-dark);display:inline-block;"></span>
              Critical Risks
            </div>
            ${riskItems.map(t => `<div class="risk-item"><div class="risk-item-title">${t.split('.')[0]}</div><div class="risk-item-desc">${escapeHtml(t)}</div></div>`).join('')}
          </div>
          <div class="assumption-column">
            <div class="assumption-column-title">
              <span style="width:10px;height:10px;border-radius:50%;background:var(--color-primary);display:inline-block;"></span>
              Core Assumptions
            </div>
            ${assumptionItems.map(t => `<div class="assumption-item"><div class="assumption-item-title">${t.split('.')[0]}</div><div class="assumption-item-desc">${escapeHtml(t)}</div></div>`).join('')}
          </div>
        </div>
      `;
    }

    // ------------------------------------------------------------------
    // Next steps — prioritized action list (next-steps-list CSS)
    // ------------------------------------------------------------------
    if (reportNextStepsBody && scheduleKickoff) {
      const nextSteps = report.nextSteps || [
        'Confirm problem–solution fit with 5–10 target users',
        'Scope MVP feature set and define acceptance criteria',
        'Set up repo, CI/CD, and static hosting',
        'Build first end-to-end flow and collect feedback',
      ];
      reportNextStepsBody.innerHTML = `
        <div class="next-steps-list">
          ${nextSteps.map((step, idx) => `
            <div class="next-step-item">
              <span class="next-step-number">${idx + 1}</span>
              <div class="next-step-content">
                <div class="next-step-title">${escapeHtml(step)}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="next-step-cta">
          <a href="#" id="schedule-kickoff">Schedule Kickoff with PocPilot Strategist →</a>
        </div>
      `;
    }
  }

  // Client-side timeout so the loading state always terminates
  const REPORT_TIMEOUT_MS = 30000;

  async function fetchLLMReport(idea, scores, overall) {
    showReportLoading();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REPORT_TIMEOUT_MS);

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, scores, overall }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server responded ${response.status}`);
      }
      const report = await response.json();
      renderReport(report);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        showReportError('The report is taking longer than expected. Please try again.');
      } else {
        showReportError(err.message);
      }
    } finally {
      // Safety net: ensure loading state always terminates
      hideReportLoading();
    }
  }

  // ------------------------------------------------------------------
  // Event handlers
  // ------------------------------------------------------------------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const idea = ideaInput.value.trim();
    if (!idea) {
      showIdeaError();
      return;
    }
    clearIdeaError();

    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-label').textContent = '';
    submitBtn.querySelector('.btn-arrow').style.display = 'none';
    submitBtn.classList.add('btn-loading');

    setTimeout(() => {
      try {
        const { scores, overall } = assess(idea);
        const risks = generateRisks(scores);

        // Store for report retry
        lastAssessment = { idea, scores, overall };

        renderOverallScore(overall);
        renderAssessmentIdea(idea);
        renderScores(scores);
        renderVerdict(overall);
        renderBuildBuy();
        renderRisks(risks);

        inputSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');

        // Move focus to the results heading so keyboard and screen-reader
        // users land in the updated content (focus precedes scroll).
        resultsHeading.focus({ preventScroll: true });
        scrollToSection(resultsSection);

        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-label').textContent = 'Assess feasibility';
        submitBtn.querySelector('.btn-arrow').style.display = 'inline';
        submitBtn.classList.remove('btn-loading');

        // Kick off async LLM report after deterministic results are shown
        fetchLLMReport(idea, scores, overall);
      } catch (err) {
        console.error('SetTimeout callback error:', err);
      }
    }, 120);
  });

  // Vector tag chips — pre-fill the textarea with an example
  const vectorTags = document.querySelectorAll('.vector-tag');
  const tagExamples = {
    'B2B SaaS': 'A B2B SaaS dashboard that helps small businesses track inventory, automate reordering, and generate financial reports — multi-tenant, with Stripe billing and Slack notifications.',
    'AI Workflows': 'An AI-powered workflow builder that lets non-technical users chain LLMs, vector search, and API calls to automate document processing and customer support.',
    'FinTech Compliance': 'A compliance automation platform for fintech startups that monitors transactions, flags AML/KYC violations, and generates audit-ready reports.',
    'Developer Tooling': 'A developer tool that analyzes GitHub PRs for security issues, suggests fixes, and auto-generates changelogs and documentation.',
  };
  vectorTags.forEach((tag) => {
    tag.addEventListener('click', () => {
      const label = tag.textContent.trim();
      const example = tagExamples[label];
      if (example) {
        ideaInput.value = example;
        clearIdeaError();
        ideaInput.focus();
        scrollToSection(inputSection);
      }
    });
  });

  resetBtn.addEventListener('click', () => {
    resultsSection.classList.add('hidden');
    inputSection.classList.remove('hidden');
    ideaError.hidden = true;
    ideaInput.removeAttribute('aria-invalid');
    ideaInput.focus();
    scrollToSection(inputSection);
  });

  backBtn.addEventListener('click', () => {
    resultsSection.classList.add('hidden');
    inputSection.classList.remove('hidden');
    ideaError.hidden = true;
    ideaInput.removeAttribute('aria-invalid');
    ideaInput.focus();
    scrollToSection(inputSection);
  });

  const assessAnotherBtn = document.getElementById('assess-another-btn');
  if (assessAnotherBtn) {
    assessAnotherBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resultsSection.classList.add('hidden');
      inputSection.classList.remove('hidden');
      ideaError.hidden = true;
      ideaInput.removeAttribute('aria-invalid');
      ideaInput.focus();
      scrollToSection(inputSection);
    });
  }

  const viewIdeaLink = document.getElementById('view-idea-link');
  if (viewIdeaLink) {
    viewIdeaLink.addEventListener('click', (e) => {
      e.preventDefault();
      resultsSection.classList.add('hidden');
      inputSection.classList.remove('hidden');
      ideaError.hidden = true;
      ideaInput.removeAttribute('aria-invalid');
      ideaInput.focus();
      scrollToSection(inputSection);
    });
  }

  // Report retry button — re-fetch LLM report with last assessment data
  const reportRetryBtn = document.getElementById('report-retry-btn');
  if (reportRetryBtn) {
    reportRetryBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!lastAssessment) return;
      const { idea, scores, overall } = lastAssessment;
      const errEl = document.getElementById('report-error');
      if (errEl) errEl.hidden = true;
      const secEl = document.getElementById('llm-report');
      if (secEl) secEl.hidden = true;
      // Hide all individual report sections
      [reportArchitectureSection, reportImplementationSection, reportCostSection, reportTeamSection, reportRisksSection, reportNextStepsSection, reportFeasibilitySection].forEach((s) => {
        if (s) s.hidden = true;
      });
      fetchLLMReport(idea, scores, overall);
    });
  }

  // Expose for debugging/testing
  window.fetchLLMReport = fetchLLMReport;
})();
