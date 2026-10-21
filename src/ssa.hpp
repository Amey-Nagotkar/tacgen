#pragma once

#include "cfg.hpp"
#include "liveness.hpp"

#include <iostream>
#include <map>
#include <set>
#include <string>
#include <vector>

// Compiler concept: Static Single Assignment (SSA) Form
// Every variable has exactly one definition; phi functions are placed at
// dominance frontiers to select values from different execution paths.

struct DomInfo {
    std::map<int, int> idom;                      // block id -> immediate dominator (-1 for root)
    std::map<int, std::set<int>> df;              // block id -> dominance frontier (sorted block ids)
    std::map<int, std::vector<int>> dom_children; // block id -> children in dominator tree (sorted)
    std::vector<int> rpo;                         // block ids in reverse postorder

    bool dominates(int a, int b) const;
};

struct SsaResult {
    Cfg cfg;
    DomInfo dom;
    std::map<int, std::vector<std::string>> phis_placed; // block id -> variables for which phi was placed
    int phis_unpruned = 0;
    int phis_pruned = 0;

    void print(std::ostream& os) const;
};

// Computes immediate dominators and dominance frontiers (Cooper-Harvey-Kennedy)
DomInfo computeDominance(const Cfg& cfg);

// Converts CFG to SSA form (pruned or unpruned mode)
SsaResult convertToSsa(Cfg cfg, bool pruned,
                       const std::set<std::string>& user_live_out = {},
                       bool has_user_live_out = false);

// Verifies SSA invariants; on failure prints offending name and exits non-zero
void verifySsa(const Cfg& cfg, const DomInfo& dom);
