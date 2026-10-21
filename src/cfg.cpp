#include "cfg.hpp"

#include <algorithm>
#include <filesystem>
#include <fstream>
#include <queue>
#include <stdexcept>
#include <unordered_map>
#include <unordered_set>

static std::string escape_dot_string(const std::string& s) {
    std::string res;
    for (char c : s) {
        if (c == '"') {
            res += "\\\"";
        } else if (c == '\\') {
            res += "\\\\";
        } else {
            res += c;
        }
    }
    return res;
}

Cfg buildCfg(const std::vector<Quad>& quads) {
    Cfg cfg;
    if (quads.empty()) {
        return cfg;
    }

    // 1. Identify Leader Instructions
    // Compiler concept: Basic Block Leaders
    // - The first instruction is a leader.
    // - Any target of a conditional or unconditional jump (any instruction with a label) is a leader.
    // - Any instruction immediately following a jump (GOTO, IF_REL) or RETURN is a leader.
    std::vector<bool> is_leader(quads.size(), false);
    is_leader[0] = true;

    for (size_t i = 0; i < quads.size(); ++i) {
        if (!quads[i].labels.empty()) {
            is_leader[i] = true;
        }
        if (quads[i].op == OpType::GOTO ||
            quads[i].op == OpType::IF_REL ||
            quads[i].op == OpType::RETURN) {
            if (i + 1 < quads.size()) {
                is_leader[i + 1] = true;
            }
        }
    }

    // 2. Partition Quads into Initial Basic Blocks
    std::vector<Block> raw_blocks;
    std::unordered_map<std::string, int> label_to_block_id;
    int current_id = 1;

    size_t i = 0;
    while (i < quads.size()) {
        size_t start = i;
        size_t next_start = start + 1;
        while (next_start < quads.size() && !is_leader[next_start]) {
            next_start++;
        }
        size_t end = next_start - 1;

        Block b;
        b.id = current_id++;
        b.firstOrig = static_cast<int>(start + 1);
        b.lastOrig = static_cast<int>(end + 1);
        b.labels = quads[start].labels; // Move labels from the leader Quad

        for (size_t k = start; k <= end; ++k) {
            Quad q = quads[k];
            if (k == start) {
                q.labels.clear(); // Clear on Quad as labels now belong to the Block
            }
            b.instrs.push_back(std::move(q));
        }

        for (const auto& lbl : b.labels) {
            label_to_block_id[lbl] = b.id;
        }

        raw_blocks.push_back(std::move(b));
        i = next_start;
    }

    // 3. Construct Edges
    for (size_t b_idx = 0; b_idx < raw_blocks.size(); ++b_idx) {
        Block& b = raw_blocks[b_idx];
        const Quad& last = b.instrs.back();

        if (last.op == OpType::GOTO) {
            auto it = label_to_block_id.find(last.result);
            if (it != label_to_block_id.end()) {
                b.succ.push_back(Edge{it->second, "", false});
            }
        } else if (last.op == OpType::IF_REL) {
            // IF_REL -> fall-through block (inverted relation) listed FIRST,
            // then the target block (relation as written) listed SECOND.
            if (b_idx + 1 < raw_blocks.size()) {
                int fall_id = raw_blocks[b_idx + 1].id;
                std::string inv_rel = invert_relop(last.rel);
                std::string fall_lbl = last.arg1 + " " + inv_rel + " " + last.arg2;
                b.succ.push_back(Edge{fall_id, fall_lbl, false});
            }
            auto it = label_to_block_id.find(last.result);
            if (it != label_to_block_id.end()) {
                std::string target_lbl = last.arg1 + " " + last.rel + " " + last.arg2;
                b.succ.push_back(Edge{it->second, target_lbl, false});
            }
        } else if (last.op == OpType::RETURN) {
            // RETURN has no successor
        } else {
            // Normal fall-through to next block in program order
            if (b_idx + 1 < raw_blocks.size()) {
                int fall_id = raw_blocks[b_idx + 1].id;
                b.succ.push_back(Edge{fall_id, "", false});
            }
        }
    }

    // 4. Fill Predecessors
    auto add_preds = [](std::vector<Block>& blks) {
        std::unordered_map<int, size_t> id_to_index;
        for (size_t idx = 0; idx < blks.size(); ++idx) {
            id_to_index[blks[idx].id] = idx;
            blks[idx].pred.clear();
        }
        for (const auto& b : blks) {
            for (const auto& edge : b.succ) {
                auto it = id_to_index.find(edge.to);
                if (it != id_to_index.end()) {
                    blks[it->second].pred.push_back(b.id);
                }
            }
        }
        for (auto& b : blks) {
            std::sort(b.pred.begin(), b.pred.end());
            b.pred.erase(std::unique(b.pred.begin(), b.pred.end()), b.pred.end());
        }
    };
    add_preds(raw_blocks);

    // 5. Unreachable Block Elimination (from B1)
    std::unordered_set<int> reachable;
    std::queue<int> q;
    if (!raw_blocks.empty()) {
        reachable.insert(raw_blocks[0].id);
        q.push(raw_blocks[0].id);
    }

    std::unordered_map<int, size_t> raw_id_to_index;
    for (size_t idx = 0; idx < raw_blocks.size(); ++idx) {
        raw_id_to_index[raw_blocks[idx].id] = idx;
    }

    while (!q.empty()) {
        int curr = q.front();
        q.pop();
        auto it = raw_id_to_index.find(curr);
        if (it != raw_id_to_index.end()) {
            for (const auto& edge : raw_blocks[it->second].succ) {
                if (reachable.find(edge.to) == reachable.end()) {
                    reachable.insert(edge.to);
                    q.push(edge.to);
                }
            }
        }
    }

    std::vector<Block> kept_blocks;
    for (const auto& b : raw_blocks) {
        if (reachable.find(b.id) != reachable.end()) {
            kept_blocks.push_back(b);
        } else {
            std::cerr << "warning: removed unreachable block B" << b.id
                      << " (instrs " << b.firstOrig << "-" << b.lastOrig << ")\n";
        }
    }

    // 6. Renumber Blocks Consecutively and Fix References
    std::unordered_map<int, int> old_to_new;
    for (size_t idx = 0; idx < kept_blocks.size(); ++idx) {
        old_to_new[kept_blocks[idx].id] = static_cast<int>(idx + 1);
        kept_blocks[idx].id = static_cast<int>(idx + 1);
    }

    for (auto& b : kept_blocks) {
        for (auto& edge : b.succ) {
            edge.to = old_to_new[edge.to];
        }
    }
    add_preds(kept_blocks);

    // 7. Detect Back Edges using Depth-First Search (Retreating Edges)
    // Compiler concept: DFS Back Edges / Natural Loops
    // An edge u -> v is a back edge if v is an active ancestor on the current DFS stack.
    std::unordered_map<int, int> dfs_state; // 0: unvisited, 1: on_stack, 2: completed
    std::unordered_map<int, size_t> block_index_map;
    for (size_t idx = 0; idx < kept_blocks.size(); ++idx) {
        block_index_map[kept_blocks[idx].id] = idx;
    }

    auto dfs = [&](auto& self, int u_id) -> void {
        dfs_state[u_id] = 1; // ON_STACK
        auto it = block_index_map.find(u_id);
        if (it != block_index_map.end()) {
            Block& u = kept_blocks[it->second];
            for (auto& edge : u.succ) {
                int v_id = edge.to;
                if (dfs_state[v_id] == 1) {
                    edge.backEdge = true;
                } else if (dfs_state[v_id] == 0) {
                    self(self, v_id);
                }
            }
        }
        dfs_state[u_id] = 2; // COMPLETED
    };

    if (!kept_blocks.empty()) {
        dfs(dfs, kept_blocks[0].id);
    }

    cfg.blocks = std::move(kept_blocks);
    return cfg;
}

