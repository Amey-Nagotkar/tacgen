#include "metrics.hpp"

#include "ast.hpp"
#include "braun.hpp"
#include "cfg.hpp"
#include "formats.hpp"
#include "lexer.hpp"
#include "liveness.hpp"
#include "opt.hpp"
#include "parser.hpp"
#include "ssa.hpp"
#include "ssaopt.hpp"
#include "tac.hpp"
#include "tacgen.hpp"

#include <algorithm>
#include <chrono>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <sstream>
#include <stdexcept>
#include <vector>

namespace fs = std::filesystem;

template <typename T>
inline void do_not_optimize(T&& val) {
    asm volatile("" : : "g"(val) : "memory");
}

static bool parse_ref_index(const std::string& s, int& out_k) {
    if (s.size() >= 3 && s.front() == '(' && s.back() == ')') {
        try {
            size_t idx = 0;
            std::string inner = s.substr(1, s.size() - 2);
            int val = std::stoi(inner, &idx);
            if (idx == inner.size()) {
                out_k = val;
                return true;
            }
        } catch (...) {
            return false;
        }
    }
    return false;
}

static std::string extract_base_benchmark_name(const std::string& filepath) {
    fs::path p(filepath);
    std::string stem = p.stem().string();
    return stem;
}

std::vector<std::pair<std::string, std::string>> BenchmarkMetrics::to_rows(bool include_times) const {
    std::vector<std::pair<std::string, std::string>> rows;

    rows.push_back({"tac_instrs", std::to_string(tac_instrs)});
    rows.push_back({"temps_created", std::to_string(temps_created)});
    rows.push_back({"labels", std::to_string(labels)});
    rows.push_back({"blocks", std::to_string(blocks)});
    rows.push_back({"edges", std::to_string(edges)});
    rows.push_back({"back_edges", std::to_string(back_edges)});

    rows.push_back({"quad_entries", std::to_string(quad_entries)});
    rows.push_back({"quad_bytes", std::to_string(quad_bytes)});
    rows.push_back({"triple_entries", std::to_string(triple_entries)});
    rows.push_back({"triple_bytes", std::to_string(triple_bytes)});
    rows.push_back({"indirect_entries", std::to_string(indirect_entries)});
    rows.push_back({"indirect_bytes", std::to_string(indirect_bytes)});

    rows.push_back({"del_shift_total_quad", std::to_string(del_shift_total_quad)});
    rows.push_back({"del_shift_total_triple", std::to_string(del_shift_total_triple)});
    rows.push_back({"del_shift_total_indirect", std::to_string(del_shift_total_indirect)});
    rows.push_back({"del_rewrite_total_quad", std::to_string(del_rewrite_total_quad)});
    rows.push_back({"del_rewrite_total_triple", std::to_string(del_rewrite_total_triple)});
    rows.push_back({"del_rewrite_total_indirect", std::to_string(del_rewrite_total_indirect)});

    rows.push_back({"opt_instrs_after", std::to_string(opt_instrs_after)});
    rows.push_back({"opt_temps_remaining", std::to_string(opt_temps_remaining)});
    rows.push_back({"liveness_iterations", std::to_string(liveness_iterations)});

    rows.push_back({"phis_unpruned", std::to_string(phis_unpruned)});
    rows.push_back({"phis_pruned", std::to_string(phis_pruned)});
    rows.push_back({"phis_braun", std::to_string(phis_braun)});
    rows.push_back({"ssa_instrs_before_opt", std::to_string(ssa_instrs_before_opt)});
    rows.push_back({"ssa_instrs_after_opt", std::to_string(ssa_instrs_after_opt)});
    rows.push_back({"ssa_opt_rounds", std::to_string(ssa_opt_rounds)});

    if (include_times) {
        auto fmt_time = [](double val) {
            std::ostringstream ss;
            ss << std::fixed << std::setprecision(2) << val;
            return ss.str();
        };
        rows.push_back({"time_frontend_us_min", fmt_time(time_frontend_us_min)});
        rows.push_back({"time_frontend_us_mean", fmt_time(time_frontend_us_mean)});
        rows.push_back({"time_cfg_us_min", fmt_time(time_cfg_us_min)});
        rows.push_back({"time_cfg_us_mean", fmt_time(time_cfg_us_mean)});
        rows.push_back({"time_opt_us_min", fmt_time(time_opt_us_min)});
        rows.push_back({"time_opt_us_mean", fmt_time(time_opt_us_mean)});
        rows.push_back({"time_ssa_us_min", fmt_time(time_ssa_us_min)});
        rows.push_back({"time_ssa_us_mean", fmt_time(time_ssa_us_mean)});
        rows.push_back({"time_ssaopt_us_min", fmt_time(time_ssaopt_us_min)});
        rows.push_back({"time_ssaopt_us_mean", fmt_time(time_ssaopt_us_mean)});
    }

    return rows;
}

