#pragma once

#include "cfg.hpp"
#include "ssa.hpp"

#include <iostream>

// Compiler concept: Sparse SSA Optimizations
// SSA form provides explicit def-use links, allowing constant and copy propagation
// to run directly without iterative dataflow analysis (dataflow iterations: 0).
// LIMITATION: Common Subexpression Elimination (CSE) is not implemented in this
// SSA pipeline; Global Value Numbering (GVN) would be required.

struct SsaOptResult {
    Cfg cfg;
    DomInfo dom;
    int initial_instrs = 0;
    int final_instrs = 0;
    int rounds = 0;
    int copies_propagated = 0;
    int phis_removed = 0;

    void print(std::ostream& os) const;
};

// Optimizes CFG in SSA form using def-use information only.
SsaOptResult optimizeSsa(Cfg cfg, const DomInfo& dom);