void Cfg::print_blocks(std::ostream& os) const {
    int total_edges = 0;
    std::vector<std::string> back_edges_list;

    for (const auto& b : blocks) {
        os << "B" << b.id << " [" << b.firstOrig << "-" << b.lastOrig << "] ";

        // labels
        os << "labels=";
        if (b.labels.empty()) {
            os << "-";
        } else {
            for (size_t i = 0; i < b.labels.size(); ++i) {
                if (i > 0) os << ",";
                os << b.labels[i];
            }
        }
        os << " ";

        // pred
        os << "pred=";
        if (b.pred.empty()) {
            os << "-";
        } else {
            for (size_t i = 0; i < b.pred.size(); ++i) {
                if (i > 0) os << ",";
                os << "B" << b.pred[i];
            }
        }
        os << " ";

        // succ
        os << "succ=";
        if (b.succ.empty()) {
            os << "-";
        } else {
            for (size_t i = 0; i < b.succ.size(); ++i) {
                if (i > 0) os << ",";
                os << "B" << b.succ[i].to;
                if (!b.succ[i].label.empty()) {
                    os << "(" << b.succ[i].label << ")";
                }
            }
        }
        os << "\n";

        // instructions indented 4 spaces
        for (const auto& q : b.instrs) {
            os << "    " << q.to_string() << "\n";
        }

        for (const auto& edge : b.succ) {
            total_edges++;
            if (edge.backEdge) {
                back_edges_list.push_back("B" + std::to_string(b.id) + "->B" + std::to_string(edge.to));
            }
        }
    }

    os << "back edges: ";
    if (back_edges_list.empty()) {
        os << "none\n";
    } else {
        for (size_t i = 0; i < back_edges_list.size(); ++i) {
            if (i > 0) os << ", ";
            os << back_edges_list[i];
        }
        os << "\n";
    }

    os << "blocks=" << blocks.size()
       << " edges=" << total_edges
       << " back_edges=" << back_edges_list.size() << "\n";
}

