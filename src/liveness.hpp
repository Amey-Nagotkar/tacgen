#pragma once

#include "cfg.hpp"

#include <map>
#include <set>
#include <string>
#include <vector>

// Compiler concept: Liveness Analysis
// Backward dataflow analysis determining which variables and temporaries
// may be read in the future without an intervening definition.

struct LivenessResult {
    std::map<int, std::set<std::string>> live_in;  // block id -> set of names
    std::map<int, std::set<std::string>> live_out; // block id -> set of names
    int iterations = 0;
};

// Computes global backward liveness on the CFG until stable.
// - Live-out of a block = union of live-in of its successors.
// - For a block with NO successors:
//     if ends with return -> empty set
//     else if user_live_out given -> that set
//     else all non-temp names defined in the program
LivenessResult computeLiveness(const Cfg& cfg,
                              const std::set<std::string>& user_live_out = {},
                              bool has_user_live_out = false);
