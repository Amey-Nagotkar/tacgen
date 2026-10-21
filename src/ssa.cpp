#include "ssa.hpp"

#include <algorithm>
#include <cstdlib>
#include <functional>
#include <iomanip>
#include <iostream>
#include <map>
#include <set>
#include <stdexcept>
#include <string>
#include <vector>

bool DomInfo::dominates(int a, int b) const {
    if (a == b) return true;
    int cur = b;
    while (cur != -1) {
        auto it = idom.find(cur);
        if (it == idom.end() || it->second == -1) break;
        cur = it->second;
        if (cur == a) return true;
    }
    return false;
}

DomInfo computeDominance(const Cfg& cfg) {
    DomInfo dom;
    if (cfg.blocks.empty()) return dom;

    std::map<int, const Block*> id_to_block;
    for (const auto& b : cfg.blocks) {
        id_to_block[b.id] = &b;
        dom.dom_children[b.id] = {};
        dom.df[b.id] = {};
    }

    int entry_id = cfg.blocks[0].id;

    // 1. Reverse Postorder (RPO) via DFS from entry block
    std::vector<int> postorder;
    std::set<int> visited;
    std::function<void(int)> dfs = [&](int u) {
        visited.insert(u);
        auto it = id_to_block.find(u);
        if (it != id_to_block.end()) {
            for (const auto& edge : it->second->succ) {
                if (visited.find(edge.to) == visited.end()) {
                    dfs(edge.to);
                }
            }
        }
        postorder.push_back(u);
    };
    dfs(entry_id);
    std::reverse(postorder.begin(), postorder.end());
    dom.rpo = std::move(postorder);

    std::map<int, int> rpo_index;
    for (size_t i = 0; i < dom.rpo.size(); ++i) {
        rpo_index[dom.rpo[i]] = static_cast<int>(i);
    }

    // 2. Immediate Dominators via Cooper-Harvey-Kennedy
    auto intersect = [&](int b1, int b2) -> int {
        int finger1 = b1;
        int finger2 = b2;
        while (finger1 != finger2) {
            while (rpo_index.at(finger1) > rpo_index.at(finger2)) {
                finger1 = dom.idom.at(finger1);
            }
            while (rpo_index.at(finger2) > rpo_index.at(finger1)) {
                finger2 = dom.idom.at(finger2);
            }
        }
        return finger1;
    };

    dom.idom[entry_id] = entry_id;
    for (const auto& b : cfg.blocks) {
        if (b.id != entry_id) {
            dom.idom[b.id] = -1;
        }
    }

    bool changed = true;
    while (changed) {
        changed = false;
        for (size_t i = 1; i < dom.rpo.size(); ++i) {
            int b = dom.rpo[i];
            const auto* blk = id_to_block.at(b);
            int new_idom = -1;

            for (int p : blk->pred) {
                if (dom.idom.find(p) != dom.idom.end() && dom.idom.at(p) != -1) {
                    if (new_idom == -1) {
                        new_idom = p;
                    } else {
                        new_idom = intersect(p, new_idom);
                    }
                }
            }

            if (new_idom != -1 && dom.idom[b] != new_idom) {
                dom.idom[b] = new_idom;
                changed = true;
            }
        }
    }
    dom.idom[entry_id] = -1; // root has no idom

    // 3. Build Dominator Tree (children sorted by block ID)
    for (const auto& b : cfg.blocks) {
        int p = dom.idom[b.id];
        if (p != -1) {
            dom.dom_children[p].push_back(b.id);
        }
    }
    for (auto& pair : dom.dom_children) {
        std::sort(pair.second.begin(), pair.second.end());
    }

    // 4. Dominance Frontiers (Cooper-Harvey-Kennedy)
    for (const auto& b : cfg.blocks) {
        if (b.pred.size() >= 2) {
            int b_idom = dom.idom.at(b.id);
            for (int p : b.pred) {
                int runner = p;
                while (runner != b_idom && runner != -1) {
                    dom.df[runner].insert(b.id);
                    auto it = dom.idom.find(runner);
                    if (it != dom.idom.end()) {
                        runner = it->second;
                    } else {
                        break;
                    }
                }
            }
        }
    }

    return dom;
}

