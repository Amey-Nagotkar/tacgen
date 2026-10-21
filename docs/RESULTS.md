# Empirical Evaluation and Comparative Results

This report presents empirical findings from running `tacgen` across benchmarks `b1` through `b4`. Measurements include structural code metrics, memory layout across three IR representations, deletion-cost model totals, optimization reduction figures, SSA construction counts, and micro-benchmarking timings.

---

## Benchmark Metrics Table

Measurements collected with `tacgen --metrics-all bench --runs 2000`:

| Metric | b1 | b2 | b3 | b4 | Unit / Description |
|---|---|---|---|---|---|
| **tac_instrs** | 10 | 12 | 6 | 35 | Unoptimized TAC quadruples |
| **temps_created** | 3 | 6 | 5 | 16 | Virtual temporaries allocated |
| **labels** | 2 | 0 | 0 | 7 | Jump labels emitted |
| **blocks** | 4 | 1 | 1 | 12 | Basic blocks in CFG |
| **edges** | 4 | 0 | 0 | 16 | Control flow edges |
| **back_edges** | 1 | 0 | 0 | 2 | Loop retreating DFS back edges |
| **quad_entries** | 10 | 12 | 6 | 35 | Rows in quadruple table |
| **quad_bytes** | 130 | 156 | 78 | 455 | Bytes (13 bytes / entry) |
| **triple_entries** | 11 | 12 | 6 | 40 | Rows in triple table |
| **triple_bytes** | 99 | 108 | 54 | 360 | Bytes (9 bytes / entry) |
| **indirect_entries** | 11 | 12 | 6 | 40 | Rows in indirect triple table |
| **indirect_bytes** | 143 | 156 | 78 | 520 | Bytes (13 bytes / entry) |
| **del_shift_total_quad** | 0 | 0 | 0 | 0 | Entry shift cost on deletion |
| **del_shift_total_triple** | 55 | 66 | 15 | 780 | Sum of index shifts $\sum (N - 1 - k)$ |
| **del_shift_total_indirect**| 0 | 0 | 0 | 0 | Entry shift cost on deletion |
| **del_rewrite_total_quad** | 0 | 0 | 0 | 0 | Operand rewrites on deletion |
| **del_rewrite_total_triple**| 18 | 30 | 10 | 434 | Sum of referenced operands $> k$ |
| **del_rewrite_total_indirect**| 0 | 0 | 0 | 0 | Operand rewrites on deletion |
| **opt_instrs_after** | 8 | 4 | 3 | 31 | Instructions after conventional opt |
| **opt_temps_remaining** | 1 | 0 | 2 | 12 | Remaining temporaries after opt |
| **liveness_iterations** | 3 | 2 | 2 | 4 | Iterations to stable global liveness |
| **phis_unpruned** | 2 | 0 | 0 | 11 | Phis placed by iterated DF |
| **phis_pruned** | 2 | 0 | 0 | 8 | Phis placed by pruned Cytron SSA |
| **phis_braun** | 2 | 0 | 0 | 8 | Phis placed by Braun et al. (CC 2013) |
| **ssa_instrs_before_opt** | 12 | 12 | 6 | 43 | Total SSA instrs (including phis) |
| **ssa_instrs_after_opt** | 8 | 3 | 5 | 33 | Total SSA instrs after sparse opt |
| **ssa_opt_rounds** | 1 | 3 | 1 | 1 | Rounds until fixed point |
| **time_frontend_us_min** | 47.49 | 56.06 | 20.89 | 173.66 | $\mu$s (indicative only) |
| **time_frontend_us_mean** | 55.36 | 63.21 | 24.06 | 195.30 | $\mu$s (indicative only) |
| **time_cfg_us_min** | 28.21 | 16.66 | 10.38 | 90.24 | $\mu$s (indicative only) |
| **time_cfg_us_mean** | 32.14 | 18.81 | 11.73 | 101.17 | $\mu$s (indicative only) |
| **time_opt_us_min** | 92.34 | 88.85 | 47.81 | 724.70 | $\mu$s (indicative only) |
| **time_opt_us_mean** | 108.57 | 101.98 | 56.20 | 808.80 | $\mu$s (indicative only) |
| **time_ssa_us_min** | 98.59 | 93.70 | 36.98 | 501.23 | $\mu$s (indicative only) |
| **time_ssa_us_mean** | 109.50 | 107.13 | 41.44 | 568.93 | $\mu$s (indicative only) |
| **time_ssaopt_us_min** | 45.76 | 58.02 | 16.22 | 218.96 | $\mu$s (indicative only) |
| **time_ssaopt_us_mean** | 51.44 | 64.97 | 18.23 | 249.69 | $\mu$s (indicative only) |