BenchmarkMetrics computeMetrics(const std::string& filepath,
                                int runs,
                                const std::set<std::string>& user_live_out,
                                bool has_user_live_out) {
    BenchmarkMetrics m;
    m.name = extract_base_benchmark_name(filepath);

    std::ifstream file(filepath);
    if (!file.is_open()) {
        throw std::runtime_error("cannot open file '" + filepath + "'");
    }
    std::stringstream buffer;
    buffer << file.rdbuf();
    std::string source = buffer.str();

    // Default live-out for b2 if none given
    std::set<std::string> eff_live_out = user_live_out;
    bool eff_has_live_out = has_user_live_out;
    if (!eff_has_live_out && m.name == "b2") {
        eff_live_out = {"y", "z", "w", "u"};
        eff_has_live_out = true;
    }

    // 1. Initial Parse and TAC generation
    Lexer lexer(source);
    auto tokens = lexer.tokenize();
    Parser parser(std::move(tokens));
    auto ast = parser.parse_program();
    TACGenerator tacgen;
    tacgen.generate(*ast);

    m.tac_instrs = static_cast<int>(tacgen.quads().size());
    m.temps_created = tacgen.tempCount();
    m.labels = tacgen.labelCount();

    // 2. CFG construction
    Cfg cfg = buildCfg(tacgen.quads());
    m.blocks = static_cast<int>(cfg.blocks.size());
    m.edges = 0;
    m.back_edges = 0;
    for (const auto& b : cfg.blocks) {
        m.edges += static_cast<int>(b.succ.size());
        for (const auto& edge : b.succ) {
            if (edge.backEdge) {
                m.back_edges++;
            }
        }
    }

    // 3. Formats & Deletion Cost Model
    FormatsManager fm(tacgen.quads());
    m.quad_entries = static_cast<int>(fm.quadruples().size());
    m.quad_bytes = m.quad_entries * BYTES_PER_QUAD;
    m.triple_entries = static_cast<int>(fm.triples().size());
    m.triple_bytes = m.triple_entries * BYTES_PER_TRIPLE;
    m.indirect_entries = static_cast<int>(fm.indirect_triples().pointers.size());
    m.indirect_bytes = m.indirect_entries * BYTES_PER_INDIRECT;

    m.del_shift_total_quad = 0;
    m.del_rewrite_total_quad = 0;
    m.del_shift_total_indirect = 0;
    m.del_rewrite_total_indirect = 0;

    int N_triples = static_cast<int>(fm.triples().size());
    m.del_shift_total_triple = (N_triples * (N_triples - 1)) / 2;

    int rewrite_total = 0;
    for (int k = 0; k < N_triples; ++k) {
        for (const auto& row : fm.triples()) {
            int ref1 = -1, ref2 = -1;
            if (parse_ref_index(row.arg1, ref1) && ref1 > k) rewrite_total++;
            if (parse_ref_index(row.arg2, ref2) && ref2 > k) rewrite_total++;
        }
    }
    m.del_rewrite_total_triple = rewrite_total;

    // 4. Conventional Optimizer statistics
    OptResult opt_res = optimize(cfg, eff_live_out, eff_has_live_out);
    m.opt_instrs_after = opt_res.final_instrs;
    m.opt_temps_remaining = opt_res.remaining_temporaries;
    m.liveness_iterations = opt_res.liveness_iterations;

    // 5. SSA statistics
    SsaResult ssa_unpruned = convertToSsa(cfg, false /*unpruned*/, eff_live_out, eff_has_live_out);
    SsaResult ssa_pruned = convertToSsa(cfg, true /*pruned*/, eff_live_out, eff_has_live_out);
    m.phis_unpruned = ssa_unpruned.phis_unpruned;
    m.phis_pruned = ssa_pruned.phis_pruned;

    BraunResult braun_res = constructSsaBraun(cfg, eff_live_out, eff_has_live_out);
    m.phis_braun = braun_res.phis_braun;

    SsaOptResult ssa_opt_res = optimizeSsa(std::move(ssa_pruned.cfg), ssa_pruned.dom);
    m.ssa_instrs_before_opt = ssa_opt_res.initial_instrs;
    m.ssa_instrs_after_opt = ssa_opt_res.final_instrs;
    m.ssa_opt_rounds = ssa_opt_res.rounds;

    // 6. Timing benchmarks over `runs` iterations
    if (runs < 1) runs = 1;

    // Phase 1: frontend
    {
        double min_t = 1e18, sum_t = 0.0;
        for (int r = 0; r < runs; ++r) {
            auto t0 = std::chrono::steady_clock::now();
            Lexer l(source);
            auto toks = l.tokenize();
            Parser p(std::move(toks));
            auto a = p.parse_program();
            TACGenerator tg;
            tg.generate(*a);
            auto t1 = std::chrono::steady_clock::now();
            do_not_optimize(tg.quads().size());
            double us = std::chrono::duration<double, std::micro>(t1 - t0).count();
            min_t = std::min(min_t, us);
            sum_t += us;
        }
        m.time_frontend_us_min = min_t;
        m.time_frontend_us_mean = sum_t / runs;
    }

    // Phase 2: cfg
    {
        const auto& q_list = tacgen.quads();
        double min_t = 1e18, sum_t = 0.0;
        for (int r = 0; r < runs; ++r) {
            auto t0 = std::chrono::steady_clock::now();
            Cfg c = buildCfg(q_list);
            auto t1 = std::chrono::steady_clock::now();
            do_not_optimize(c.blocks.size());
            double us = std::chrono::duration<double, std::micro>(t1 - t0).count();
            min_t = std::min(min_t, us);
            sum_t += us;
        }
        m.time_cfg_us_min = min_t;
        m.time_cfg_us_mean = sum_t / runs;
    }

    // Phase 3: opt
    {
        double min_t = 1e18, sum_t = 0.0;
        for (int r = 0; r < runs; ++r) {
            auto t0 = std::chrono::steady_clock::now();
            OptResult o = optimize(cfg, eff_live_out, eff_has_live_out);
            auto t1 = std::chrono::steady_clock::now();
            do_not_optimize(o.final_instrs);
            double us = std::chrono::duration<double, std::micro>(t1 - t0).count();
            min_t = std::min(min_t, us);
            sum_t += us;
        }
        m.time_opt_us_min = min_t;
        m.time_opt_us_mean = sum_t / runs;
    }

    // Phase 4: ssa
    {
        double min_t = 1e18, sum_t = 0.0;
        for (int r = 0; r < runs; ++r) {
            auto t0 = std::chrono::steady_clock::now();
            SsaResult s = convertToSsa(cfg, true /*pruned*/, eff_live_out, eff_has_live_out);
            auto t1 = std::chrono::steady_clock::now();
            do_not_optimize(s.phis_pruned);
            double us = std::chrono::duration<double, std::micro>(t1 - t0).count();
            min_t = std::min(min_t, us);
            sum_t += us;
        }
        m.time_ssa_us_min = min_t;
        m.time_ssa_us_mean = sum_t / runs;
    }

    // Phase 5: ssaopt
    {
        SsaResult fresh_ssa = convertToSsa(cfg, true /*pruned*/, eff_live_out, eff_has_live_out);
        double min_t = 1e18, sum_t = 0.0;
        for (int r = 0; r < runs; ++r) {
            auto t0 = std::chrono::steady_clock::now();
            SsaOptResult so = optimizeSsa(fresh_ssa.cfg, fresh_ssa.dom);
            auto t1 = std::chrono::steady_clock::now();
            do_not_optimize(so.final_instrs);
            double us = std::chrono::duration<double, std::micro>(t1 - t0).count();
            min_t = std::min(min_t, us);
            sum_t += us;
        }
        m.time_ssaopt_us_min = min_t;
        m.time_ssaopt_us_mean = sum_t / runs;
    }

    return m;
}

