# Implementation Decisions and Deviations Log

This document records architectural decisions, clarifications, and intentional deviations between `tacgen`, [SPEC.md](file:///home/amey/projects/tacgen/SPEC.md), and the Stage-2 Report.

---

### 1. Variable Subscript Naming Collision Avoidance (`t_k`)
- **Context**: In `bench/b4.mini`, a user variable is declared with the identifier `t` (`int t;`). Compiler-generated virtual temporaries also use the naming convention `t1`, `t2`, `t3`, etc.
- **Decision**: In both Cytron SSA renaming ([src/ssa.cpp](file:///home/amey/projects/tacgen/src/ssa.cpp)) and Braun SSA construction ([src/braun.cpp](file:///home/amey/projects/tacgen/src/braun.cpp)), variables named `t` or ending in a digit receive an underscore separator (`t_1`, `t_2`, etc.). All other identifiers receive standard subscripts (`s1`, `i1`, `max1`).
- **Rationale**: Directly naming versions of variable `t` as `t1` collides with the temporary namespace, violating Single Static Assignment invariants and causing multiple-definition verification failures. This decision directly aligns with the Prompt 7 specification rule (*"use an underscore separator v_1... but t_1 if t was a var"*).

---

### 2. Relational Conditional Branches in Triples
- **Context**: Three Address Code conditional jumps carry four components: operator (`if>`), first operand (`i`), second operand (`n`), and target label (`L2`). A triple has only three fields (`op`, `arg1`, `arg2`).
- **Decision**: When converting `IF_REL` quads to triples, `FormatsManager` emits two triple rows:
  1. A relational comparison triple: `(k): relop arg1 arg2` (e.g. `> i n`).
  2. A conditional jump triple referencing the comparison result: `(k+1): if (k) target_label`.
- **Impact**: `bench/b1.mini` expands from 10 quadruples to 11 triples and 11 indirect triple entries, matching the Stage-1 and Stage-2 report memory models.

---

### 3. Indirect Triples Pointer Offset
- **Context**: Stage-2 Report Table 6 displays pointer table entries starting at base index `35` (e.g. `35 -> (0)`, `36 -> (1)`).
- **Decision**: The textual table printer for indirect triples formats pointer numbers starting at base 35 to reproduce the exact display of the report. Internal data structures store 0-based indices and memory metrics compute exact entry counts (13 bytes per entry).

---

### 4. EXIT_USE Pseudo-Instruction Accounting
- **Context**: SSA construction requires explicit visibility of variables live at exit blocks that do not terminate with a `return` statement.
- **Decision**: `EXIT_USE` pseudo-instructions listing the live-out set are inserted at exit blocks. In compliance with SPEC.md, `EXIT_USE` instructions are treated as non-executable markers and are excluded from instruction count tallies (`tac_instrs`, `ssa_instrs_before_opt`, and `ssa_instrs_after_opt`).

---

### 5. Dead Code Elimination Scope (Local Value Numbering)
- **Context**: Stage-2 Section 2.2(d) describes Common Subexpression Elimination via local value numbering.
- **Decision**: Value numbering hash maps are scoped strictly to individual basic blocks and reset at block boundaries. Redundant subexpressions across distinct basic blocks are not eliminated in the conventional optimizer. Global redundancy elimination is left to the sparse SSA optimizer.

---

### 6. Unreachable Block Handling in CFG Construction
- **Context**: Dead code immediately following an unconditional `goto` or `return` without a target label produces detached instructions.
- **Decision**: `buildCfg` identifies blocks unreachable via forward DFS traversal from the entry block B1, emits a diagnostic warning to `stderr`, and purges them before dominator computation and SSA construction. This prevents uninitialized dominator nodes from corrupting dominance frontiers.