void SsaResult::print(std::ostream& os) const {
    os << "Block | idom | DF     | phi placed for\n";
    for (const auto& b : cfg.blocks) {
        std::string idom_str = (dom.idom.at(b.id) == -1) ? "-" : ("B" + std::to_string(dom.idom.at(b.id)));
        std::string df_str = "{";
        auto it = dom.df.find(b.id);
        if (it != dom.df.end()) {
            size_t count = 0;
            for (int df_b : it->second) {
                if (count > 0) df_str += ",";
                df_str += "B" + std::to_string(df_b);
                count++;
            }
        }
        df_str += "}";

        std::string phi_str = "-";
        auto pit = phis_placed.find(b.id);
        if (pit != phis_placed.end() && !pit->second.empty()) {
            phi_str = "";
            for (size_t i = 0; i < pit->second.size(); ++i) {
                if (i > 0) phi_str += ",";
                phi_str += pit->second[i];
            }
        }

        os << std::left << std::setw(6) << ("B" + std::to_string(b.id)) << "| "
           << std::setw(5) << idom_str << "| "
           << std::setw(7) << df_str << "| "
           << phi_str << "\n";
    }

    os << "\n";
    cfg.print_code(os);
    os << "phis_unpruned=" << phis_unpruned << " phis_pruned=" << phis_pruned << "\n";
    os << "verify: OK\n";
}

void verifySsa(const Cfg& cfg, const DomInfo& dom) {
    std::map<std::string, std::pair<int, int>> def_loc; // name -> {block_id, instr_idx}
    std::map<std::string, int> def_count;

    // Check single definition & phi ordering
    for (const auto& b : cfg.blocks) {
        bool seen_non_phi = false;
        for (size_t i = 0; i < b.instrs.size(); ++i) {
            const auto& q = b.instrs[i];
            if (q.op == OpType::PHI) {
                if (seen_non_phi) {
                    std::cerr << "verify: FAIL: phi after non-phi in B" << b.id << "\n";
                    std::exit(1);
                }
                if (q.phiArgs.size() != b.pred.size()) {
                    std::cerr << "verify: FAIL: phi arg count mismatch in B" << b.id << " for " << q.result << "\n";
                    std::exit(1);
                }
            } else {
                seen_non_phi = true;
            }

            std::string d = defOf(q);
            if (!d.empty()) {
                if (++def_count[d] > 1) {
                    std::cerr << "verify: FAIL: multiple definitions for " << d << "\n";
                    std::exit(1);
                }
                def_loc[d] = {b.id, static_cast<int>(i)};
            }
        }
    }

    // Check that every use is dominated by its definition
    for (const auto& b : cfg.blocks) {
        for (size_t i = 0; i < b.instrs.size(); ++i) {
            const auto& q = b.instrs[i];

            if (q.op == OpType::PHI) {
                for (size_t k = 0; k < q.phiArgs.size(); ++k) {
                    const auto& arg = q.phiArgs[k];
                    if (arg.empty() || isLiteral(arg)) continue;

                    auto it = def_loc.find(arg);
                    if (it != def_loc.end()) {
                        int def_b = it->second.first;
                        int pred_b = b.pred[k];
                        if (!dom.dominates(def_b, pred_b)) {
                            std::cerr << "verify: FAIL: phi arg " << arg << " not dominated at end of B" << pred_b << "\n";
                            std::exit(1);
                        }
                    } else {
                        // Undefined temp or versioned name is invalid
                        if (isTemp(arg) || (arg.size() > 1 && std::isdigit(arg.back()))) {
                            std::cerr << "verify: FAIL: undefined use " << arg << "\n";
                            std::exit(1);
                        }
                    }
                }
            } else {
                for (const auto* u : usesOf(q)) {
                    if (u->empty() || isLiteral(*u)) continue;

                    auto it = def_loc.find(*u);
                    if (it != def_loc.end()) {
                        int def_b = it->second.first;
                        int def_i = it->second.second;
                        if (def_b == b.id) {
                            if (def_i >= static_cast<int>(i)) {
                                std::cerr << "verify: FAIL: use " << *u << " precedes definition in B" << b.id << "\n";
                                std::exit(1);
                            }
                        } else {
                            if (!dom.dominates(def_b, b.id)) {
                                std::cerr << "verify: FAIL: use " << *u << " in B" << b.id << " not dominated by B" << def_b << "\n";
                                std::exit(1);
                            }
                        }
                    } else {
                        if (isTemp(*u) || (u->size() > 1 && std::isdigit(u->back()))) {
                            std::cerr << "verify: FAIL: undefined use " << *u << "\n";
                            std::exit(1);
                        }
                    }
                }
            }
        }
    }
}