void printSingleMetricsTable(const BenchmarkMetrics& m, std::ostream& os) {
    auto rows = m.to_rows(true);

    os << std::left << std::setw(30) << "metric" << "| " << "value\n";
    os << std::string(30, '-') << "+--------------------------------------\n";

    for (const auto& r : rows) {
        os << std::left << std::setw(30) << r.first << "| " << r.second;
        if (r.first.rfind("time_", 0) == 0) {
            os << " (indicative only)";
        }
        os << "\n";
    }
}

void runMetricsAll(const std::string& dirpath,
                   int runs,
                   const std::set<std::string>& user_live_out,
                   bool has_user_live_out,
                   std::ostream& os) {
    std::vector<fs::path> files;
    if (fs::is_directory(dirpath)) {
        for (const auto& entry : fs::directory_iterator(dirpath)) {
            if (entry.is_regular_file() && entry.path().extension() == ".mini") {
                files.push_back(entry.path());
            }
        }
    } else {
        files.push_back(dirpath);
    }

    std::sort(files.begin(), files.end());

    std::vector<BenchmarkMetrics> all_metrics;
    all_metrics.reserve(files.size());

    for (const auto& f : files) {
        all_metrics.push_back(computeMetrics(f.string(), runs, user_live_out, has_user_live_out));
    }

    if (all_metrics.empty()) {
        os << "No .mini benchmark files found in " << dirpath << "\n";
        return;
    }

    // 1. Print formatted multi-column table to stream
    auto sample_rows = all_metrics[0].to_rows(true);

    os << std::left << std::setw(30) << "metric";
    for (const auto& bm : all_metrics) {
        os << " | " << std::left << std::setw(12) << bm.name;
    }
    os << "\n";

    os << std::string(30, '-');
    for (size_t i = 0; i < all_metrics.size(); ++i) {
        os << "-+-" << std::string(12, '-');
    }
    os << "\n";

    for (size_t row_idx = 0; row_idx < sample_rows.size(); ++row_idx) {
        const std::string& metric_name = sample_rows[row_idx].first;
        bool is_time = (metric_name.rfind("time_", 0) == 0);

        os << std::left << std::setw(30) << metric_name;
        for (const auto& bm : all_metrics) {
            auto bm_rows = bm.to_rows(true);
            os << " | " << std::left << std::setw(12) << bm_rows[row_idx].second;
        }
        if (is_time) {
            os << " (indicative only)";
        }
        os << "\n";
    }

    // 2. Write out/metrics.csv (overwrite, long format: benchmark,metric,value)
    fs::create_directories("out");
    std::ofstream csv("out/metrics.csv");
    if (!csv.is_open()) {
        std::cerr << "Warning: could not open out/metrics.csv for writing.\n";
        return;
    }

    csv << "benchmark,metric,value\n";
    for (const auto& bm : all_metrics) {
        auto rows = bm.to_rows(true);
        for (const auto& r : rows) {
            csv << bm.name << "," << r.first << "," << r.second << "\n";
        }
    }
}

