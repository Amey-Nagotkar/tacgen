/**
 * TAC Generator Visualizer - Interactive Frontend Application
 * Amey Nagotkar & Anand Raghvani - Compiler Design Case Study
 */

(function () {
  'use strict';

  // Application State
  const state = {
    data: null,
    metricsCsv: '',
    currentBenchmark: 'b1',
    currentTab: 'tokens',
    viewMode: 'structured', // 'structured' | 'raw'
    cfgZoom: 1.0,
    modalZoom: 1.0,
    tokenFilterClass: 'ALL',
    tokenSearchQuery: '',
    formatsSubtab: 'quadruples' // 'quadruples' | 'triples' | 'indirect' | 'memory' | 'edit_demo'
  };

  const STAGE_CONCEPTS = {
    tokens: {
      title: 'Lexical Analysis & Tokenization',
      reportTable: 'Stage-2 Report: Table 4',
      icon: '🔤',
      desc: 'Transforms source character stream into discrete lexical tokens. Keywords take priority over identifiers, and two-character relational operators (<=, >=, ==, !=) and boolean operators (&&, ||) are matched greedily using longest-match finite automata.'
    },
    ast: {
      title: 'Recursive-Descent Syntax Analysis (AST)',
      reportTable: 'Grammar & Syntax Trees (Section 2.2b)',
      icon: '🌳',
      desc: 'Constructs an Abstract Syntax Tree using a layered expression grammar. Left-recursion is rewritten into iterative loops to enforce left-associativity (e.g. a - b - c == (a - b) - c), while dangling-else statements bind to the nearest preceding if.'
    },
    tac: {
      title: 'Three Address Code Generation (SDT)',
      reportTable: 'Stage-2 Report: Table 6',
      icon: '📋',
      desc: 'Translates the AST into linear Three Address Code quadruples via syntax-directed translation. Emits virtual temporaries (newtemp()) and jump labels (newlabel()). Relational loop conditions invert their operator so the loop body falls through naturally.'
    },
    formats: {
      title: 'Intermediate Code Storage Formats',
      reportTable: 'Stage-2 Report: Tables 4-6 & 10',
      icon: '📦',
      desc: 'Compares three concrete storage models: Quadruples (named result, 13 bytes/entry), Triples (positional reference, 9 bytes/entry), and Indirect Triples (pointers list, 13 bytes/entry). Triples offer memory density but suffer from quadratic mutation renumbering costs.'
    },
    blocks: {
      title: 'Basic Block Partitioning & Leaders',
      reportTable: 'Basic Blocks (Section 2.2c)',
      icon: '🧱',
      desc: 'Partitions linear TAC into maximal sequences with single-entry single-exit execution. Leaders are: the first instruction, targets of any conditional/unconditional jumps, and instructions immediately following a jump or return. Retreating DFS back-edges identify loop headers.'
    },
    cfg: {
      title: 'Control Flow Graph (CFG) Construction',
      reportTable: 'Stage-2 Report: Figure 1',
      icon: '🕸️',
      desc: 'Direct graph representation where vertices are Basic Blocks and edges denote possible control transitions. Dead code unreachable from entry block B1 is automatically pruned. Loop back-edges (e.g. B3 -> B2) designate loop headers.'
    },
    opt: {
      title: 'Conventional Basic Block Optimizer',
      reportTable: 'Stage-2 Report: Table 9',
      icon: '⚡',
      desc: 'A 6-pass optimization pipeline executed within basic blocks: (1) Constant folding & propagation, (2) Strength reduction (* 2^k -> << k), (3) Common Subexpression Elimination via Local Value Numbering, (4) Copy propagation, (5) Dead-code elimination via global backward liveness, and (6) Virtual temporary coalescing.'
    },
    ssa: {
      title: 'Static Single Assignment (SSA) Construction',
      reportTable: 'Stage-2 Report: Tables 7 & 8',
      icon: '🔀',
      desc: 'Converts code into SSA form where every variable is defined exactly once. Compares Cytron et al.’s algorithm (iterated dominance frontiers DF+ and CHK dominator trees) with Braun et al. (CC 2013) on-the-fly construction using incomplete phis. Pruned SSA suppresses dead phis using backward liveness.'
    },
    ssaopt: {
      title: 'Sparse SSA-Form Optimization',
      reportTable: 'Sparse Optimization (Section 2.2d)',
      icon: '🚀',
      desc: 'Exploits explicit def-use chains in SSA form to propagate copies and constants directly without dataflow iterations (dataflow iterations = 0). Simplifies phi arguments and eliminates dead assignments in a single pass.'
    },
    metrics: {
      title: 'Empirical Metrics & Deletion Costs',
      reportTable: 'Empirical Results & Tables 10-13',
      icon: '📊',
      desc: 'Measures 37 empirical compiler metrics including memory footprint, instruction reductions, phase-by-phase steady_clock execution times, and the deletion-cost model demonstrating quadratic growth in triples compared to stable quadruples.'
    },
    all: {
      title: 'Full Pipeline Sequential Execution',
      reportTable: 'Complete Compiler Walkthrough',
      icon: '🔄',
      desc: 'Executes the entire compiler pipeline (--all) from unparsed source down to sparse optimized SSA code, displaying each phase in chronological sequence.'
    }
  };

  // DOM Elements
  const el = {};

  function cacheDom() {
    el.benchmarkSelector = document.getElementById('benchmark-selector');
    el.sourceFilename = document.getElementById('source-filename');
    el.sourceLinesCount = document.getElementById('source-lines-count');
    el.sourceCodeContent = document.getElementById('source-code-content');
    el.sourceCodeBody = document.getElementById('source-code-body');
    el.btnToggleSource = document.getElementById('btn-toggle-source');
    el.toggleSourceText = document.getElementById('toggle-source-text');
    el.btnCopySource = document.getElementById('btn-copy-source');
    el.benchmarkDescBox = document.getElementById('benchmark-desc-box');

    el.pipelineTabs = document.getElementById('pipeline-tabs');
    el.conceptIcon = document.getElementById('concept-icon');
    el.conceptTitle = document.getElementById('concept-title');
    el.conceptReportTable = document.getElementById('concept-report-table');
    el.conceptDesc = document.getElementById('concept-desc');

    el.btnViewStructured = document.getElementById('btn-view-structured');
    el.btnViewRaw = document.getElementById('btn-view-raw');
    el.btnCopyStageOutput = document.getElementById('btn-copy-stage-output');
    el.stageContentArea = document.getElementById('stage-content-area');

    el.btnResetDefault = document.getElementById('btn-reset-default');
    el.toastContainer = document.getElementById('toast-container');

    el.cfgModal = document.getElementById('cfg-modal');
    el.cfgModalImageWrapper = document.getElementById('cfg-modal-image-wrapper');
    el.btnModalClose = document.getElementById('btn-modal-close');
    el.btnModalZoomIn = document.getElementById('btn-modal-zoom-in');
    el.btnModalZoomOut = document.getElementById('btn-modal-zoom-out');
    el.btnModalZoomReset = document.getElementById('btn-modal-zoom-reset');
  }

  // Toast System
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? '✓' : 'ℹ';
    toast.innerHTML = `<span style="color: var(--cyan-primary); font-weight: bold;">${icon}</span> <span>${escapeHtml(message)}</span>`;
    el.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2400);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Copy to Clipboard Helper
  function copyText(text, successMsg = 'Copied to clipboard!') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast(successMsg, 'success'));
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        showToast(successMsg, 'success');
      } catch (err) {
        showToast('Failed to copy', 'error');
      }
      document.body.removeChild(ta);
    }
  }

  // Load Data
  async function loadData() {
    if (window.TACGEN_DATA) {
      state.data = window.TACGEN_DATA;
    } else {
      try {
        const res = await fetch('data/benchmarks.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        state.data = await res.json();
      } catch (err) {
        console.warn('Could not fetch data/benchmarks.json, checking fallback...', err);
        showToast('Error loading benchmark data. Please check data files.', 'error');
        return;
      }
    }

    try {
      const csvRes = await fetch('data/metrics.csv');
      if (csvRes.ok) {
        state.metricsCsv = await csvRes.text();
      }
    } catch (e) {
      // optional
    }

    renderBenchmarkSelector();
    updateBenchmarkView();
  }

  // Render Benchmark Selector Cards
  function renderBenchmarkSelector() {
    if (!state.data) return;
    el.benchmarkSelector.innerHTML = '';

    Object.keys(state.data).forEach(bid => {
      const b = state.data[bid];
      const card = document.createElement('button');
      card.className = `benchmark-card ${bid === state.currentBenchmark ? 'active' : ''}`;
      card.id = `btn-bench-${bid}`;
      card.setAttribute('role', 'radio');
      card.setAttribute('aria-checked', bid === state.currentBenchmark ? 'true' : 'false');

      let tagsHtml = '';
      if (bid === 'b1') {
        tagsHtml = '<span class="badge badge-indigo">While-Loop</span> <span class="badge badge-accent">Relop Jumps</span>';
      } else if (bid === 'b2') {
        tagsHtml = '<span class="badge badge-purple">Basic Block</span> <span class="badge badge-warning">12 -> 4 Opt</span>';
      } else if (bid === 'b3') {
        tagsHtml = '<span class="badge badge-teal">CSE Formats</span> <span class="badge badge-neutral">Edit Demo</span>';
      } else if (bid === 'b4') {
        tagsHtml = '<span class="badge badge-success">Nested Loops</span> <span class="badge badge-accent">16 Temps</span>';
      }

      card.innerHTML = `
        <div>
          <div class="benchmark-header">
            <span class="benchmark-tag">${bid.toUpperCase()}</span>
            <span class="badge badge-neutral">${b.source.trim().split('\n').length} lines</span>
          </div>
          <div class="benchmark-name">${escapeHtml(b.name.split(':')[1] || b.name)}</div>
          <div class="benchmark-desc-snippet">${escapeHtml(b.description.substring(0, 85))}...</div>
        </div>
        <div class="benchmark-footer-badges">${tagsHtml}</div>
      `;

      card.addEventListener('click', () => {
        if (state.currentBenchmark !== bid) {
          state.currentBenchmark = bid;
          updateBenchmarkSelectorActive();
          updateBenchmarkView();
        }
      });

      el.benchmarkSelector.appendChild(card);
    });
  }

  function updateBenchmarkSelectorActive() {
    document.querySelectorAll('.benchmark-card').forEach(c => {
      const isCurrent = c.id === `btn-bench-${state.currentBenchmark}`;
      c.classList.toggle('active', isCurrent);
      c.setAttribute('aria-checked', isCurrent ? 'true' : 'false');
    });
  }

  function updateBenchmarkView() {
    if (!state.data || !state.data[state.currentBenchmark]) return;
    const b = state.data[state.currentBenchmark];

    el.sourceFilename.textContent = b.file;
    const lines = b.source.trim().split('\n');
    el.sourceLinesCount.textContent = `${lines.length} lines`;

    // Format source code with line numbers
    const numberedLines = lines.map((l, i) => {
      const lineNum = String(i + 1).padStart(2, ' ');
      return `<span style="color: #64748B; user-select: none;">${lineNum} | </span>${escapeHtml(l)}`;
    }).join('\n');
    el.sourceCodeContent.innerHTML = numberedLines;

    el.benchmarkDescBox.innerHTML = `
      <span style="color: var(--cyan-primary); font-size: 1.1rem; line-height: 1;">📌</span>
      <div><strong>${escapeHtml(b.name)}:</strong> ${escapeHtml(b.description)}</div>
    `;

    renderStage();
  }

  // Render Current Stage View
  function renderStage() {
    const tabKey = state.currentTab;
    const concept = STAGE_CONCEPTS[tabKey] || STAGE_CONCEPTS.tokens;

    el.conceptIcon.textContent = concept.icon;
    el.conceptTitle.textContent = concept.title;
    el.conceptReportTable.textContent = concept.reportTable;
    el.conceptDesc.textContent = concept.desc;

    // View mode toggle
    el.btnViewStructured.classList.toggle('active', state.viewMode === 'structured');
    el.btnViewRaw.classList.toggle('active', state.viewMode === 'raw');

    const b = state.data[state.currentBenchmark];
    if (!b) return;

    if (state.viewMode === 'raw') {
      renderRawStageOutput(b, tabKey);
    } else {
      switch (tabKey) {
        case 'tokens': renderTokensStage(b); break;
        case 'ast': renderAstStage(b); break;
        case 'tac': renderTacStage(b); break;
        case 'formats': renderFormatsStage(b); break;
        case 'blocks': renderBlocksStage(b); break;
        case 'cfg': renderCfgStage(b); break;
        case 'opt': renderOptStage(b); break;
        case 'ssa': renderSsaStage(b); break;
        case 'ssaopt': renderSsaOptStage(b); break;
        case 'metrics': renderMetricsStage(b); break;
        case 'all': renderAllStage(b); break;
        default: renderTokensStage(b); break;
      }
    }
  }

  function getRawStageText(b, tabKey) {
    switch (tabKey) {
      case 'tokens': return b.tokens.raw;
      case 'ast': return b.ast.raw;
      case 'tac': return b.tac.raw;
      case 'formats': return b.formats.raw + (b.formats.edit_demo ? '\n\n' + b.formats.edit_demo.raw : '');
      case 'blocks': return b.blocks.raw;
      case 'cfg': return b.cfg.dot;
      case 'opt': return b.opt.raw;
      case 'ssa': return b.ssa.raw;
      case 'ssaopt': return b.ssa_opt.raw;
      case 'metrics': return b.metrics.raw;
      case 'all': return b.all.raw;
      default: return '';
    }
  }

  function renderRawStageOutput(b, tabKey) {
    const rawText = getRawStageText(b, tabKey);
    el.stageContentArea.innerHTML = `
      <div class="card-header" style="background: rgba(0,0,0,0.3); border-radius: 8px 8px 0 0;">
        <span class="badge badge-neutral">CLI Standard Output</span>
        <button id="btn-copy-raw-block" class="btn btn-secondary btn-xs">Copy Terminal Output</button>
      </div>
      <pre class="raw-output-pre">${escapeHtml(rawText)}</pre>
    `;
    document.getElementById('btn-copy-raw-block')?.addEventListener('click', () => {
      copyText(rawText);
    });
  }

  // 1. Tokens Tab
  function renderTokensStage(b) {
    const tokens = b.tokens.parsed || [];
    const classes = ['ALL', 'KEYWORD', 'ID', 'NUM', 'RELOP', 'LOGOP', 'ARITH/ASSIGN', 'DELIM'];

    const filtered = tokens.filter(t => {
      const matchClass = state.tokenFilterClass === 'ALL' || t.class === state.tokenFilterClass;
      const matchSearch = !state.tokenSearchQuery || t.lexeme.toLowerCase().includes(state.tokenSearchQuery.toLowerCase());
      return matchClass && matchSearch;
    });

    let chipsHtml = classes.map(c => `
      <button class="chip-btn ${state.tokenFilterClass === c ? 'active' : ''}" data-class="${c}">${c}</button>
    `).join('');

    let rowsHtml = filtered.map(t => {
      const badgeCls = `token-${t.class.replace('/', '_')}`;
      return `
        <tr>
          <td style="color: var(--text-dim); font-family: var(--font-mono); width: 80px;">Line ${t.line}</td>
          <td style="width: 180px;"><span class="token-badge ${badgeCls}">${escapeHtml(t.class)}</span></td>
          <td class="code-cell"><code>${escapeHtml(t.lexeme)}</code></td>
        </tr>
      `;
    }).join('');

    el.stageContentArea.innerHTML = `
      <div class="filter-toolbar">
        <div class="filter-chips" id="token-chips-group">${chipsHtml}</div>
        <div class="search-input-wrap">
          <input type="text" id="token-search-input" class="search-input" placeholder="Search lexeme..." value="${escapeHtml(state.tokenSearchQuery)}">
        </div>
      </div>
      <div class="table-responsive" style="max-height: 480px;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Line</th>
              <th>Token Class</th>
              <th>Lexeme</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="3" style="text-align:center; padding: 20px; color: var(--text-dim);">No matching tokens found</td></tr>'}
          </tbody>
        </table>
      </div>
      <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 8px;">
        Total Tokens: ${tokens.length} | Filtered: ${filtered.length}
      </div>
    `;

    document.querySelectorAll('#token-chips-group .chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.tokenFilterClass = btn.dataset.class;
        renderTokensStage(b);
      });
    });

    const searchInp = document.getElementById('token-search-input');
    searchInp?.addEventListener('input', (e) => {
      state.tokenSearchQuery = e.target.value;
      renderTokensStage(b);
      document.getElementById('token-search-input').focus();
    });
  }

  // 2. AST Tab
  function renderAstStage(b) {
    el.stageContentArea.innerHTML = `
      <div class="pane-header" style="background: rgba(255,255,255,0.02); margin-bottom: 12px; border-radius: var(--radius-sm); padding: 10px 14px;">
        <span>Abstract Syntax Tree (Recursive-Descent Parser Output)</span>
        <span class="badge badge-purple">Left-Associative Trees</span>
      </div>
      <pre class="code-pre" style="background: #06090E; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); max-height: 520px; overflow-y: auto;"><code>${escapeHtml(b.ast.raw)}</code></pre>
    `;
  }

  // 3. TAC Tab
  function renderTacStage(b) {
    const instrs = b.tac.parsed ? b.tac.parsed.instructions : [];
    const summary = b.tac.parsed ? b.tac.parsed.summary : '';

    let rowsHtml = instrs.map(q => {
      const hasLabel = Boolean(q.label);
      return `
        <tr style="${hasLabel ? 'background: rgba(14, 165, 233, 0.05);' : ''}">
          <td style="color: var(--text-dim); font-family: var(--font-mono); width: 60px;">${q.num}:</td>
          <td style="width: 100px;">${hasLabel ? `<span class="badge badge-accent">${escapeHtml(q.label)}</span>` : '<span style="color: var(--text-dim);">-</span>'}</td>
          <td class="code-cell" style="font-weight: 500;">${escapeHtml(q.code)}</td>
        </tr>
      `;
    }).join('');

    el.stageContentArea.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <span style="font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(summary)}</span>
        <span class="badge badge-teal">Syntax-Directed Translation</span>
      </div>
      <div class="table-responsive" style="max-height: 480px;">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Label</th>
              <th>TAC Quadruple Instruction</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    `;
  }

  // 4. IR Formats Tab
  function renderFormatsStage(b) {
    const f = b.formats.parsed || {};
    const sub = state.formatsSubtab;

    let subnavHtml = `
      <div class="subtabs-bar">
        <button class="subtab-btn ${sub === 'quadruples' ? 'active' : ''}" data-sub="quadruples">Quadruples</button>
        <button class="subtab-btn ${sub === 'triples' ? 'active' : ''}" data-sub="triples">Triples</button>
        <button class="subtab-btn ${sub === 'indirect' ? 'active' : ''}" data-sub="indirect">Indirect Triples</button>
        <button class="subtab-btn ${sub === 'memory' ? 'active' : ''}" data-sub="memory">Memory Footprint</button>
        ${b.formats.edit_demo ? `<button class="subtab-btn ${sub === 'edit_demo' ? 'active' : ''}" data-sub="edit_demo">Stage-2 Table 10 (Edit Demo)</button>` : ''}
      </div>
    `;

    let contentHtml = '';

    if (sub === 'quadruples') {
      const rows = (f.quadruples || []).map(r => `
        <tr>
          <td style="font-family: var(--font-mono); color: var(--cyan-primary);">${escapeHtml(r.index)}</td>
          <td><strong>${escapeHtml(r.op)}</strong></td>
          <td class="code-cell">${escapeHtml(r.arg1)}</td>
          <td class="code-cell">${escapeHtml(r.arg2)}</td>
          <td style="font-weight: 600; color: #A5B4FC;">${escapeHtml(r.result)}</td>
          <td>${r.label ? `<span class="badge badge-accent">${escapeHtml(r.label)}</span>` : ''}</td>
        </tr>
      `).join('');

      contentHtml = `
        <div class="table-responsive" style="max-height: 420px;">
          <table class="data-table">
            <thead>
              <tr><th>Index</th><th>Operator</th><th>Arg1</th><th>Arg2</th><th>Result Name</th><th>Label</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    } else if (sub === 'triples') {
      const rows = (f.triples || []).map(r => `
        <tr>
          <td style="font-family: var(--font-mono); color: var(--cyan-primary);">${escapeHtml(r.index)}</td>
          <td><strong>${escapeHtml(r.op)}</strong></td>
          <td class="code-cell">${escapeHtml(r.arg1)}</td>
          <td class="code-cell">${escapeHtml(r.arg2)}</td>
          <td>${r.label ? `<span class="badge badge-accent">${escapeHtml(r.label)}</span>` : ''}</td>
        </tr>
      `).join('');

      contentHtml = `
        <div class="table-responsive" style="max-height: 420px;">
          <table class="data-table">
            <thead>
              <tr><th>Index</th><th>Operator</th><th>Arg1</th><th>Arg2 (or Target)</th><th>Label</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 10px;">
          * Note: Positional references (e.g. (2)) denote the result of row 2. Relational branches split into comparison + branch.
        </p>
      `;
    } else if (sub === 'indirect') {
      const rows = (f.indirect_triples || []).map(r => `
        <tr>
          <td style="font-family: var(--font-mono); color: #FCD34D;">${escapeHtml(r.pointer)}</td>
          <td style="font-family: var(--font-mono); color: var(--cyan-primary);">${escapeHtml(r.target)}</td>
        </tr>
      `).join('');

      contentHtml = `
        <div class="table-responsive" style="max-height: 420px; max-width: 450px;">
          <table class="data-table">
            <thead>
              <tr><th>Pointer Address</th><th>Target Triple Index</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    } else if (sub === 'memory') {
      const summary = f.summary || [];
      const q = summary.find(s => s.format === 'quadruples') || { entries: 0, bytes: 0 };
      const t = summary.find(s => s.format === 'triples') || { entries: 0, bytes: 0 };
      const it = summary.find(s => s.format === 'indirect triples') || { entries: 0, bytes: 0 };

      contentHtml = `
        <div class="formats-metrics-grid">
          <div class="format-stat-card">
            <span class="format-stat-title">Quadruples Representation</span>
            <span class="format-stat-bytes">${q.bytes} Bytes</span>
            <span class="format-stat-formula">${q.entries} entries &times; 13 bytes (op:1 + 3 fields:12)</span>
            <span class="badge badge-accent" style="margin-top: 12px; align-self: flex-start;">Named Results &bull; Stable Edits</span>
          </div>
          <div class="format-stat-card">
            <span class="format-stat-title">Triples Representation</span>
            <span class="format-stat-bytes" style="color: #6EE7B7;">${t.bytes} Bytes</span>
            <span class="format-stat-formula">${t.entries} entries &times; 9 bytes (op:1 + 2 fields:8)</span>
            <span class="badge badge-success" style="margin-top: 12px; align-self: flex-start;">Most Compact &bull; Expensive Edits</span>
          </div>
          <div class="format-stat-card">
            <span class="format-stat-title">Indirect Triples</span>
            <span class="format-stat-bytes" style="color: #FCD34D;">${it.bytes} Bytes</span>
            <span class="format-stat-formula">${it.entries} entries &times; 13 bytes (triple:9 + ptr:4)</span>
            <span class="badge badge-warning" style="margin-top: 12px; align-self: flex-start;">Pointer Indirection &bull; Easy Reordering</span>
          </div>
        </div>
      `;
    } else if (sub === 'edit_demo' && b.formats.edit_demo) {
      contentHtml = `
        <div class="pane-header" style="background: rgba(255,255,255,0.02); margin-bottom: 12px; border-radius: var(--radius-sm); padding: 10px 14px;">
          <span>Stage-2 Report Table 10 Simulation: Eliminating duplicate subexpression in a = b * -c + b * -c</span>
          <span class="badge badge-teal">--edit-demo "2:0,3:1"</span>
        </div>
        <pre class="code-pre" style="background: #06090E; border: 1px solid var(--border-subtle); border-radius: var(--radius-md);"><code>${escapeHtml(b.formats.edit_demo.raw)}</code></pre>
      `;
    }

    el.stageContentArea.innerHTML = subnavHtml + contentHtml;

    document.querySelectorAll('.subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.formatsSubtab = btn.dataset.sub;
        renderFormatsStage(b);
      });
    });
  }

  // 5. Basic Blocks Tab
  function renderBlocksStage(b) {
    const blocksData = b.blocks.parsed || {};
    const blocks = blocksData.blocks || [];
    const sum = blocksData.summary || {};
    const backEdges = blocksData.back_edges || [];

    let cardsHtml = blocks.map(blk => `
      <div class="block-card">
        <div class="block-header">
          <span class="block-id-tag">${blk.id}</span>
          <span class="badge badge-neutral">${blk.range}</span>
          ${blk.labels ? `<span class="badge badge-accent">${escapeHtml(blk.labels)}</span>` : ''}
        </div>
        <div class="block-body-instrs">
          ${blk.instrs.map(i => `<div>${escapeHtml(i)}</div>`).join('')}
        </div>
        <div class="block-footer-edges">
          <span>Pred: ${blk.pred.length > 0 ? blk.pred.join(', ') : 'none (entry)'}</span>
          <span>Succ: ${blk.succ.length > 0 ? blk.succ.join(', ') : 'none (exit)'}</span>
        </div>
      </div>
    `).join('');

    el.stageContentArea.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
        <div style="font-size: 0.85rem; color: #CBD5E1;">
          <strong>Total Blocks:</strong> ${sum.blocks || blocks.length} &bull; 
          <strong>Edges:</strong> ${sum.edges || 0} &bull; 
          <strong>Back Edges:</strong> ${backEdges.length > 0 ? backEdges.join(', ') : 'none'}
        </div>
        <span class="badge badge-purple">Single-Entry Single-Exit</span>
      </div>
      <div class="blocks-grid">${cardsHtml}</div>
    `;
  }

  // 6. CFG Diagram Tab
  function renderCfgStage(b) {
    el.stageContentArea.innerHTML = `
      <div class="cfg-viewer-container">
        <div class="cfg-toolbar">
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="font-size: 0.82rem; font-weight: 600; color: #CBD5E1;">Control Flow Graph</span>
            <span class="badge badge-teal">Graphviz Vector Render</span>
          </div>
          <div style="display: flex; gap: 6px;">
            <button id="btn-cfg-zoom-in" class="btn btn-secondary btn-xs" title="Zoom In">+</button>
            <button id="btn-cfg-zoom-out" class="btn btn-secondary btn-xs" title="Zoom Out">-</button>
            <button id="btn-cfg-zoom-reset" class="btn btn-secondary btn-xs" title="Reset Zoom">Reset</button>
            <button id="btn-cfg-fullscreen" class="btn btn-primary btn-xs" title="Open Fullscreen Modal">Fullscreen</button>
            <button id="btn-copy-dot" class="btn btn-ghost btn-xs" title="Copy Graphviz DOT code">Copy DOT</button>
          </div>
        </div>
        <div id="cfg-viewport-box" class="cfg-viewport-box">
          <div id="cfg-svg-container" class="cfg-svg-render" style="transform: scale(${state.cfgZoom}); transform-origin: center center;">
            ${b.cfg.svg || `<img src="${b.cfg.png_url}" alt="CFG Diagram" style="max-width: 100%;">`}
          </div>
        </div>
        <details style="margin-top: 10px;">
          <summary style="font-size: 0.8rem; color: var(--text-muted); cursor: pointer; padding: 6px;">View Graphviz DOT Source Code</summary>
          <pre class="code-pre" style="margin-top: 6px; background: #06090E; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 0.78rem;"><code>${escapeHtml(b.cfg.dot)}</code></pre>
        </details>
      </div>
    `;

    document.getElementById('btn-cfg-zoom-in')?.addEventListener('click', () => {
      state.cfgZoom = Math.min(state.cfgZoom + 0.2, 3.0);
      document.getElementById('cfg-svg-container').style.transform = `scale(${state.cfgZoom})`;
    });

    document.getElementById('btn-cfg-zoom-out')?.addEventListener('click', () => {
      state.cfgZoom = Math.max(state.cfgZoom - 0.2, 0.4);
      document.getElementById('cfg-svg-container').style.transform = `scale(${state.cfgZoom})`;
    });

    document.getElementById('btn-cfg-zoom-reset')?.addEventListener('click', () => {
      state.cfgZoom = 1.0;
      document.getElementById('cfg-svg-container').style.transform = `scale(1.0)`;
    });

    document.getElementById('btn-copy-dot')?.addEventListener('click', () => {
      copyText(b.cfg.dot, 'Copied Graphviz DOT code!');
    });

    document.getElementById('btn-cfg-fullscreen')?.addEventListener('click', () => {
      openCfgModal(b);
    });
  }

  function openCfgModal(b) {
    state.modalZoom = 1.0;
    el.cfgModalImageWrapper.innerHTML = b.cfg.svg || `<img src="${b.cfg.png_url}" alt="CFG Diagram">`;
    el.cfgModal.classList.add('open');
    el.cfgModal.setAttribute('aria-hidden', 'false');
  }

  function closeCfgModal() {
    el.cfgModal.classList.remove('open');
    el.cfgModal.setAttribute('aria-hidden', 'true');
  }

  // 7. Conventional Optimizer Tab
  function renderOptStage(b) {
    const opt = b.opt.parsed || {};
    const passTable = opt.pass_table || [];

    let tableRows = passTable.map(p => `
      <tr>
        <td style="width: 50px; font-family: var(--font-mono); color: var(--cyan-primary);">${p.pass_num}</td>
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td style="color: ${p.changes > 0 ? '#6EE7B7' : 'var(--text-dim)'}; font-family: var(--font-mono);">${p.changes}</td>
        <td style="font-family: var(--font-mono); font-weight: 600;">${p.instrs_after}</td>
      </tr>
    `).join('');

    el.stageContentArea.innerHTML = `
      <div class="pane-header" style="background: rgba(255,255,255,0.02); margin-bottom: 12px; border-radius: var(--radius-sm); padding: 10px 14px;">
        <span>Stage-2 Report Table 9: 6-Pass Conventional Basic Block Optimization Pipeline</span>
        <span class="badge badge-purple">${escapeHtml(opt.summary || '')}</span>
      </div>
      <div class="table-responsive" style="margin-bottom: 18px;">
        <table class="data-table">
          <thead>
            <tr><th>No.</th><th>Pass Name</th><th>Changes</th><th>Instrs After</th></tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
      <div class="side-by-side-wrap">
        <div class="side-by-side-pane">
          <div class="pane-header">
            <span>Before Optimization (Initial TAC)</span>
            <span class="badge badge-neutral">${b.tac.parsed?.instructions.length || ''} instrs</span>
          </div>
          <div class="pane-content">${escapeHtml(b.tac.raw)}</div>
        </div>
        <div class="side-by-side-pane">
          <div class="pane-header">
            <span>Optimized Code</span>
            <span class="badge badge-success">Optimized</span>
          </div>
          <div class="pane-content">${escapeHtml(opt.optimized_code || '')}</div>
        </div>
      </div>
    `;
  }

  // 8. SSA Construction Tab
  function renderSsaStage(b) {
    const ssa = b.ssa.parsed || {};
    const domTable = ssa.dom_table || [];

    let domRows = domTable.map(d => `
      <tr>
        <td style="font-family: var(--font-mono); color: var(--cyan-primary); font-weight: 600;">${escapeHtml(d.block)}</td>
        <td style="font-family: var(--font-mono);">${escapeHtml(d.idom)}</td>
        <td style="font-family: var(--font-mono); color: #FCD34D;">${escapeHtml(d.df)}</td>
        <td style="font-family: var(--font-mono); color: #A5B4FC;">${escapeHtml(d.phis)}</td>
      </tr>
    `).join('');

    el.stageContentArea.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
        <div style="font-size: 0.85rem; color: #CBD5E1;">
          <strong>Cytron Dominance Frontier SSA</strong> &bull; 
          <span class="badge badge-success">${escapeHtml(ssa.verify || 'verify: OK')}</span> &bull; 
          <span class="badge badge-accent">${escapeHtml(ssa.summary || '')}</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="btn-toggle-unpruned-view" class="btn btn-secondary btn-xs">Compare Unpruned vs Pruned</button>
        </div>
      </div>
      <div class="table-responsive" style="margin-bottom: 16px;">
        <table class="data-table">
          <thead>
            <tr><th>Block</th><th>Immediate Dominator (idom)</th><th>Dominance Frontier (DF)</th><th>&phi; Placed For</th></tr>
          </thead>
          <tbody>${domRows}</tbody>
        </table>
      </div>
      <div class="side-by-side-wrap" id="ssa-side-by-side">
        <div class="side-by-side-pane">
          <div class="pane-header">
            <span>Conventional Blocks</span>
            <span class="badge badge-neutral">Pre-SSA</span>
          </div>
          <div class="pane-content">${escapeHtml(b.blocks.raw)}</div>
        </div>
        <div class="side-by-side-pane">
          <div class="pane-header">
            <span>SSA Form (Cytron Pruned)</span>
            <span class="badge badge-teal">Minimal &phi;</span>
          </div>
          <div class="pane-content">${escapeHtml(ssa.ssa_code || '')}</div>
        </div>
      </div>
      <div class="card" style="margin-top: 16px; padding: 14px; background: rgba(0,0,0,0.25);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600; font-size: 0.82rem; color: #E2E8F0;">Cross-Validation: Braun et al. (CC 2013) On-The-Fly Construction</span>
          <span class="badge badge-accent">--ssa-compare</span>
        </div>
        <pre class="code-pre" style="margin-top: 8px; font-size: 0.78rem; background: #06090E; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm);"><code>${escapeHtml(b.compare.raw)}</code></pre>
      </div>
    `;

    document.getElementById('btn-toggle-unpruned-view')?.addEventListener('click', () => {
      const pane = document.getElementById('ssa-side-by-side');
      if (!pane) return;
      pane.innerHTML = `
        <div class="side-by-side-pane">
          <div class="pane-header">
            <span>Cytron Pruned SSA</span>
            <span class="badge badge-teal">Liveness Filtered</span>
          </div>
          <div class="pane-content">${escapeHtml(ssa.ssa_code || '')}</div>
        </div>
        <div class="side-by-side-pane">
          <div class="pane-header">
            <span>Cytron Unpruned (Maximal) SSA</span>
            <span class="badge badge-warning">All DF+ Phis</span>
          </div>
          <div class="pane-content">${escapeHtml(b.ssa.unpruned_raw || '')}</div>
        </div>
      `;
    });
  }

  // 9. Sparse SSA Optimization Tab
  function renderSsaOptStage(b) {
    const ssaOpt = b.ssa_opt.parsed || {};

    el.stageContentArea.innerHTML = `
      <div class="pane-header" style="background: rgba(255,255,255,0.02); margin-bottom: 12px; border-radius: var(--radius-sm); padding: 10px 14px;">
        <span style="font-weight: 600; color: #CBD5E1;">${escapeHtml(ssaOpt.summary || '')}</span>
        <span class="badge badge-success">${escapeHtml(ssaOpt.verify || 'verify: OK')}</span>
      </div>
      <div class="side-by-side-wrap">
        <div class="side-by-side-pane">
          <div class="pane-header">
            <span>SSA Form Before Optimization</span>
            <span class="badge badge-neutral">Pruned SSA</span>
          </div>
          <div class="pane-content">${escapeHtml(b.ssa.parsed?.ssa_code || '')}</div>
        </div>
        <div class="side-by-side-pane">
          <div class="pane-header">
            <span>SSA Form After Sparse Optimization</span>
            <span class="badge badge-success">Optimized</span>
          </div>
          <div class="pane-content">${escapeHtml(ssaOpt.code || '')}</div>
        </div>
      </div>
    `;
  }

  // 10. Metrics Tab
  function renderMetricsStage(b) {
    const currentMetrics = b.metrics.parsed || {};
    const allMetricsList = Object.keys(currentMetrics);

    let rowsHtml = allMetricsList.map(m => {
      const val = currentMetrics[m];
      const isTime = m.startsWith('time_');
      return `
        <tr>
          <td style="font-family: var(--font-mono); font-weight: 500; color: ${isTime ? '#CBD5E1' : 'var(--cyan-primary)'}; width: 280px;">${escapeHtml(m)}</td>
          <td style="font-family: var(--font-mono); font-weight: 600;">
            ${escapeHtml(val)} ${isTime ? '<span style="font-size: 0.7rem; color: var(--text-dim); font-weight: normal;">(indicative only &mu;s)</span>' : ''}
          </td>
        </tr>
      `;
    }).join('');

    // Cross-benchmark comparison table
    const benchmarks = Object.keys(state.data);
    let crossHeaders = benchmarks.map(bid => `<th>${bid.toUpperCase()}</th>`).join('');
    let crossRows = allMetricsList.map(m => {
      const isTime = m.startsWith('time_');
      const cells = benchmarks.map(bid => {
        const v = (state.data[bid].metrics.parsed || {})[m] || '-';
        return `<td style="font-family: var(--font-mono); font-weight: 500;">${escapeHtml(v)}</td>`;
      }).join('');
      return `
        <tr>
          <td style="font-family: var(--font-mono); color: ${isTime ? '#CBD5E1' : 'var(--cyan-primary)'}; font-weight: 600;">${escapeHtml(m)}</td>
          ${cells}
        </tr>
      `;
    }).join('');

    el.stageContentArea.innerHTML = `
      <div class="subtabs-bar" id="metrics-view-selector">
        <button class="subtab-btn active" id="btn-sub-current-metrics">Benchmark ${b.id.toUpperCase()} Metrics</button>
        <button class="subtab-btn" id="btn-sub-all-benchmarks">Cross-Benchmark Matrix (b1 - b4)</button>
      </div>

      <div id="metrics-current-pane">
        <div class="table-responsive" style="max-height: 480px;">
          <table class="data-table">
            <thead>
              <tr><th>Metric Name</th><th>Measured Value</th></tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      </div>

      <div id="metrics-matrix-pane" style="display: none;">
        <div class="table-responsive" style="max-height: 480px;">
          <table class="data-table">
            <thead>
              <tr><th>Metric</th>${crossHeaders}</tr>
            </thead>
            <tbody>${crossRows}</tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('btn-sub-current-metrics')?.addEventListener('click', (e) => {
      e.target.classList.add('active');
      document.getElementById('btn-sub-all-benchmarks').classList.remove('active');
      document.getElementById('metrics-current-pane').style.display = 'block';
      document.getElementById('metrics-matrix-pane').style.display = 'none';
    });

    document.getElementById('btn-sub-all-benchmarks')?.addEventListener('click', (e) => {
      e.target.classList.add('active');
      document.getElementById('btn-sub-current-metrics').classList.remove('active');
      document.getElementById('metrics-current-pane').style.display = 'none';
      document.getElementById('metrics-matrix-pane').style.display = 'block';
    });
  }

  // 11. Full Pipeline Tab (--all)
  function renderAllStage(b) {
    el.stageContentArea.innerHTML = `
      <div class="pane-header" style="background: rgba(255,255,255,0.02); margin-bottom: 12px; border-radius: var(--radius-sm); padding: 10px 14px;">
        <span>Unified Compilation Pipeline Output (tacgen ${escapeHtml(b.file)} --all)</span>
        <button id="btn-copy-all-stages" class="btn btn-secondary btn-xs">Copy Complete Listing</button>
      </div>
      <pre class="code-pre" style="background: #06090E; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); max-height: 560px; overflow-y: auto;"><code>${escapeHtml(b.all.raw)}</code></pre>
    `;

    document.getElementById('btn-copy-all-stages')?.addEventListener('click', () => {
      copyText(b.all.raw, 'Copied complete pipeline listing!');
    });
  }

  // Event Listeners Initialization
  function initEventListeners() {
    // Pipeline Tabs Switching
    el.pipelineTabs.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        el.pipelineTabs.querySelectorAll('.tab-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        state.currentTab = btn.dataset.tab;
        renderStage();
      });
    });

    // View Mode Toggle (Visual vs Raw)
    el.btnViewStructured.addEventListener('click', () => {
      state.viewMode = 'structured';
      renderStage();
    });

    el.btnViewRaw.addEventListener('click', () => {
      state.viewMode = 'raw';
      renderStage();
    });

    // Copy Stage Output Button
    el.btnCopyStageOutput.addEventListener('click', () => {
      const b = state.data[state.currentBenchmark];
      if (!b) return;
      const text = getRawStageText(b, state.currentTab);
      copyText(text, `Copied ${state.currentTab.toUpperCase()} output!`);
    });

    // Copy Source Code Button
    el.btnCopySource.addEventListener('click', () => {
      const b = state.data[state.currentBenchmark];
      if (!b) return;
      copyText(b.source, 'Source code copied!');
    });

    // Toggle Source Code Visibility
    el.btnToggleSource.addEventListener('click', () => {
      const isHidden = el.sourceCodeBody.style.display === 'none';
      el.sourceCodeBody.style.display = isHidden ? 'block' : 'none';
      el.toggleSourceText.textContent = isHidden ? 'Hide Source' : 'Show Source';
    });

    // Reset to Default
    el.btnResetDefault.addEventListener('click', () => {
      state.currentBenchmark = 'b1';
      state.currentTab = 'tokens';
      state.viewMode = 'structured';
      state.tokenFilterClass = 'ALL';
      state.tokenSearchQuery = '';
      state.formatsSubtab = 'quadruples';
      state.cfgZoom = 1.0;

      el.pipelineTabs.querySelectorAll('.tab-btn').forEach(b => {
        const isActive = b.dataset.tab === 'tokens';
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      updateBenchmarkSelectorActive();
      updateBenchmarkView();
      showToast('Reset to default benchmark and initial stage.', 'info');
    });

    // CFG Modal Handlers
    el.btnModalClose.addEventListener('click', closeCfgModal);
    el.cfgModal.addEventListener('click', (e) => {
      if (e.target === el.cfgModal) closeCfgModal();
    });

    el.btnModalZoomIn.addEventListener('click', () => {
      state.modalZoom = Math.min(state.modalZoom + 0.25, 4.0);
      el.cfgModalImageWrapper.style.transform = `scale(${state.modalZoom})`;
    });

    el.btnModalZoomOut.addEventListener('click', () => {
      state.modalZoom = Math.max(state.modalZoom - 0.25, 0.4);
      el.cfgModalImageWrapper.style.transform = `scale(${state.modalZoom})`;
    });

    el.btnModalZoomReset.addEventListener('click', () => {
      state.modalZoom = 1.0;
      el.cfgModalImageWrapper.style.transform = 'scale(1.0)';
    });
  }

  // Application Entry Point
  document.addEventListener('DOMContentLoaded', () => {
    cacheDom();
    initEventListeners();
    loadData();
  });

})();
