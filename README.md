# tacgen: Three Address Code Generator 

`tacgen` is an intermediate representation (IR) generator and optimizer for a C-like mini-language, implemented in standard C++17 with no external dependencies. It implements lexical analysis, recursive-descent parsing, syntax-directed TAC generation, multiple IR storage representations (quadruples, triples, indirect triples), control flow graph construction, basic block optimization passes, Cytron dominance-frontier SSA construction, Braun on-the-fly SSA construction, sparse SSA optimizations, and empirical metrics evaluation.

[**Launch TAC Generator Visualizer →**](https://amey-nagotkar.github.io/tacgen/)

---

## Build and Run Instructions

### Prerequisites
- Modern C++17 compiler (GCC 9+, Clang 10+)
- CMake 3.16+
- (Optional) Graphviz `dot` for rendering `.dot` control flow graphs to `.png`

### Standard Build
```bash
cmake -B build
cmake --build build
```
The executable is produced at `build/tacgen`.

### AddressSanitizer and UndefinedBehaviorSanitizer Build
To compile with full ASan and UBSan sanitizers enabled:
```bash
cmake -B build-asan -DCMAKE_CXX_FLAGS="-fsanitize=address,undefined -g"
cmake --build build-asan
```

### Running Test Suites
Run the automated test runner to build and execute all 10 unit test suites, regression checks, and golden metrics diffs:
```bash
bash tests/run_all.sh
```
Or run against the ASan build:
```bash
bash tests/run_all.sh build-asan
```

---

## Project Layout

```text
tacgen/
├── CMakeLists.txt         # C++17 CMake configuration with -Wall -Wextra
├── SPEC.md                # System specification and architecture rules
├── README.md              # Project documentation, CLI manual, and report table mapping
├── docs/
│   ├── RESULTS.md         # Final metrics evaluation and compiler design observations
│   └── DEVIATIONS.md      # Specification decisions and deviations log
├── bench/                 # Benchmark programs
│   ├── b1.mini            # While loop with relational condition (Stage-2 worked example)
│   ├── b2.mini            # Single block with arithmetic expressions and dead variables
│   ├── b3.mini            # Expression with common subexpressions (a = b * -c + b * -c)
│   └── b4.mini            # Synthetic benchmark (nested loops, branches, array access)
├── src/                   # C++17 implementation
│   ├── lexer.hpp/.cpp     # Token classes, regex-based lexical analyzer
│   ├── ast.hpp            # Abstract Syntax Tree hierarchy
│   ├── parser.hpp/.cpp    # Recursive-descent parser with precedence climbing
│   ├── tac.hpp            # Quad IR data model, operands, and opcode enums
│   ├── tacgen.hpp/.cpp    # Syntax-directed TAC generator (newtemp, newlabel, short-circuit)
│   ├── formats.hpp/.cpp   # Quadruples, triples, indirect triples, and edit cost model
│   ├── cfg.hpp/.cpp       # Basic block partitioning, CFG edges, DFS back-edge detection
│   ├── liveness.hpp/.cpp  # Backward dataflow liveness analysis
│   ├── opt.hpp/.cpp       # 6-pass conventional optimizer (folding, CSE, DCE, coalescing)
│   ├── ssa.hpp/.cpp       # Dominators, dominance frontiers, Cytron SSA, SSA verifier
│   ├── ssaopt.hpp/.cpp    # Sparse def-use SSA optimizer (copy/constant propagation)
│   ├── braun.hpp/.cpp     # Braun et al. (CC 2013) on-the-fly SSA construction
│   ├── metrics.hpp/.cpp   # Comprehensive metrics collection, deletion-cost model, timings
│   └── main.cpp           # CLI flag parser and dispatch
├── tests/                 # Acceptance tests, expected outputs, and master runner
│   ├── run_all.sh         # Master test runner (builds, runs all tests, diffs golden)
│   ├── metrics.golden.csv # Hand-verified golden metrics for b1, b2, and b3
│   ├── *_test.sh          # Module-specific test suites
│   └── *.expected         # Expected output baselines
└── out/                   # Generated artifacts (metrics CSV, CFG dot/png diagrams)
```

---

## CLI Flags and Examples

### 1. Lexical and Syntactic Front-End
- `--tokens`: Prints the token stream table with line numbers and lexemes.
  ```bash
  ./build/tacgen bench/b1.mini --tokens
  ```
- `--ast`: Pretty-prints the Abstract Syntax Tree.
  ```bash
  ./build/tacgen bench/b1.mini --ast
  ```
- `--tac`: Emits unoptimized Three Address Code quadruples.
  ```bash
  ./build/tacgen bench/b1.mini --tac
  ```

### 2. IR Storage Formats & Cost Models
- `--formats`: Displays Quadruples, Triples, and Indirect Triples tables along with byte sizes.
  ```bash
  ./build/tacgen bench/b3.mini --formats
  ```
- `--edit-demo "R:K,R:K"`: Simulates eliminating instruction `R` and replacing references with `K`.
  ```bash
  ./build/tacgen bench/b3.mini --edit-demo "2:0,3:1"
  ```

### 3. Basic Blocks & Control Flow Graph
- `--blocks`: Prints basic block boundaries, leaders, successors, predecessors, and back edges.
  ```bash
  ./build/tacgen bench/b1.mini --blocks
  ```
- `--cfg <file.dot>`: Exports the CFG to Graphviz DOT format.
  ```bash
  ./build/tacgen bench/b1.mini --cfg out/b1.dot
  dot -Tpng out/b1.dot -o out/b1.png
  ```

### 4. Conventional Optimization & Liveness
- `--opt`: Executes the 6-pass basic block optimization pipeline.
  ```bash
  ./build/tacgen bench/b2.mini --opt --live-out y,z,w,u
  ```
- `--live-out a,b,c`: Specifies the set of variables live at block exit for dead-code elimination.
  ```bash
  ./build/tacgen bench/b2.mini --opt --live-out y,z,w,u
  ```

### 5. Static Single Assignment (SSA)
- `--ssa`: Constructs pruned SSA using Cytron's dominance frontier algorithm.
  ```bash
  ./build/tacgen bench/b1.mini --ssa
  ```
- `--ssa-unpruned`: Constructs maximal (unpruned) SSA without liveness filtering.
  ```bash
  ./build/tacgen tests/s_dead.mini --ssa-unpruned
  ```
- `--ssa-opt`: Optimizes SSA form using sparse def-use copy/constant propagation.
  ```bash
  ./build/tacgen bench/b1.mini --ssa-opt
  ```
- `--ssa-braun`: Constructs SSA directly without dominance frontiers (Braun et al., CC 2013).
  ```bash
  ./build/tacgen bench/b1.mini --ssa-braun
  ```
- `--ssa-compare`: Compares Cytron pruned SSA vs. Braun SSA and verifies both.
  ```bash
  ./build/tacgen bench/b1.mini --ssa-compare
  ```

### 6. Metrics & Complete Pipeline
- `--metrics`: Prints a 2-column metrics table for a single input file.
  ```bash
  ./build/tacgen bench/b1.mini --metrics
  ```
- `--metrics-all <dir>`: Runs metrics over all `*.mini` benchmarks in `<dir>`, outputs a multi-column comparison table, and writes `out/metrics.csv`.
  ```bash
  ./build/tacgen --metrics-all bench
  ```
- `--runs N`: Sets repetition count for micro-benchmarking timers (default 2000).
  ```bash
  ./build/tacgen bench/b1.mini --metrics --runs 500
  ```
- `--all`: Runs the entire compilation pipeline on a single file (TAC, Formats, CFG, Opt, SSA, SSA-Opt).
  ```bash
  ./build/tacgen bench/b1.mini --all
  ```

---




