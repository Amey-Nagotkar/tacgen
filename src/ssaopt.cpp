#include "ssaopt.hpp"

#include <algorithm>
#include <cstdint>
#include <iostream>
#include <map>
#include <set>
#include <stdexcept>
#include <string>
#include <vector>

static int count_ssa_instrs(const Cfg& cfg) {
    int total = 0;
    for (const auto& b : cfg.blocks) {
        for (const auto& q : b.instrs) {
            if (q.op != OpType::EXIT_USE) {
                total++;
            }
        }
    }
    return total;
}

void SsaOptResult::print(std::ostream& os) const {
    cfg.print_code(os);
    os << "ssa instrs: " << initial_instrs << " -> " << final_instrs
       << "   rounds: " << rounds
       << "   copies propagated: " << copies_propagated
       << "   phis removed: " << phis_removed
       << "   dataflow iterations: 0\n";
    verifySsa(cfg, dom);
    os << "verify: OK\n";
}

SsaOptResult optimizeSsa(Cfg cfg, const DomInfo& dom) {
    (void)dom;
    SsaOptResult res;
    res.initial_instrs = count_ssa_instrs(cfg);

    int rounds = 0;

    // Loop until nothing changes (max 20 rounds)
    while (rounds < 20) {
        bool round_changed = false;

        // ---------------------------------------------------------------------
        // Pass A: Copy propagation
        // for x = y with y a NAME, replace every use of x (including phi arguments
        // and exit_use operands) with y and delete the copy.
        // ---------------------------------------------------------------------
        bool copy_changed = true;
        while (copy_changed) {
            copy_changed = false;
            for (size_t bi = 0; bi < cfg.blocks.size(); ++bi) {
                auto& b = cfg.blocks[bi];
                for (size_t qi = 0; qi < b.instrs.size(); ++qi) {
                    auto& q = b.instrs[qi];
                    if (q.op == OpType::ASSIGN && !isLiteral(q.arg1) && !q.arg1.empty() && q.arg2.empty()) {
                        std::string x = q.result;
                        std::string y = q.arg1;

                        if (x == y) {
                            b.instrs.erase(b.instrs.begin() + qi);
                            copy_changed = true;
                            round_changed = true;
                            break;
                        }

                        // Replace all uses of x with y across the entire CFG
                        for (auto& blk : cfg.blocks) {
                            for (auto& instr : blk.instrs) {
                                if (instr.op == OpType::PHI || instr.op == OpType::EXIT_USE) {
                                    for (auto& a : instr.phiArgs) {
                                        if (a == x) {
                                            a = y;
                                        }
                                    }
                                } else {
                                    for (auto* u : usesOf(instr)) {
                                        if (*u == x) {
                                            *u = y;
                                        }
                                    }
                                }
                            }
                        }

                        b.instrs.erase(b.instrs.begin() + qi);
                        res.copies_propagated++;
                        copy_changed = true;
                        round_changed = true;
                        break; // restart scan
                    }
                }
                if (copy_changed) break;
            }
        }

        // ---------------------------------------------------------------------
        // Pass B: Constant propagation and folding
        // for x = literal, replace every use of x with the literal.
        // fold BINOP/UNARY with all-literal operands.
        // A phi whose arguments are all the same name or the same literal
        // (ignoring arguments equal to its own result) becomes a copy / constant assignment.
        // ---------------------------------------------------------------------
        for (auto& blk : cfg.blocks) {
            for (auto& instr : blk.instrs) {
                if (instr.op == OpType::ASSIGN && isLiteral(instr.arg1) && instr.arg2.empty()) {
                    std::string x = instr.result;
                    std::string lit = instr.arg1;
                    if (x.empty()) continue;

                    for (auto& target_b : cfg.blocks) {
                        for (auto& target_q : target_b.instrs) {
                            if (&target_q == &instr) continue;
                            if (target_q.op == OpType::PHI || target_q.op == OpType::EXIT_USE) {
                                for (auto& a : target_q.phiArgs) {
                                    if (a == x) {
                                        a = lit;
                                        round_changed = true;
                                    }
                                }
                            } else {
                                for (auto* u : usesOf(target_q)) {
                                    if (*u == x) {
                                        *u = lit;
                                        round_changed = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Fold BINOP / UNARY with all-literal operands
        for (auto& blk : cfg.blocks) {
            for (size_t qi = 0; qi < blk.instrs.size(); ++qi) {
                auto& q = blk.instrs[qi];
                if (q.op == OpType::UNARY_MINUS && isLiteral(q.arg1)) {
                    int64_t val = -std::stoll(q.arg1);
                    int32_t truncated = static_cast<int32_t>(val);
                    q.op = OpType::ASSIGN;
                    q.arg1 = std::to_string(truncated);
                    q.arg2.clear();
                    q.rel.clear();
                    round_changed = true;
                } else if (q.op == OpType::BINOP && isLiteral(q.arg1) && isLiteral(q.arg2)) {
                    int64_t a = std::stoll(q.arg1);
                    int64_t b_val = std::stoll(q.arg2);
                    bool skip_fold = false;

                    if (q.rel == "/" || q.rel == "%") {
                        if (b_val == 0) {
                            int orig_num = q.orig_idx > 0 ? q.orig_idx : (blk.firstOrig + static_cast<int>(qi));
                            std::cerr << "warning: constant division by zero at instruction "
                                      << orig_num << ", fold skipped\n";
                            skip_fold = true;
                        } else if (a == INT32_MIN && b_val == -1) {
                            int orig_num = q.orig_idx > 0 ? q.orig_idx : (blk.firstOrig + static_cast<int>(qi));
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
                        round_changed = true;
                    }
                }
            }
        }

        // Phi simplification
        for (auto& blk : cfg.blocks) {
            for (auto& q : blk.instrs) {
                if (q.op == OpType::PHI) {
                    std::set<std::string> distinct;
                    for (const auto& a : q.phiArgs) {
                        if (!a.empty() && a != q.result) {
                            distinct.insert(a);
                        }
                    }
                    if (distinct.size() == 1) {
                        std::string v = *distinct.begin();
                        q.op = OpType::ASSIGN;
                        q.arg1 = v;
                        q.arg2.clear();
                        q.rel.clear();
                        q.phiArgs.clear();
                        res.phis_removed++;
                        round_changed = true;
                    }
                }
            }
        }

        // ---------------------------------------------------------------------
        // Pass C: Strength reduction
        // x * 2^k or 2^k * x with k >= 1 and other operand non-literal -> x << k
        // ---------------------------------------------------------------------
        for (auto& blk : cfg.blocks) {
            for (auto& q : blk.instrs) {
                if (q.op == OpType::BINOP && q.rel == "*") {
                    bool arg1_lit = isLiteral(q.arg1);
                    bool arg2_lit = isLiteral(q.arg2);
                    if (arg2_lit && !arg1_lit) {
                        int64_t val = std::stoll(q.arg2);
                        if (val >= 2 && (val & (val - 1)) == 0) {
                            int k = __builtin_ctzll(val);
                            q.rel = "<<";
                            q.arg2 = std::to_string(k);
                            round_changed = true;
                        }
                    } else if (arg1_lit && !arg2_lit) {
                        int64_t val = std::stoll(q.arg1);
                        if (val >= 2 && (val & (val - 1)) == 0) {
                            int k = __builtin_ctzll(val);
                            q.rel = "<<";
                            q.arg1 = q.arg2;
                            q.arg2 = std::to_string(k);
                            round_changed = true;
                        }
                    }
                }
            }
        }

        if (!round_changed) break;
        rounds++;
    }
    res.rounds = rounds;

    // -------------------------------------------------------------------------
    // Dead-Code Elimination (DCE) Pass
    // Worklist of definitions (ASSIGN, BINOP, UNARY_MINUS, ARRAY_LOAD, PHI) with
    // zero uses; remove, decrement use counts of operands, repeat.
    // EXIT_USE, RETURN, IF_REL, PARAM, CALL, ARRAY_STORE are roots.
    // -------------------------------------------------------------------------
    std::map<std::string, int> use_counts;
    for (const auto& blk : cfg.blocks) {
        for (const auto& q : blk.instrs) {
            if (q.op == OpType::PHI || q.op == OpType::EXIT_USE) {
                for (const auto& a : q.phiArgs) {
                    if (!a.empty() && !isLiteral(a)) {
                        use_counts[a]++;
                    }
                }
            } else {
                for (const auto* u : usesOf(q)) {
                    if (!u->empty() && !isLiteral(*u)) {
                        use_counts[*u]++;
                    }
                }
            }
        }
    }

    auto is_eligible = [](OpType op) {
        return (op == OpType::ASSIGN ||
                op == OpType::BINOP ||
                op == OpType::UNARY_MINUS ||
                op == OpType::ARRAY_LOAD ||
                op == OpType::PHI);
    };

    std::map<std::string, std::pair<size_t, size_t>> def_map;
    for (size_t bi = 0; bi < cfg.blocks.size(); ++bi) {
        for (size_t qi = 0; qi < cfg.blocks[bi].instrs.size(); ++qi) {
            std::string d = defOf(cfg.blocks[bi].instrs[qi]);
            if (!d.empty()) {
                def_map[d] = {bi, qi};
            }
        }
    }

    std::set<std::string> to_remove;
    std::vector<std::string> worklist;

    for (const auto& pair : def_map) {
        const std::string& name = pair.first;
        const auto& q = cfg.blocks[pair.second.first].instrs[pair.second.second];
        if (is_eligible(q.op) && use_counts[name] == 0) {
            to_remove.insert(name);
            worklist.push_back(name);
        }
    }

    while (!worklist.empty()) {
        std::string name = worklist.back();
        worklist.pop_back();

        const auto& loc = def_map[name];
        const auto& q = cfg.blocks[loc.first].instrs[loc.second];

        auto handle_operand = [&](const std::string& opnd) {
            if (!opnd.empty() && !isLiteral(opnd)) {
                use_counts[opnd]--;
                if (use_counts[opnd] == 0 && to_remove.find(opnd) == to_remove.end()) {
                    auto it = def_map.find(opnd);
                    if (it != def_map.end()) {
                        const auto& def_q = cfg.blocks[it->second.first].instrs[it->second.second];
                        if (is_eligible(def_q.op)) {
                            to_remove.insert(opnd);
                            worklist.push_back(opnd);
                        }
                    }
                }
            }
        };

        if (q.op == OpType::PHI) {
            for (const auto& a : q.phiArgs) {
                handle_operand(a);
            }
        } else {
            for (const auto* u : usesOf(q)) {
                handle_operand(*u);
            }
        }
    }

    for (auto& blk : cfg.blocks) {
        for (auto it = blk.instrs.begin(); it != blk.instrs.end();) {
            std::string d = defOf(*it);
            if (!d.empty() && to_remove.find(d) != to_remove.end()) {
                it = blk.instrs.erase(it);
            } else {
                ++it;
            }
        }
    }

    res.cfg = std::move(cfg);
    res.dom = computeDominance(res.cfg);
    res.final_instrs = count_ssa_instrs(res.cfg);

    return res;
}