void runAllStages(const std::string& filepath,
                  const std::set<std::string>& user_live_out,
                  bool has_user_live_out,
                  std::ostream& os) {
    std::ifstream file(filepath);
    if (!file.is_open()) {
        throw std::runtime_error("cannot open file '" + filepath + "'");
    }
    std::stringstream buffer;
    buffer << file.rdbuf();
    std::string source = buffer.str();

    std::string bname = extract_base_benchmark_name(filepath);
    std::set<std::string> eff_live_out = user_live_out;
    bool eff_has_live_out = has_user_live_out;
    if (!eff_has_live_out && bname == "b2") {
        eff_live_out = {"y", "z", "w", "u"};
        eff_has_live_out = true;
    }

    // Stage 1: TAC
    Lexer lexer(source);
    auto tokens = lexer.tokenize();
    Parser parser(std::move(tokens));
    auto ast = parser.parse_program();
    TACGenerator tacgen;
    tacgen.generate(*ast);
    os << "=== TAC ===\n";
    tacgen.print(os);
    os << "\n";

    // Stage 2: Formats
    os << "=== FORMATS ===\n";
    FormatsManager fm(tacgen.quads());
    fm.print_formats(os);
    os << "\n";

    // Stage 3: Blocks
    os << "=== BLOCKS & CFG ===\n";
    Cfg cfg = buildCfg(tacgen.quads());
    cfg.print_blocks(os);
    os << "\n";

    // Stage 4: Conventional Optimizer
    os << "=== OPTIMIZATION ===\n";
    OptResult opt_res = optimize(cfg, eff_live_out, eff_has_live_out);
    opt_res.print(os);
    os << "\n";

    // Stage 5: SSA
    os << "=== SSA ===\n";
    SsaResult ssa_res = convertToSsa(cfg, true /*pruned*/, eff_live_out, eff_has_live_out);
    ssa_res.print(os);
    os << "\n";

    // Stage 6: SSA Optimizer
    os << "=== SSA OPTIMIZER ===\n";
    SsaOptResult ssa_opt_res = optimizeSsa(std::move(ssa_res.cfg), ssa_res.dom);
    ssa_opt_res.print(os);
}
