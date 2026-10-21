# TAC Generator Visualizer (web-demo)

A presentation-ready static website and interactive educational visualizer for the **Compiler Design Project: Three-Address Code & SSA Optimization Pipeline (`tacgen`)**.

---

## 🎯 Purpose & Design Philosophy

- **Zero-Fabrication Data:** Every single token, AST node, quadruple, triple, basic block, dominator tree, SSA rename, and benchmark metric is generated directly by the native `build/tacgen` C++ executable executing on real benchmark files (`bench/b1.mini` through `bench/b4.mini`). No metrics, timings, or outputs are mock-ups or fabricated.
- **Pure Static Architecture:** Requires **no backend server, no database, no API keys, and no Emscripten/Wasm runtime**.
- **Dual Offline / Web Delivery:** Works seamlessly both when served via an HTTP server (e.g., GitHub Pages, `python3 -m http.server`) and when opened directly as a local file (`file:///.../web-demo/index.html`) using the bundled `benchmarks.js` data fallback.

---

## 🚀 Quick Start: Local Preview

### Option A: Local HTTP Server (Recommended)
From the repository root:
```bash
python3 -m http.server 8080 -d web-demo
```
Then navigate to: [http://localhost:8080](http://localhost:8080)

Or using Node.js / npx:
```bash
npx serve web-demo
```

### Option B: Direct File Opening (Offline)
Simply double-click or open `web-demo/index.html` in any modern web browser:
```bash
xdg-open web-demo/index.html   # Linux
open web-demo/index.html       # macOS
```
*(The visualizer automatically falls back to `data/benchmarks.js` when browser CORS restrictions prevent `fetch()` on `file:///` URLs.)*

---

## 🔄 Regenerating Benchmark Data

The data generator script builds the C++ project in release mode and executes each compiler flag against `bench/b1.mini`, `bench/b2.mini`, `bench/b3.mini`, and `bench/b4.mini`:

```bash
# From repository root
python3 scripts/generate_demo_data.py
```

### What this script does:
1. Invokes CMake and builds `build/tacgen`.
2. Runs the compiler across all CLI flags:
   - `--tokens` (Lexical analysis)
   - `--ast` (Syntax tree)
   - `--tac` (Three-Address Code instruction stream)
   - `--formats` (Quadruples, Triples, and Indirect Triples)
   - `--blocks` (Basic Block partitioning)
   - `--cfg <file.dot>` (Control Flow Graph generation + SVG/PNG compilation via Graphviz `dot`)
   - `--opt` (Conventional optimization, with `--live-out y,z,w,u` for `b2.mini`)
   - `--edit-demo "2:0,3:1"` (CSE editing demonstration for `b3.mini`)
   - `--ssa` and `--ssa-unpruned` (Cytron minimal vs pruned SSA)
   - `--ssa-opt` (SSA constant folding, copy propagation, strength reduction, dead code elimination)
   - `--ssa-braun` and `--ssa-compare` (Braun et al. single-pass SSA construction comparison)
   - `--metrics` (Instruction counts, temps, memory footprint, deletion shift/rewrite costs)
   - `--all` (Full end-to-end pipeline report)
3. Formats and exports:
   - `web-demo/data/benchmarks.json` (Structured JSON representation)
   - `web-demo/data/benchmarks.js` (JavaScript global for offline `file:///` support)
   - `web-demo/data/metrics.csv` (CSV metrics table matching `out/metrics.csv`)
   - `web-demo/assets/cfg/*.dot`, `*.svg`, and `*.png` (CFG graph assets)

---

## 📂 Directory Structure

```
web-demo/
├── index.html              # Single-page visualizer layout and modal viewer
├── index.css               # Modern dark-mode styling with glassmorphism & responsive grid
├── app.js                  # Frontend controller, parsers, and interactive stage renderers
├── README.md               # This documentation file
├── data/
│   ├── benchmarks.json     # Precomputed benchmark compiler outputs (JSON)
│   ├── benchmarks.js       # Global JS fallback wrapper for offline CORS bypass
│   └── metrics.csv         # Comparative metrics table
└── assets/
    └── cfg/                # Vector SVGs, PNGs, and DOT files for b1-b4 CFGs
        ├── b1.dot, b1.svg, b1.png
        ├── b2.dot, b2.svg, b2.png
        ├── b3.dot, b3.svg, b3.png
        └── b4.dot, b4.svg, b4.png
```

---

## 🔬 Supported Compiler Pipeline Stages

| Stage Tab | Compiler Flag | Features Visualized |
| :--- | :--- | :--- |
| **Tokens** | `--tokens` | Searchable/filterable token stream table (Index, Type, Value, Line) with summary counts |
| **AST** | `--ast` | Indented tree hierarchy viewer with expandable syntax nodes |
| **TAC** | `--tac` | Three-address code listing with opcode highlighting and line numbers |
| **IR Formats** | `--formats` | Side-by-side Quadruples, Triples, and Indirect Triples comparison with memory calculation |
| **Basic Blocks** | `--blocks` | Leader-based partitioned basic block cards with jump targets and labels |
| **CFG** | `--cfg` | Interactive vector SVG graph viewer with zoom/pan, PNG fallback, and fullscreen modal |
| **Optimization** | `--opt` | Side-by-side Before/After diff, delta stat badges, and dead code elimination |
| **SSA Form** | `--ssa` | Minimal vs Pruned SSA form, $\phi$-functions, dominator tree & frontiers |
| **SSA Opt** | `--ssa-opt` | SSA constant propagation, copy propagation, strength reduction, and dead-$\phi$ removal |
| **Braun SSA** | `--ssa-braun` | Single-pass SSA comparison table (Cytron vs Braun et al. 2013) with verification |
| **Metrics** | `--metrics` | Multi-benchmark comparative grid, storage footprint comparison, and CSV download |
| **Pipeline (All)** | `--all` | Complete end-to-end stage walkthrough |

---

## 🌐 Deploying to GitHub Pages

A GitHub Actions workflow is provided at `.github/workflows/deploy.yml`. When pushed to GitHub:
1. It installs CMake and Graphviz.
2. Builds the native `build/tacgen` compiler.
3. Executes `scripts/generate_demo_data.py` to regenerate up-to-date benchmark data.
4. Deploys the static `web-demo/` directory directly to GitHub Pages.
