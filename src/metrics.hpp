#pragma once

#include <iostream>
#include <set>
#include <string>
#include <utility>
#include <vector>

// Compiler concept: Comprehensive Compiler Metrics and Empirical Evaluation
// Collects structural code metrics, memory layout footprint across IR representations,
// deletion-cost model values, optimization statistics, and micro-benchmarking timings.

struct BenchmarkMetrics {
    std::string name;

    // 1. Structural IR metrics
    int tac_instrs = 0;
    int temps_created = 0;
    int labels = 0;
    int blocks = 0;
    int edges = 0;
    int back_edges = 0;

    // 2. Memory Model footprint
    int quad_entries = 0;
    int quad_bytes = 0;
    int triple_entries = 0;
    int triple_bytes = 0;
    int indirect_entries = 0;
    int indirect_bytes = 0;

    // 3. Deletion cost totals
    int del_shift_total_quad = 0;
    int del_shift_total_triple = 0;
    int del_shift_total_indirect = 0;
    int del_rewrite_total_quad = 0;
    int del_rewrite_total_triple = 0;
    int del_rewrite_total_indirect = 0;

    // 4. Conventional Optimizer statistics
    int opt_instrs_after = 0;
    int opt_temps_remaining = 0;
    int liveness_iterations = 0;

    // 5. SSA statistics
    int phis_unpruned = 0;
    int phis_pruned = 0;
    int phis_braun = 0;
    int ssa_instrs_before_opt = 0;
    int ssa_instrs_after_opt = 0;
    int ssa_opt_rounds = 0;

    // 6. Timing metrics (microseconds)
    double time_frontend_us_min = 0.0;
    double time_frontend_us_mean = 0.0;
    double time_cfg_us_min = 0.0;
    double time_cfg_us_mean = 0.0;
    double time_opt_us_min = 0.0;
    double time_opt_us_mean = 0.0;
    double time_ssa_us_min = 0.0;
    double time_ssa_us_mean = 0.0;
    double time_ssaopt_us_min = 0.0;
    double time_ssaopt_us_mean = 0.0;

    std::vector<std::pair<std::string, std::string>> to_rows(bool include_times = true) const;
};

// Computes all metrics for a given source file.
BenchmarkMetrics computeMetrics(const std::string& filepath,
                                int runs = 2000,
                                const std::set<std::string>& user_live_out = {},
                                bool has_user_live_out = false);

// Prints a 2-column table for a single file.
void printSingleMetricsTable(const BenchmarkMetrics& m, std::ostream& os);

// Runs metrics on every *.mini file in dirpath (sorted by name),
// prints a multi-column table to os, and writes out/metrics.csv.
void runMetricsAll(const std::string& dirpath,
                   int runs,
                   const std::set<std::string>& user_live_out,
                   bool has_user_live_out,
                   std::ostream& os);

// Runs all compiler stages (--all) for one file.
void runAllStages(const std::string& filepath,
                  const std::set<std::string>& user_live_out,
                  bool has_user_live_out,
                  std::ostream& os);
