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

  // LLM report elements
  const reportLoading = document.getElementById('report-loading');
  const reportError = document.getElementById('report-error');
  const reportSection = document.getElementById('llm-report');
  const reportFeasibility = document.getElementById('report-feasibility');
  const reportArchitecture = document.getElementById('report-architecture');
  const reportImplementation = document.getElementById('report-implementation');
  const reportCost = document.getElementById('report-cost');
  const reportInfrastructure = document.getElementById('report-infrastructure');
  const reportRisksNextSteps = document.getElementById('report-risks-nextsteps');

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

    scoreGrid.innerHTML = dims
      .map(
        (d) => `
      <div class="score-card">
        <span class="score-value">${scores[d.key]}</span>
        <span class="score-label">${escapeHtml(d.label)}</span>
        <div class="score-meter">
          <div class="score-meter-fill" style="width: ${scores[d.key]}%"></div>
        </div>
      </div>
    `
      )
      .join('');
  }

  function renderVerdict(score) {
    const v = verdictFromScore(score);
    // Map the decision name to a CSS variant class; all colors/borders come
    // from theme tokens (see style.css .verdict--*). No inline styles.
    const key = v.name.toLowerCase().replace(/\s+/g, '-');

    const explanations = {
      'proceed': 'Strong problem–solution fit with manageable execution risk. Consider moving forward with a focused MVP.',
      'validate-further': 'Promising signals but some uncertainty remains. Test key assumptions before committing significant resources.',
      'pivot': 'Core concept may need refinement. Consider adjusting the target problem, audience, or approach.',
      'stop': 'Significant barriers detected. Revisit the problem and explore alternative approaches.',
    };

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
    `;
  }

  function renderBuildBuy() {
    compareBody.innerHTML = BUILD_BUY_OPTIONS.map(
      (o) => `
      <tr>
        <td><strong>${escapeHtml(o.option)}</strong></td>
        <td><ul>${o.pros.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul></td>
        <td><ul>${o.cons.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul></td>
        <td>${escapeHtml(o.effort)}</td>
      </tr>
    `
    ).join('');
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
  }

  function hideReportLoading() {
    const el = document.getElementById('report-loading');
    if (el) el.hidden = true;
  }

  function showReportError() {
    hideReportLoading();
    const errEl = document.getElementById('report-error');
    if (errEl) errEl.hidden = false;
    const secEl = document.getElementById('llm-report');
    if (secEl) secEl.hidden = true;
  }

  function renderReport(report) {
    if (!reportSection) return;

    hideReportLoading();
    reportSection.hidden = false;

    // Feasibility summary
    if (reportFeasibility && report.feasibilitySummary) {
      reportFeasibility.textContent = report.feasibilitySummary;
    }

    // Architecture
    if (reportArchitecture && report.architecture) {
      const a = report.architecture;
      reportArchitecture.innerHTML = `
        <p>${escapeHtml(a.overview || '')}</p>
        ${a.components ? `<p><strong>Components:</strong> ${a.components.map(c => escapeHtml(c)).join(', ')}</p>` : ''}
        ${a.techStack ? `<p><strong>Tech stack:</strong> ${a.techStack.map(t => escapeHtml(t)).join(', ')}</p>` : ''}
      `;
    }

    // Implementation plan
    if (reportImplementation && report.implementationPlan) {
      const p = report.implementationPlan;
      const phasesHtml = (p.phases || []).map(
        (ph) => `
        <div class="report-phase">
          <strong>${escapeHtml(ph.name)}</strong> — ${escapeHtml(ph.duration || '')}
          <ul>${(ph.deliverables || []).map(d => `<li>${escapeHtml(d)}</li>`).join('')}</ul>
        </div>
      `
      ).join('');
      reportImplementation.innerHTML = `
        ${phasesHtml}
        ${p.totalTimeline ? `<p><strong>Total timeline:</strong> ${escapeHtml(p.totalTimeline)}</p>` : ''}
      `;
    }

    // Cost estimate
    if (reportCost && report.costEstimate) {
      const c = report.costEstimate;
      const dev = c.development || {};
      const ops = c.monthlyOperating || {};
      reportCost.innerHTML = `
        <p><strong>Development cost:</strong> ${dev.currency || 'USD'} ${dev.low ? dev.low.toLocaleString() : '–'} – ${dev.high ? dev.high.toLocaleString() : '–'}</p>
        <p><strong>Monthly operating:</strong> ${ops.currency || 'USD'} ${ops.low ? ops.low.toLocaleString() : '–'} – ${ops.high ? ops.high.toLocaleString() : '–'}</p>
        ${c.assumptions ? `<p><em>${escapeHtml(c.assumptions)}</em></p>` : ''}
      `;
    }

    // Infrastructure
    if (reportInfrastructure && report.infrastructure) {
      const i = report.infrastructure;
      reportInfrastructure.innerHTML = `
        <p><strong>Hosting:</strong> ${escapeHtml(i.hosting || '')}</p>
        ${i.services ? `<p><strong>Services:</strong> ${i.services.map(s => escapeHtml(s)).join(', ')}</p>` : ''}
        ${i.security ? `<p><strong>Security:</strong> ${i.security.map(s => escapeHtml(s)).join(', ')}</p>` : ''}
        ${i.scalability ? `<p><strong>Scalability:</strong> ${escapeHtml(i.scalability)}</p>` : ''}
      `;
    }

    // Risks & next steps
    if (reportRisksNextSteps && (report.risks || report.nextSteps)) {
      const risksHtml = (report.risks || []).map(r => `<li>${escapeHtml(r)}</li>`).join('');
      const nextHtml = (report.nextSteps || []).map(r => `<li>${escapeHtml(r)}</li>`).join('');
      reportRisksNextSteps.innerHTML = `
        ${risksHtml ? `<h5>Risks</h5><ul>${risksHtml}</ul>` : ''}
        ${nextHtml ? `<h5>Next steps</h5><ul>${nextHtml}</ul>` : ''}
      `;
    }
  }

  async function fetchLLMReport(idea, scores, overall) {
    showReportLoading();
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, scores, overall }),
      });
      if (!response.ok) {
        throw new Error(`Server responded ${response.status}`);
      }
      const report = await response.json();
      renderReport(report);
    } catch (err) {
      // Network error (e.g., running file:// without a server) or server error
      showReportError();
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

  // Expose for debugging/testing
  window.fetchLLMReport = fetchLLMReport;
})();
