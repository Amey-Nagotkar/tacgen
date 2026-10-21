#include "braun.hpp"

#include <algorithm>
#include <functional>
#include <iostream>
#include <map>
#include <set>
#include <string>
#include <vector>

namespace {

struct BraunBuilder {
    Cfg cfg;
    std::set<std::string> var_set;
    std::vector<std::string> var_list;
    std::vector<std::string> exit_live_out;
    std::map<std::string, int> version_counter;

    // current_def[var][block_id] = current SSA version name
    std::map<std::string, std::map<int, std::string>> current_def;

    // incomplete_phis[block_id][var] = phi result name
    std::map<int, std::map<std::string, std::string>> incomplete_phis;

    // block_phis[block_id] = list of phi quads in this block
    std::map<int, std::vector<Quad>> block_phis;

    std::map<int, bool> is_sealed;
    int entry_id = -1;
    std::map<int, int> filled_preds;
    std::map<int, Block*> id_to_block;

    void writeVariable(const std::string& var, int block_id, const std::string& val) {
        current_def[var][block_id] = val;
    }

    std::string readVariable(const std::string& var, int block_id) {
        auto vit = current_def.find(var);
        if (vit != current_def.end()) {
            auto bit = vit->second.find(block_id);
            if (bit != vit->second.end()) {
                return bit->second;
            }
        }
        return readVariableRecursive(var, block_id);
    }

    std::string readVariableRecursive(const std::string& var, int block_id) {
        std::string val;
        Block* blk = id_to_block.at(block_id);

        if (blk->pred.empty() || block_id == entry_id) {
            val = var;
        } else if (!is_sealed[block_id]) {
            // If an incomplete phi already exists for var in this block, reuse it
            auto it = incomplete_phis[block_id].find(var);
            if (it != incomplete_phis[block_id].end()) {
                return it->second;
            }

            // Create incomplete phi
            std::string new_name = (var == "t" || (!var.empty() && std::isdigit(var.back())))
                                       ? (var + "_" + std::to_string(++version_counter[var]))
                                       : (var + std::to_string(++version_counter[var]));
            Quad pq(OpType::PHI);
            pq.result = new_name;
            pq.arg1 = var;
            pq.phiArgs.assign(blk->pred.size(), "");
            block_phis[block_id].push_back(std::move(pq));

            incomplete_phis[block_id][var] = new_name;
            val = new_name;
        } else if (blk->pred.size() == 1) {
            val = readVariable(var, blk->pred[0]);
        } else {
            // Operandless phi to break cycles
            std::string new_name = (var == "t" || (!var.empty() && std::isdigit(var.back())))
                                       ? (var + "_" + std::to_string(++version_counter[var]))
                                       : (var + std::to_string(++version_counter[var]));
            Quad pq(OpType::PHI);
            pq.result = new_name;
            pq.arg1 = var;
            pq.phiArgs.assign(blk->pred.size(), "");
            block_phis[block_id].push_back(std::move(pq));

            writeVariable(var, block_id, new_name);

            addPhiOperands(var, new_name, block_id);
            val = tryRemoveTrivialPhi(new_name);
        }

        writeVariable(var, block_id, val);
        return val;
    }

    void addPhiOperands(const std::string& var, const std::string& phi_result, int block_id) {
        Block* blk = id_to_block.at(block_id);
        for (size_t k = 0; k < blk->pred.size(); ++k) {
            int p = blk->pred[k];
            std::string opnd = readVariable(var, p);
            for (auto& q : block_phis[block_id]) {
                if (q.op == OpType::PHI && q.result == phi_result) {
                    q.phiArgs[k] = opnd;
                    break;
                }
            }
        }
    }

    void sealBlock(int block_id) {
        if (is_sealed[block_id]) return;
        is_sealed[block_id] = true;

        auto it = incomplete_phis.find(block_id);
        if (it != incomplete_phis.end()) {
            auto phis = it->second; // copy map before iterating
            for (const auto& pair : phis) {
                const std::string& var = pair.first;
                const std::string& phi_result = pair.second;
                addPhiOperands(var, phi_result, block_id);
                tryRemoveTrivialPhi(phi_result);
            }
            incomplete_phis[block_id].clear();
        }
    }

