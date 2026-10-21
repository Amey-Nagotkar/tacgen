#pragma once

#include "cfg.hpp"
#include "ssa.hpp"

#include <iostream>
#include <set>
#include <string>

// Compiler concept: Braun et al. (CC 2013) SSA Construction
// "Simple and Efficient Construction of Static Single Assignment Form"
// Direct SSA construction without computing dominators or dominance frontiers.
// Uses local value numbering, sealed blocks, recursive variable reading,
// and trivial phi elimination.

struct BraunResult {
    Cfg cfg;
    DomInfo dom; // Computed on resulting CFG for verification
    int phis_braun = 0;

    void print(std::ostream& os) const;
};

// Constructs SSA form using the Braun et al. algorithm
BraunResult constructSsaBraun(Cfg cfg,
                              const std::set<std::string>& user_live_out = {},
                              bool has_user_live_out = false);

// Compares Cytron pruned SSA with Braun SSA
void compareSsa(Cfg cfg,
                const std::set<std::string>& user_live_out = {},
                bool has_user_live_out = false,
                std::ostream& os = std::cout);