void Cfg::print_dot(std::ostream& os) const {
    os << "digraph CFG {\n";
    os << "  node [shape=box, fontname=\"Courier\"];\n";
    os << "  edge [fontname=\"Courier\"];\n\n";

    // Node definitions
    for (const auto& b : blocks) {
        os << "  B" << b.id << " [label=\"B" << b.id;
        if (!b.labels.empty()) {
            os << " (";
            for (size_t i = 0; i < b.labels.size(); ++i) {
                if (i > 0) os << ",";
                os << b.labels[i];
            }
            os << ")";
        }
        os << "\\l";

        for (const auto& q : b.instrs) {
            os << escape_dot_string(q.to_string()) << "\\l";
        }
        os << "\"];\n";
    }
    os << "\n";

    // Edge definitions
    for (const auto& b : blocks) {
        for (const auto& edge : b.succ) {
            os << "  B" << b.id << " -> B" << edge.to;
            std::vector<std::string> attrs;
            if (!edge.label.empty()) {
                attrs.push_back("label=\"" + escape_dot_string(edge.label) + "\"");
            }
            if (edge.backEdge) {
                attrs.push_back("color=red");
            }
            if (!attrs.empty()) {
                os << " [";
                for (size_t k = 0; k < attrs.size(); ++k) {
                    if (k > 0) os << ", ";
                    os << attrs[k];
                }
                os << "]";
            }
            os << ";\n";
        }
    }

    os << "}\n";
}

void Cfg::write_dot_file(const std::string& filepath) const {
    std::filesystem::path p(filepath);
    if (p.has_parent_path()) {
        std::filesystem::create_directories(p.parent_path());
    }
    std::ofstream out(filepath);
    if (!out.is_open()) {
        throw std::runtime_error("Cannot open dot output file: " + filepath);
    }
    print_dot(out);
}
