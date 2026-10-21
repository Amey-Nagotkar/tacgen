#pragma once

#include "cfg.hpp"
#include "liveness.hpp"

#include <iostream>
#include <set>
#include <string>
#include <vector>

// Compiler concept: Control Flow Graph Optimization Passes
// 1. Constant folding and propagation
// 2. Strength reduction (* 2^k -> << k)
// 3. CSE by local value numbering
// 4. Copy propagation
// 5. Dead-code elimination
// 6. Temporary coalescing

struct PassRow {
    int num;
    std::string name;
    int changes;
    int instrs_after;
};

struct OptResult {
    Cfg cfg;
    std::vector<PassRow> table;
    int initial_instrs = 0;
    int final_instrs = 0;
    int remaining_temporaries = 0;
    int liveness_iterations = 0;

    void print(std::ostream& os) const;
};

OptResult optimize(Cfg cfg,
                   const std::set<std::string>& user_live_out = {},
                   bool has_user_live_out = false);
