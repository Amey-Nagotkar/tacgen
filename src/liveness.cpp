#include "liveness.hpp"

LivenessResult computeLiveness(const Cfg& cfg,
                              const std::set<std::string>& user_live_out,
                              bool has_user_live_out) {
    LivenessResult res;

    // 1. Gather all non-temp defined names across the program
    std::set<std::string> all_defined_non_temps;
    for (const auto& b : cfg.blocks) {
        for (const auto& q : b.instrs) {
            std::string d = defOf(q);
            if (!d.empty() && !isTemp(d)) {
                all_defined_non_temps.insert(d);
            }
        }
    }

    // Initialize in/out sets
    for (const auto& b : cfg.blocks) {
        res.live_in[b.id] = {};
        res.live_out[b.id] = {};
    }

    // 2. Iterate backward dataflow equations until stable
    // OUT[B] = Union(IN[S]) for S in succ(B) (or boundary condition if succ is empty)
    // IN[B]  = (OUT[B] - defs(B)) U uses(B)
    bool changed = true;
    while (changed) {
        res.iterations++;
        changed = false;

        // Traverse in reverse block order for efficient backward propagation
        for (int i = static_cast<int>(cfg.blocks.size()) - 1; i >= 0; --i) {
            const auto& b = cfg.blocks[i];
            std::set<std::string> out;

            if (b.succ.empty()) {
                if (!b.instrs.empty() && b.instrs.back().op == OpType::RETURN) {
                    out.clear();
                } else if (has_user_live_out) {
                    out = user_live_out;
                } else {
                    out = all_defined_non_temps;
                }
            } else {
                for (const auto& edge : b.succ) {
                    auto it = res.live_in.find(edge.to);
                    if (it != res.live_in.end()) {
                        out.insert(it->second.begin(), it->second.end());
                    }
                }
            }

            std::set<std::string> in = out;
            for (int j = static_cast<int>(b.instrs.size()) - 1; j >= 0; --j) {
                const auto& q = b.instrs[j];
                std::string d = defOf(q);
                if (!d.empty()) {
                    in.erase(d);
                }
                for (const auto* u : usesOf(q)) {
                    if (!u->empty() && !isLiteral(*u)) {
                        in.insert(*u);
                    }
                }
            }

            if (out != res.live_out[b.id] || in != res.live_in[b.id]) {
                res.live_out[b.id] = std::move(out);
                res.live_in[b.id] = std::move(in);
                changed = true;
            }
        }
    }

    return res;
}