    void replaceUses(const std::string& old_val, const std::string& new_val) {
        for (auto& var_pair : current_def) {
            for (auto& blk_pair : var_pair.second) {
                if (blk_pair.second == old_val) {
                    blk_pair.second = new_val;
                }
            }
        }

        for (auto& pair : block_phis) {
            for (auto& q : pair.second) {
                for (auto& a : q.phiArgs) {
                    if (a == old_val) {
                        a = new_val;
                    }
                }
            }
        }

        for (auto& b : cfg.blocks) {
            for (auto& q : b.instrs) {
                if (q.op == OpType::EXIT_USE) {
                    for (auto& a : q.phiArgs) {
                        if (a == old_val) {
                            a = new_val;
                        }
                    }
                } else {
                    for (auto* u : usesOf(q)) {
                        if (*u == old_val) {
                            *u = new_val;
                        }
                    }
                }
            }
        }
    }

    std::string tryRemoveTrivialPhi(const std::string& phi_result) {
        Quad* target_q = nullptr;
        int found_block_id = -1;

        for (auto& pair : block_phis) {
            for (auto& q : pair.second) {
                if (q.op == OpType::PHI && q.result == phi_result) {
                    target_q = &q;
                    found_block_id = pair.first;
                    break;
                }
            }
            if (target_q) break;
        }

        if (!target_q) return phi_result;

        std::set<std::string> distinct;
        for (const auto& a : target_q->phiArgs) {
            if (!a.empty() && a != phi_result) {
                distinct.insert(a);
            }
        }

        std::string same;
        if (distinct.empty()) {
            same = target_q->arg1;
        } else if (distinct.size() == 1) {
            same = *distinct.begin();
        } else {
            return phi_result;
        }

        std::vector<std::string> user_phis;
        for (const auto& pair : block_phis) {
            for (const auto& q : pair.second) {
                if (q.op == OpType::PHI && q.result != phi_result) {
                    for (const auto& a : q.phiArgs) {
                        if (a == phi_result) {
                            user_phis.push_back(q.result);
                            break;
                        }
                    }
                }
            }
        }

        replaceUses(phi_result, same);

        auto& phis = block_phis[found_block_id];
        for (auto it = phis.begin(); it != phis.end(); ++it) {
            if (it->op == OpType::PHI && it->result == phi_result) {
                phis.erase(it);
                break;
            }
        }

        for (const auto& u_phi : user_phis) {
            tryRemoveTrivialPhi(u_phi);
        }

        return same;
    }
};

} // namespace

void BraunResult::print(std::ostream& os) const {
    cfg.print_code(os);
    os << "phis_braun=" << phis_braun << "\n";
    verifySsa(cfg, dom);
    os << "verify: OK\n";
}

