#include "opt.hpp"

#include <algorithm>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <map>
#include <set>
#include <stdexcept>
#include <tuple>
#include <vector>

static int total_instructions(const Cfg& cfg) {
    int count = 0;
    for (const auto& b : cfg.blocks) {
        count += static_cast<int>(b.instrs.size());
    }
    return count;
}

void OptResult::print(std::ostream& os) const {
    os << "No. | Pass                             | Changes | Instrs after\n";
    for (const auto& row : table) {
        os << std::left << std::setw(4) << row.num << "| "
           << std::setw(33) << row.name << "| "
           << std::setw(8) << row.changes << "| "
           << row.instrs_after << "\n";
    }
    os << "\noptimized code:\n";
    cfg.print_code(os);
    os << "instructions: " << initial_instrs << " -> " << final_instrs
       << "   temporaries remaining: " << remaining_temporaries
       << "   liveness iterations: " << liveness_iterations << "\n";
}

OptResult optimize(Cfg cfg,
                   const std::set<std::string>& user_live_out,
                   bool has_user_live_out) {
    OptResult res;

    // Row 0: Unoptimized
    PassRow row0{0, "Unoptimized", 0, total_instructions(cfg)};
    res.table.push_back(row0);
    res.initial_instrs = row0.instrs_after;

    // -------------------------------------------------------------------------
    // Pass 1: Constant folding and propagation
    // Forward; map name -> constant; replace constant uses (not array names,
    // not the result field); fold BINOP/UNARY_MINUS with all-literal operands
    // into x = literal. Arithmetic is 32-bit two's complement.
    // -------------------------------------------------------------------------
    int pass1_changes = 0;
    for (auto& b : cfg.blocks) {
        std::map<std::string, int32_t> const_map;
        for (size_t i = 0; i < b.instrs.size(); ++i) {
            auto& q = b.instrs[i];
            bool changed = false;

            // Replace constant uses (not array names, not the result field)
            if (q.op == OpType::ARRAY_LOAD) {
                if (const_map.count(q.arg2)) {
                    q.arg2 = std::to_string(const_map[q.arg2]);
                    changed = true;
                }
            } else if (q.op == OpType::ARRAY_STORE) {
                if (const_map.count(q.arg1)) {
                    q.arg1 = std::to_string(const_map[q.arg1]);
                    changed = true;
                }
                if (const_map.count(q.arg2)) {
                    q.arg2 = std::to_string(const_map[q.arg2]);
                    changed = true;
                }
            } else {
                for (auto* u : usesOf(q)) {
                    if (const_map.count(*u)) {
                        *u = std::to_string(const_map[*u]);
                        changed = true;
                    }
                }
            }

            // Fold BINOP / UNARY_MINUS with all-literal operands into x = literal
            if (q.op == OpType::UNARY_MINUS) {
                if (isLiteral(q.arg1)) {
                    int64_t val = -std::stoll(q.arg1);
                    int32_t truncated = static_cast<int32_t>(val);
                    q.op = OpType::ASSIGN;
                    q.arg1 = std::to_string(truncated);
                    q.arg2.clear();
                    q.rel.clear();
                    changed = true;
                }
            } else if (q.op == OpType::BINOP) {
                if (isLiteral(q.arg1) && isLiteral(q.arg2)) {
                    int64_t a = std::stoll(q.arg1);
                    int64_t b_val = std::stoll(q.arg2);
                    bool skip_fold = false;

                    if (q.rel == "/" || q.rel == "%") {
                        if (b_val == 0) {
                            int orig_num = q.orig_idx > 0 ? q.orig_idx : (b.firstOrig + static_cast<int>(i));
                            std::cerr << "warning: constant division by zero at instruction "
                                      << orig_num << ", fold skipped\n";
                            skip_fold = true;
                        } else if (a == INT32_MIN && b_val == -1) {
                            int orig_num = q.orig_idx > 0 ? q.orig_idx : (b.firstOrig + static_cast<int>(i));
                            std::cerr << "warning: constant division by zero at instruction "
                                      << orig_num << ", fold skipped\n";
                            skip_fold = true;
                        }
                    }

                    if (!skip_fold) {
                        int32_t res_val = 0;
                        if (q.rel == "+") res_val = static_cast<int32_t>(a + b_val);
                        else if (q.rel == "-") res_val = static_cast<int32_t>(a - b_val);
                        else if (q.rel == "*") res_val = static_cast<int32_t>(a * b_val);
                        else if (q.rel == "/") res_val = static_cast<int32_t>(a / b_val);
                        else if (q.rel == "%") res_val = static_cast<int32_t>(a % b_val);
                        else if (q.rel == "<<") res_val = static_cast<int32_t>(a << b_val);

                        q.op = OpType::ASSIGN;
                        q.arg1 = std::to_string(res_val);
                        q.arg2.clear();
                        q.rel.clear();
                        changed = true;
                    }
                }
            }

            if (changed) pass1_changes++;

            // Update const_map
            std::string d = defOf(q);
            if (!d.empty()) {
                if (q.op == OpType::ASSIGN && isLiteral(q.arg1)) {
                    const_map[d] = static_cast<int32_t>(std::stoll(q.arg1));
                } else {
                    const_map.erase(d);
                }
            }
        }
    }
    res.table.push_back({1, "Constant folding and propagation", pass1_changes, total_instructions(cfg)});

    // -------------------------------------------------------------------------
    // Pass 2: Strength reduction
    // x * 2^k or 2^k * x with k >= 1 and the other operand non-literal -> x << k.
    // Do NOT convert division.
    // -------------------------------------------------------------------------
    int pass2_changes = 0;
    for (auto& b : cfg.blocks) {
        for (auto& q : b.instrs) {
            if (q.op == OpType::BINOP && q.rel == "*") {
                bool arg1_lit = isLiteral(q.arg1);
                bool arg2_lit = isLiteral(q.arg2);
                if (arg2_lit && !arg1_lit) {
                    int64_t val = std::stoll(q.arg2);
                    if (val >= 2 && (val & (val - 1)) == 0) {
                        int k = __builtin_ctzll(val);
                        q.rel = "<<";
                        q.arg2 = std::to_string(k);
                        pass2_changes++;
                    }
                } else if (arg1_lit && !arg2_lit) {
                    int64_t val = std::stoll(q.arg1);
                    if (val >= 2 && (val & (val - 1)) == 0) {
                        int k = __builtin_ctzll(val);
                        q.rel = "<<";
                        q.arg1 = q.arg2;
                        q.arg2 = std::to_string(k);
                        pass2_changes++;
                    }
                }
            }
        }
    }
    res.table.push_back({2, "Strength reduction", pass2_changes, total_instructions(cfg)});

    // -------------------------------------------------------------------------
    // Pass 3: CSE by local value numbering
    // Every name and literal gets a value number; expression key = (op, vn1, vn2)
    // with + and * normalised for commutativity. A repeated expression becomes
    // a copy x = holder. A holder is usable only if it still carries that value number.
    // Redefinition changes the name's value number. Never value-number CALL or ARRAY_LOAD.
    // A copy t3 = t1 must give t3 the value number of t1.
    // -------------------------------------------------------------------------
    int pass3_changes = 0;
    for (auto& b : cfg.blocks) {
        int next_vn = 1;
        std::map<std::string, int> name_to_vn;
        std::map<std::tuple<std::string, int, int>, int> expr_to_vn;
        std::map<int, std::string> vn_to_holder;

        auto get_vn = [&](const std::string& name) -> int {
            auto it = name_to_vn.find(name);
            if (it != name_to_vn.end()) return it->second;
            int vn = next_vn++;
            name_to_vn[name] = vn;
            if (isLiteral(name)) {
                vn_to_holder[vn] = name;
            }
            return vn;
        };

        for (auto& q : b.instrs) {
            if (q.op == OpType::ASSIGN) {
                int vn_arg = get_vn(q.arg1);
                name_to_vn[q.result] = vn_arg;
                auto hit = vn_to_holder.find(vn_arg);
                if (hit == vn_to_holder.end() || name_to_vn[hit->second] != vn_arg) {
                    vn_to_holder[vn_arg] = q.result;
                }
            } else if (q.op == OpType::BINOP || q.op == OpType::UNARY_MINUS) {
                int vn1 = get_vn(q.arg1);
                int vn2 = (q.op == OpType::BINOP) ? get_vn(q.arg2) : -1;
                std::string op_str = (q.op == OpType::UNARY_MINUS) ? "minus" : q.rel;

                if (q.op == OpType::BINOP && (q.rel == "+" || q.rel == "*") && vn1 > vn2) {
                    std::swap(vn1, vn2);
                }
                auto key = std::make_tuple(op_str, vn1, vn2);

                auto eit = expr_to_vn.find(key);
                if (eit != expr_to_vn.end()) {
                    int existing_vn = eit->second;
                    auto hit = vn_to_holder.find(existing_vn);
                    if (hit != vn_to_holder.end() && name_to_vn[hit->second] == existing_vn) {
                        std::string holder = hit->second;
                        q.op = OpType::ASSIGN;
                        q.arg1 = holder;
                        q.arg2.clear();
                        q.rel.clear();
                        name_to_vn[q.result] = existing_vn;
                        pass3_changes++;
                        continue;
                    }
                }

                int new_vn = next_vn++;
                expr_to_vn[key] = new_vn;
                name_to_vn[q.result] = new_vn;
                vn_to_holder[new_vn] = q.result;
            } else {
                std::string d = defOf(q);
                if (!d.empty()) {
                    name_to_vn[d] = next_vn++;
                }
            }
        }
    }
    res.table.push_back({3, "CSE by local value numbering", pass3_changes, total_instructions(cfg)});

    // -------------------------------------------------------------------------
    // Pass 4: Copy propagation
    // Forward; for x = y with y a NAME (not a literal), replace later uses of x
    // by y until x or y is redefined.
    // -------------------------------------------------------------------------
    int pass4_changes = 0;
    for (auto& b : cfg.blocks) {
        std::map<std::string, std::string> copy_map;
        for (auto& q : b.instrs) {
            bool changed = false;

            if (q.op == OpType::ARRAY_LOAD) {
                auto it = copy_map.find(q.arg2);
                if (it != copy_map.end()) {
                    q.arg2 = it->second;
                    changed = true;
                }
            } else if (q.op == OpType::ARRAY_STORE) {
                auto it1 = copy_map.find(q.arg1);
                if (it1 != copy_map.end()) {
                    q.arg1 = it1->second;
                    changed = true;
                }
                auto it2 = copy_map.find(q.arg2);
                if (it2 != copy_map.end()) {
                    q.arg2 = it2->second;
                    changed = true;
                }
            } else {
                for (auto* u : usesOf(q)) {
                    auto it = copy_map.find(*u);
                    if (it != copy_map.end()) {
                        *u = it->second;
                        changed = true;
                    }
                }
            }

            if (changed) pass4_changes++;

            std::string d = defOf(q);
            if (!d.empty()) {
                copy_map.erase(d);
                for (auto it = copy_map.begin(); it != copy_map.end();) {
                    if (it->second == d) {
                        it = copy_map.erase(it);
                    } else {
                        ++it;
                    }
                }
            }

            if (q.op == OpType::ASSIGN && !isLiteral(q.arg1) && q.result != q.arg1) {
                copy_map[q.result] = q.arg1;
            }
        }
    }
    res.table.push_back({4, "Copy propagation", pass4_changes, total_instructions(cfg)});

    // -------------------------------------------------------------------------
    // Pass 5: Dead-code elimination
    // Backward from the block's live-out. Remove instructions with op in
    // {ASSIGN, BINOP, UNARY_MINUS, ARRAY_LOAD} whose defined name is not live.
    // Never remove CALL, PARAM, ARRAY_STORE, GOTO, IF_REL, RETURN, NOP.
    // Recompute global liveness right before this pass.
    // -------------------------------------------------------------------------
    LivenessResult live_res = computeLiveness(cfg, user_live_out, has_user_live_out);
    res.liveness_iterations = live_res.iterations;
    int pass5_changes = 0;

    for (auto& b : cfg.blocks) {
        std::set<std::string> live = live_res.live_out[b.id];
        for (int i = static_cast<int>(b.instrs.size()) - 1; i >= 0; --i) {
            const auto& q = b.instrs[i];
            std::string d = defOf(q);

            bool eligible = (q.op == OpType::ASSIGN ||
                             q.op == OpType::BINOP ||
                             q.op == OpType::UNARY_MINUS ||
                             q.op == OpType::ARRAY_LOAD);
            if (eligible && !d.empty() && live.find(d) == live.end()) {
                b.instrs.erase(b.instrs.begin() + i);
                pass5_changes++;
                continue;
            }

            if (!d.empty()) {
                live.erase(d);
            }
            for (const auto* u : usesOf(q)) {
                if (!u->empty() && !isLiteral(*u)) {
                    live.insert(*u);
                }
            }
        }
    }
    res.table.push_back({5, "Dead-code elimination", pass5_changes, total_instructions(cfg)});

    // -------------------------------------------------------------------------
    // Pass 6: Temporary coalescing
    // For a temp t defined exactly once by t = e (e any BINOP/UNARY/ASSIGN rhs)
    // where EVERY use of t in the whole CFG is a plain copy v = t:
    // let v1 be the first such copy's target, provided v1 is neither read nor
    // written between the definition of t and that copy.
    // Rewrite definition as v1 = e, delete that copy, and rewrite every other copy
    // v2 = t into v2 = v1 (only if v1 is not redefined between). Otherwise leave it.
    // -------------------------------------------------------------------------
    int pass6_changes = 0;
    bool any_coalesced = true;
    while (any_coalesced) {
        any_coalesced = false;

        std::set<std::string> all_temps;
        for (const auto& b : cfg.blocks) {
            for (const auto& q : b.instrs) {
                std::string d = defOf(q);
                if (isTemp(d)) all_temps.insert(d);
                for (const auto* u : usesOf(q)) {
                    if (isTemp(*u)) all_temps.insert(*u);
                }
            }
        }

        for (const auto& t : all_temps) {
            int def_count = 0;
            size_t def_block_idx = 0;
            size_t def_instr_idx = 0;

            for (size_t bi = 0; bi < cfg.blocks.size(); ++bi) {
                for (size_t ii = 0; ii < cfg.blocks[bi].instrs.size(); ++ii) {
                    const auto& q = cfg.blocks[bi].instrs[ii];
                    if (defOf(q) == t) {
                        def_count++;
                        def_block_idx = bi;
                        def_instr_idx = ii;
                    }
                }
            }

            if (def_count != 1) continue;

            const auto& def_quad = cfg.blocks[def_block_idx].instrs[def_instr_idx];
            if (def_quad.op != OpType::BINOP &&
                def_quad.op != OpType::UNARY_MINUS &&
                def_quad.op != OpType::ASSIGN) {
                continue;
            }

            struct CopyUse {
                size_t block_idx;
                size_t instr_idx;
                std::string target;
            };
            std::vector<CopyUse> copies;
            bool all_plain_copies = true;

            for (size_t bi = 0; bi < cfg.blocks.size(); ++bi) {
                for (size_t ii = 0; ii < cfg.blocks[bi].instrs.size(); ++ii) {
                    const auto& q = cfg.blocks[bi].instrs[ii];
                    bool uses_t = false;
                    for (const auto* u : usesOf(q)) {
                        if (*u == t) {
                            uses_t = true;
                            break;
                        }
                    }
                    if (uses_t) {
                        if (q.op == OpType::ASSIGN && q.arg1 == t && q.arg2.empty()) {
                            copies.push_back({bi, ii, q.result});
                        } else {
                            all_plain_copies = false;
                            break;
                        }
                    }
                }
                if (!all_plain_copies) break;
            }

            if (!all_plain_copies || copies.empty()) continue;

            const auto& first_copy = copies[0];
            if (first_copy.block_idx != def_block_idx || first_copy.instr_idx <= def_instr_idx) {
                continue;
            }

            std::string v1 = first_copy.target;
            bool v1_interferes = false;
            const auto& block_instrs = cfg.blocks[def_block_idx].instrs;

            for (size_t k = def_instr_idx + 1; k < first_copy.instr_idx; ++k) {
                const auto& mid = block_instrs[k];
                for (const auto* u : usesOf(mid)) {
                    if (*u == v1) {
                        v1_interferes = true;
                        break;
                    }
                }
                if (v1_interferes) break;
                if (defOf(mid) == v1) {
                    v1_interferes = true;
                    break;
                }
                if (mid.op == OpType::ARRAY_STORE && mid.result == v1) {
                    v1_interferes = true;
                    break;
                }
            }

            if (v1_interferes) continue;

            // Apply coalescence
            cfg.blocks[def_block_idx].instrs[def_instr_idx].result = v1;
            pass6_changes++;

            for (size_t c = 1; c < copies.size(); ++c) {
                const auto& copy = copies[c];
                if (copy.block_idx == def_block_idx && copy.instr_idx > first_copy.instr_idx) {
                    bool redefined = false;
                    for (size_t k = first_copy.instr_idx + 1; k < copy.instr_idx; ++k) {
                        if (defOf(block_instrs[k]) == v1) {
                            redefined = true;
                            break;
                        }
                    }
                    if (!redefined) {
                        cfg.blocks[copy.block_idx].instrs[copy.instr_idx].arg1 = v1;
                        pass6_changes++;
                    }
                }
            }

            cfg.blocks[first_copy.block_idx].instrs.erase(
                cfg.blocks[first_copy.block_idx].instrs.begin() + first_copy.instr_idx);
            pass6_changes++;

            any_coalesced = true;
            break;
        }
    }
    res.table.push_back({6, "Temporary coalescing", pass6_changes, total_instructions(cfg)});

    // Final statistics
    res.cfg = std::move(cfg);
    res.final_instrs = total_instructions(res.cfg);

    std::set<std::string> rem_temps;
    for (const auto& b : res.cfg.blocks) {
        for (const auto& q : b.instrs) {
            std::string d = defOf(q);
            if (isTemp(d)) rem_temps.insert(d);
            for (const auto* u : usesOf(q)) {
                if (isTemp(*u)) rem_temps.insert(*u);
            }
        }
    }
    res.remaining_temporaries = static_cast<int>(rem_temps.size());

    return res;
}