---

## Key Observations

1. **Memory Footprint Trade-off**: Triples achieve noticeable memory compactness over quadruples in straight-line computation (`b2`: `108` bytes for triples vs. `156` bytes for quadruples, a 30.8% reduction; `b3`: `54` bytes vs. `78` bytes), but this advantage narrows in control-flow-heavy code where conditional branches require splitting into condition evaluation and jump triples (`b1`: `99` bytes for 11 triples vs. `130` bytes for 10 quadruples).
2. **Quadratic Scaling of Triples Deletion Overhead**: Quadruples and indirect triples maintain `0` structural deletion costs (`del_shift_total_quad = 0`, `del_shift_total_indirect = 0`), whereas direct triples suffer quadratic growth under deletion: scaling from `b3` (6 entries) to `b4` (40 entries, a 6.67× increase) causes `del_shift_total_triple` to jump from `15` to `780` (a 52.0× increase) and `del_rewrite_total_triple` to surge from `10` to `434` (a 43.4× increase).
3. **Dead Phi Suppression by Pruned SSA**: In `b4`, liveness analysis eliminates `3` dead phis at merge blocks, placing `8` phis in pruned SSA compared to `11` phis in unpruned SSA (a 27.3% reduction in phi insertion overhead).
4. **Exact Equivalence of Braun On-the-Fly and Cytron Pruned SSA**: Braun et al.'s algorithm without dominators matches Cytron pruned SSA across every benchmark (`phis_pruned = 2` and `phis_braun = 2` in `b1`; `0` and `0` in `b2` and `b3`; `8` and `8` in `b4`), validating on-the-fly trivial phi elimination against iterated dominance frontiers.
5. **Instruction and Temporary Reduction in Conventional Optimization**: On straight-line arithmetic code (`b2`), the 6-pass conventional optimizer reduces instruction count from `12` to `4` (a 66.7% reduction) and eliminates all temporaries (`opt_temps_remaining = 0`), as constant folding and copy propagation expose dead assignments.
6. **Sparse Def-Use Propagation Speed and Reach**: Sparse SSA optimization achieves rapid instruction elimination (`b4`: `43` to `33` instructions in `1` round; `b2`: `12` to `3` instructions in `3` rounds) by traversing explicit def-use chains, completely bypassing iterative dataflow equations.

---

## Limitations

1. **No Out-of-SSA Translation**: The pipeline terminates in SSA form; `ssa_instrs_before_opt` and `ssa_instrs_after_opt` include phi functions as instructions, and no register allocation or phi-deconstruction (moving phis to parallel copies) is implemented.
2. **No Common Subexpression Elimination in the SSA Pipeline**: The SSA optimizer implements sparse constant and copy propagation and dead code elimination, but does not perform Global Value Numbering (GVN); CSE is present only in the conventional basic block optimizer.
3. **No Loop-Invariant Code Motion or Loop Strength Reduction**: Strength reduction is restricted to local arithmetic substitutions (e.g., `* 2^k -> << k`); induction variable optimizations and hoisting across loop headers are not implemented.
4. **Timings are Indicative Only**: Micro-benchmark timings were recorded on small synthetic programs executing on educational-scale ASTs; numbers are subject to cache and scheduling noise and serve solely for relative phase-order comparisons.
5. **Benchmarks are Small Synthetic Programs**: Test inputs range from 6 to 35 instructions to allow hand verification of intermediate tables; they do not reflect large real-world compilation workloads.
6. **Local Value-Numbering Scope**: Conventional CSE maintains a single value-numbering scope per basic block that is reset at block boundaries; expressions are not eliminated across block boundaries.