BraunResult constructSsaBraun(Cfg cfg,
                              const std::set<std::string>& user_live_out,
                              bool has_user_live_out) {
    BraunBuilder builder;
    builder.cfg = std::move(cfg);

    for (auto& b : builder.cfg.blocks) {
        builder.id_to_block[b.id] = &b;
        builder.is_sealed[b.id] = false;
        builder.filled_preds[b.id] = 0;
        builder.block_phis[b.id] = {};
    }

    // Identify scalar variables to convert
    for (const auto& b : builder.cfg.blocks) {
        for (const auto& q : b.instrs) {
            std::string d = defOf(q);
            if (!d.empty() && !isTemp(d)) {
                if (builder.var_set.insert(d).second) {
                    builder.var_list.push_back(d);
                }
            }
        }
    }

    if (has_user_live_out) {
        for (const auto& v : user_live_out) {
            if (builder.var_set.count(v)) {
                builder.exit_live_out.push_back(v);
            }
        }
    } else {
        builder.exit_live_out = builder.var_list;
    }

    if (builder.cfg.blocks.empty()) {
        BraunResult res;
        return res;
    }

    // Compute reverse postorder (RPO)
    std::vector<int> postorder;
    std::set<int> visited;
    int entry_id = builder.cfg.blocks[0].id;

    std::function<void(int)> dfs = [&](int u) {
        visited.insert(u);
        auto it = builder.id_to_block.find(u);
        if (it != builder.id_to_block.end()) {
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
    std::vector<int> rpo = std::move(postorder);

    builder.entry_id = entry_id;

    // Process blocks in reverse postorder
    for (int b_id : rpo) {
        Block& b = *builder.id_to_block.at(b_id);

        if (builder.filled_preds[b_id] == static_cast<int>(b.pred.size())) {
            builder.sealBlock(b_id);
        }

        // Process existing instructions in b
        for (size_t i = 0; i < b.instrs.size(); ++i) {
            auto& q = b.instrs[i];

            // Uses first
            for (auto* u : usesOf(q)) {
                if (builder.var_set.count(*u)) {
                    *u = builder.readVariable(*u, b_id);
                }
            }

            // Def second
            std::string d = defOf(q);
            if (!d.empty() && builder.var_set.count(d)) {
                std::string new_name = (d == "t" || (!d.empty() && std::isdigit(d.back())))
                                           ? (d + "_" + std::to_string(++builder.version_counter[d]))
                                           : (d + std::to_string(++builder.version_counter[d]));
                q.result = new_name;
                builder.writeVariable(d, b_id, new_name);
            }
        }

        // If exit block without return, insert EXIT_USE
        if (b.succ.empty()) {
            if (b.instrs.empty() || b.instrs.back().op != OpType::RETURN) {
                Quad eq(OpType::EXIT_USE);
                for (const auto& v : builder.exit_live_out) {
                    eq.phiArgs.push_back(builder.readVariable(v, b_id));
                }
                b.instrs.push_back(std::move(eq));
            }
        }

        // Block b is now filled: notify successors
        for (const auto& edge : b.succ) {
            int s_id = edge.to;
            builder.filled_preds[s_id]++;
            if (builder.filled_preds[s_id] == static_cast<int>(builder.id_to_block.at(s_id)->pred.size())) {
                builder.sealBlock(s_id);
            }
        }
    }

    // Seal any remaining blocks
    for (auto& b : builder.cfg.blocks) {
        builder.sealBlock(b.id);
    }

    // Prepend block_phis to each block's instructions
    for (auto& b : builder.cfg.blocks) {
        auto it = builder.block_phis.find(b.id);
        if (it != builder.block_phis.end()) {
            b.instrs.insert(b.instrs.begin(), it->second.begin(), it->second.end());
        }
    }

    // Remove phis with zero uses
    bool any_removed = true;
    while (any_removed) {
        any_removed = false;
        std::map<std::string, int> use_counts;
        for (const auto& b : builder.cfg.blocks) {
            for (const auto& q : b.instrs) {
                if (q.op == OpType::PHI || q.op == OpType::EXIT_USE) {
                    for (const auto& a : q.phiArgs) {
                        use_counts[a]++;
                    }
                } else {
                    for (const auto* u : usesOf(q)) {
                        use_counts[*u]++;
                    }
                }
            }
        }

        for (auto& b : builder.cfg.blocks) {
            for (auto it = b.instrs.begin(); it != b.instrs.end();) {
                if (it->op == OpType::PHI && use_counts[it->result] == 0) {
                    it = b.instrs.erase(it);
                    any_removed = true;
                } else {
                    ++it;
                }
            }
        }
    }

    BraunResult res;
    res.cfg = std::move(builder.cfg);
    res.dom = computeDominance(res.cfg);

    int phis_count = 0;
    for (const auto& b : res.cfg.blocks) {
        for (const auto& q : b.instrs) {
            if (q.op == OpType::PHI) {
                phis_count++;
            }
        }
    }
    res.phis_braun = phis_count;

    return res;
}

void compareSsa(Cfg cfg,
                const std::set<std::string>& user_live_out,
                bool has_user_live_out,
                std::ostream& os) {
    Cfg cfg_cytron = cfg;
    Cfg cfg_braun = cfg;

    SsaResult cytron = convertToSsa(std::move(cfg_cytron), true /*pruned*/, user_live_out, has_user_live_out);
    BraunResult braun = constructSsaBraun(std::move(cfg_braun), user_live_out, has_user_live_out);

    bool match = (cytron.phis_pruned == braun.phis_braun);

    os << "phis_cytron_pruned=" << cytron.phis_pruned
       << " phis_braun=" << braun.phis_braun
       << " " << (match ? "MATCH" : "DIFFER") << "\n";

    verifySsa(cytron.cfg, cytron.dom);
    verifySsa(braun.cfg, braun.dom);
    os << "verify: OK\n";

    if (!match) {
        os << "\n--- Cytron Pruned SSA ---\n";
        cytron.cfg.print_code(os);
        os << "\n--- Braun SSA ---\n";
        braun.cfg.print_code(os);
        os << "Explanation: Cytron pruned SSA uses global liveness to suppress phis for variables not live-in,\n"
           << "whereas Braun constructs phis on-demand and removes trivial phis.\n";
    }
}