SsaResult convertToSsa(Cfg cfg, bool pruned,
                       const std::set<std::string>& user_live_out,
                       bool has_user_live_out) {
    SsaResult res;
    res.dom = computeDominance(cfg);

    // 1. Scalar variables to convert: defined by non-store op, not a temp.
    std::vector<std::string> var_list; // preserve order of first definition
    std::set<std::string> var_set;

    for (const auto& b : cfg.blocks) {
        for (const auto& q : b.instrs) {
            std::string d = defOf(q);
            if (!d.empty() && !isTemp(d)) {
                if (var_set.insert(d).second) {
                    var_list.push_back(d);
                }
            }
        }
    }

    // 2. Insert EXIT_USE pseudo-instruction at the end of every exit block
    // without a return statement, listing the live-out set.
    std::vector<std::string> exit_live_out;
    if (has_user_live_out) {
        for (const auto& v : user_live_out) {
            if (var_set.count(v)) {
                exit_live_out.push_back(v);
            }
        }
    } else {
        exit_live_out = var_list;
    }

    for (auto& b : cfg.blocks) {
        if (b.succ.empty()) {
            if (b.instrs.empty() || b.instrs.back().op != OpType::RETURN) {
                Quad eq(OpType::EXIT_USE);
                eq.phiArgs = exit_live_out;
                b.instrs.push_back(std::move(eq));
            }
        }
    }

    // 3. Compute Liveness for pruned mode
    LivenessResult live = computeLiveness(cfg, user_live_out, has_user_live_out);

    // 4. Phi Placement by iterated dominance frontier (compute both pruned and unpruned totals)
    res.phis_unpruned = 0;
    res.phis_pruned = 0;

    for (const auto& v : var_list) {
        std::set<int> def_blocks;
        for (const auto& b : cfg.blocks) {
            for (const auto& q : b.instrs) {
                if (defOf(q) == v) {
                    def_blocks.insert(b.id);
                }
            }
        }

        // Iterated dominance frontier DF+(defs of v)
        std::set<int> unpruned_blocks;
        std::vector<int> work(def_blocks.begin(), def_blocks.end());
        while (!work.empty()) {
            int x = work.back();
            work.pop_back();

            auto it = res.dom.df.find(x);
            if (it != res.dom.df.end()) {
                for (int y : it->second) {
                    if (unpruned_blocks.find(y) == unpruned_blocks.end()) {
                        unpruned_blocks.insert(y);
                        if (def_blocks.find(y) == def_blocks.end()) {
                            work.push_back(y);
                        }
                    }
                }
            }
        }
        res.phis_unpruned += static_cast<int>(unpruned_blocks.size());

        // Pruned mode: DF+(defs of v) intersect live_in
        std::set<int> pruned_blocks;
        for (int y : unpruned_blocks) {
            auto lit = live.live_in.find(y);
            if (lit != live.live_in.end() && lit->second.count(v)) {
                pruned_blocks.insert(y);
            }
        }
        res.phis_pruned += static_cast<int>(pruned_blocks.size());

        const auto& target_blocks = pruned ? pruned_blocks : unpruned_blocks;
        for (int b_id : target_blocks) {
            res.phis_placed[b_id].push_back(v);
        }
    }

    // Insert PHI quads at the beginning of respective blocks
    for (auto& b : cfg.blocks) {
        auto it = res.phis_placed.find(b.id);
        if (it != res.phis_placed.end()) {
            std::vector<Quad> phis;
            for (const auto& v : it->second) {
                Quad pq(OpType::PHI);
                pq.result = v;
                pq.arg1 = v; // save original variable name
                pq.phiArgs.assign(b.pred.size(), "");
                phis.push_back(std::move(pq));
            }
            b.instrs.insert(b.instrs.begin(), phis.begin(), phis.end());
        }
    }

    // 5. SSA Renaming via preorder walk of dominator tree
    std::map<std::string, std::vector<std::string>> stacks;
    std::map<std::string, int> counters;

    std::map<int, Block*> id_to_block_mut;
    for (auto& b : cfg.blocks) {
        id_to_block_mut[b.id] = &b;
    }

    std::function<void(int)> rename_block = [&](int b_id) {
        Block& b = *id_to_block_mut.at(b_id);
        std::vector<std::string> pushed;

        // Phi definitions get new versions
        for (auto& q : b.instrs) {
            if (q.op == OpType::PHI) {
                std::string var = q.arg1;
                int ver = ++counters[var];
                std::string new_name = (var == "t" || (!var.empty() && std::isdigit(var.back())))
                                           ? (var + "_" + std::to_string(ver))
                                           : (var + std::to_string(ver));
                q.result = new_name;
                stacks[var].push_back(new_name);
                pushed.push_back(var);
            }
        }

        // Instructions in block: rename uses first, then definitions
        for (auto& q : b.instrs) {
            if (q.op == OpType::PHI) continue;

            if (q.op == OpType::EXIT_USE) {
                for (auto& arg : q.phiArgs) {
                    if (var_set.count(arg)) {
                        if (!stacks[arg].empty()) {
                            arg = stacks[arg].back();
                        }
                    }
                }
            } else {
                for (auto* u : usesOf(q)) {
                    if (var_set.count(*u)) {
                        if (!stacks[*u].empty()) {
                            *u = stacks[*u].back();
                        }
                    }
                }

                std::string d = defOf(q);
                if (!d.empty() && var_set.count(d)) {
                    int ver = ++counters[d];
                    std::string new_name = (d == "t" || (!d.empty() && std::isdigit(d.back())))
                                               ? (d + "_" + std::to_string(ver))
                                               : (d + std::to_string(ver));
                    q.result = new_name;
                    stacks[d].push_back(new_name);
                    pushed.push_back(d);
                }
            }
        }

        // Fill phi arguments in CFG successors
        for (const auto& edge : b.succ) {
            Block& succ_b = *id_to_block_mut.at(edge.to);
            int k = -1;
            for (size_t i = 0; i < succ_b.pred.size(); ++i) {
                if (succ_b.pred[i] == b_id) {
                    k = static_cast<int>(i);
                    break;
                }
            }
            if (k == -1) continue;

            for (auto& q : succ_b.instrs) {
                if (q.op == OpType::PHI) {
                    std::string orig_v = q.arg1;
                    std::string val = (!stacks[orig_v].empty()) ? stacks[orig_v].back() : orig_v;
                    q.phiArgs[k] = val;
                }
            }
        }

        // Preorder walk on dominator tree children
        auto it = res.dom.dom_children.find(b_id);
        if (it != res.dom.dom_children.end()) {
            for (int child_id : it->second) {
                rename_block(child_id);
            }
        }

        // Pop versions pushed in this block
        for (const auto& var : pushed) {
            stacks[var].pop_back();
        }
    };

    if (!cfg.blocks.empty()) {
        rename_block(cfg.blocks[0].id);
    }

    res.cfg = std::move(cfg);

    // Verify SSA invariants automatically
    verifySsa(res.cfg, res.dom);

    return res;
}
