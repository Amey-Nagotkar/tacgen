#include "formats.hpp"

#include <algorithm>
#include <iomanip>
#include <sstream>
#include <stdexcept>
#include <unordered_map>

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

FormatsManager::FormatsManager(const std::vector<Quad>& quads) {
    build_quadruples(quads);
    build_triples(quads);
    build_indirect();
}

void FormatsManager::build_quadruples(const std::vector<Quad>& quads) {
    quads_table_.clear();
    quads_table_.reserve(quads.size());

    for (const auto& q : quads) {
        QuadrupleRow row;
        row.labels = q.labels;

        switch (q.op) {
            case OpType::ASSIGN:
                row.op = "=";
                row.arg1 = q.arg1;
                row.arg2 = "";
                row.result = q.result;
                break;
            case OpType::BINOP:
                row.op = q.rel;
                row.arg1 = q.arg1;
                row.arg2 = q.arg2;
                row.result = q.result;
                break;
            case OpType::UNARY_MINUS:
                row.op = "minus";
                row.arg1 = q.arg1;
                row.arg2 = "";
                row.result = q.result;
                break;
            case OpType::IF_REL:
                row.op = "if" + q.rel;
                row.arg1 = q.arg1;
                row.arg2 = q.arg2;
                row.result = q.result;
                break;
            case OpType::GOTO:
                row.op = "goto";
                row.arg1 = "";
                row.arg2 = "";
                row.result = q.result;
                break;
            case OpType::PARAM:
                row.op = "param";
                row.arg1 = q.arg1;
                row.arg2 = "";
                row.result = "";
                break;
            case OpType::CALL:
                row.op = "call";
                row.arg1 = q.arg1;
                row.arg2 = q.arg2;
                row.result = q.result;
                break;
            case OpType::RETURN:
                row.op = "return";
                row.arg1 = q.arg1;
                row.arg2 = "";
                row.result = "";
                break;
            case OpType::ARRAY_LOAD:
                row.op = "=[]";
                row.arg1 = q.arg1;
                row.arg2 = q.arg2;
                row.result = q.result;
                break;
            case OpType::ARRAY_STORE:
                row.op = "[]=";
                row.arg1 = q.arg1;
                row.arg2 = q.arg2;
                row.result = q.result;
                break;
            case OpType::NOP:
                row.op = "nop";
                row.arg1 = "";
                row.arg2 = "";
                row.result = "";
                break;
        }
        quads_table_.push_back(std::move(row));
    }
}

void FormatsManager::build_triples(const std::vector<Quad>& quads) {
    triples_table_.clear();
    std::unordered_map<std::string, int> temp_to_triple;

    auto resolve = [&](const std::string& operand) -> std::string {
        auto it = temp_to_triple.find(operand);
        if (it != temp_to_triple.end()) {
            return "(" + std::to_string(it->second) + ")";
        }
        return operand;
    };

    for (const auto& q : quads) {
        switch (q.op) {
            case OpType::BINOP: {
                int k = static_cast<int>(triples_table_.size());
                std::string y = resolve(q.arg1);
                std::string z = resolve(q.arg2);
                triples_table_.push_back(TripleRow{q.rel, y, z, q.labels});
                if (!q.result.empty()) {
                    temp_to_triple[q.result] = k;
                }
                break;
            }
            case OpType::UNARY_MINUS: {
                int k = static_cast<int>(triples_table_.size());
                std::string y = resolve(q.arg1);
                triples_table_.push_back(TripleRow{"minus", y, "", q.labels});
                if (!q.result.empty()) {
                    temp_to_triple[q.result] = k;
                }
                break;
            }
            case OpType::ASSIGN: {
                std::string y = resolve(q.arg1);
                triples_table_.push_back(TripleRow{"=", q.result, y, q.labels});
                break;
            }
            case OpType::GOTO: {
                triples_table_.push_back(TripleRow{"goto", "", q.result, q.labels});
                break;
            }
            case OpType::IF_REL: {
                int k = static_cast<int>(triples_table_.size());
                std::string x = resolve(q.arg1);
                std::string y = resolve(q.arg2);
                // First triple evaluates the relational comparison, carrying labels
                triples_table_.push_back(TripleRow{q.rel, x, y, q.labels});
                // Second triple performs the conditional jump referencing the condition
                triples_table_.push_back(TripleRow{"if", "(" + std::to_string(k) + ")", q.result, {}});
                break;
            }
            case OpType::RETURN: {
                std::string x = resolve(q.arg1);
                triples_table_.push_back(TripleRow{"return", x, "", q.labels});
                break;
            }
            case OpType::PARAM: {
                std::string x = resolve(q.arg1);
                triples_table_.push_back(TripleRow{"param", x, "", q.labels});
                break;
            }
            case OpType::CALL: {
                int k = static_cast<int>(triples_table_.size());
                triples_table_.push_back(TripleRow{"call", q.arg1, q.arg2, q.labels});
                if (!q.result.empty()) {
                    temp_to_triple[q.result] = k;
                }
                break;
            }
            case OpType::ARRAY_LOAD: {
                int k = static_cast<int>(triples_table_.size());
                std::string idx = resolve(q.arg2);
                triples_table_.push_back(TripleRow{"=[]", q.arg1, idx, q.labels});
                if (!q.result.empty()) {
                    temp_to_triple[q.result] = k;
                }
                break;
            }
            case OpType::ARRAY_STORE: {
                int k = static_cast<int>(triples_table_.size());
                std::string idx = resolve(q.arg1);
                std::string val = resolve(q.arg2);
                // First triple specifies array element location ([]=, array, index), carrying labels
                triples_table_.push_back(TripleRow{"[]=", q.result, idx, q.labels});
                // Second triple assigns value into referenced element location (=, (k), val)
                triples_table_.push_back(TripleRow{"=", "(" + std::to_string(k) + ")", val, {}});
                break;
            }
            case OpType::NOP: {
                triples_table_.push_back(TripleRow{"nop", "", "", q.labels});
                break;
            }
        }
    }
}

void FormatsManager::build_indirect() {
    indirect_table_.triples = triples_table_;
    indirect_table_.pointers.clear();
    indirect_table_.pointers.reserve(triples_table_.size());
    for (size_t i = 0; i < triples_table_.size(); ++i) {
        indirect_table_.pointers.push_back(static_cast<int>(i));
    }
}

void FormatsManager::print_formats(std::ostream& os) const {
    // 1. Quadruples Table
    os << "QUADRUPLES\n";
    os << std::left << std::setw(7) << "index"
       << std::setw(8) << "op"
       << std::setw(8) << "arg1"
       << std::setw(8) << "arg2"
       << std::setw(8) << "result"
       << "label\n";
    for (size_t i = 0; i < quads_table_.size(); ++i) {
        const auto& q = quads_table_[i];
        os << std::left << std::setw(7) << ("(" + std::to_string(i) + ")")
           << std::setw(8) << q.op
           << std::setw(8) << q.arg1
           << std::setw(8) << q.arg2
           << std::setw(8) << q.result;
        for (size_t j = 0; j < q.labels.size(); ++j) {
            if (j > 0) os << " ";
            os << q.labels[j];
        }
        os << "\n";
    }
    os << "\n";

    // 2. Triples Table
    os << "TRIPLES\n";
    os << std::left << std::setw(7) << "index"
       << std::setw(8) << "op"
       << std::setw(8) << "arg1"
       << std::setw(8) << "arg2"
       << "label\n";
    for (size_t i = 0; i < triples_table_.size(); ++i) {
        const auto& t = triples_table_[i];
        os << std::left << std::setw(7) << ("(" + std::to_string(i) + ")")
           << std::setw(8) << t.op
           << std::setw(8) << t.arg1
           << std::setw(8) << t.arg2;
        for (size_t j = 0; j < t.labels.size(); ++j) {
            if (j > 0) os << " ";
            os << t.labels[j];
        }
        os << "\n";
    }
    os << "\n";

    // 3. Indirect Triples Table
    os << "INDIRECT TRIPLES\n";
    os << std::left << std::setw(9) << "pointer"
       << "target\n";
    for (size_t i = 0; i < indirect_table_.pointers.size(); ++i) {
        os << std::left << std::setw(9) << (35 + i)
           << ("(" + std::to_string(indirect_table_.pointers[i]) + ")") << "\n";
    }
    os << "\n";

    // 4. Memory Summary Table
    os << "format           | entries | bytes\n";
    os << std::left << std::setw(17) << "quadruples" << "| "
       << std::setw(7) << quads_table_.size() << " | "
       << (quads_table_.size() * BYTES_PER_QUAD) << "\n";
    os << std::left << std::setw(17) << "triples" << "| "
       << std::setw(7) << triples_table_.size() << " | "
       << (triples_table_.size() * BYTES_PER_TRIPLE) << "\n";
    os << std::left << std::setw(17) << "indirect triples" << "| "
       << std::setw(7) << triples_table_.size() << " | "
       << (triples_table_.size() * BYTES_PER_INDIRECT) << "\n";
}

EditCost FormatsManager::applyEliminations(Format f,
                                          const std::vector<std::pair<int, int>>& pairs,
                                          const std::vector<Quad>& quads) {
    FormatsManager mgr(quads);

    if (f == Format::QUADRUPLES) {
        auto q_rows = mgr.quadruples();
        std::vector<bool> removed(q_rows.size(), false);
        EditCost cost;

        for (const auto& pair : pairs) {
            int remIdx = pair.first;
            int keepIdx = pair.second;
            if (remIdx < 0 || remIdx >= static_cast<int>(q_rows.size()) ||
                keepIdx < 0 || keepIdx >= static_cast<int>(q_rows.size())) {
                throw std::runtime_error("Invalid pair indices in applyEliminations");
            }
            removed[remIdx] = true;
            cost.instrsRemoved++;
            std::string remResult = q_rows[remIdx].result;
            std::string keepResult = q_rows[keepIdx].result;

            for (size_t i = 0; i < q_rows.size(); ++i) {
                if (removed[i]) continue;
                if (!remResult.empty() && q_rows[i].arg1 == remResult) {
                    q_rows[i].arg1 = keepResult;
                    cost.operandsRewritten++;
                }
                if (!remResult.empty() && q_rows[i].arg2 == remResult) {
                    q_rows[i].arg2 = keepResult;
                    cost.operandsRewritten++;
                }
            }
        }
        cost.survivingIndicesChanged = 0;
        return cost;
    }

    if (f == Format::TRIPLES) {
        for (const auto& q : quads) {
            if (q.op == OpType::IF_REL || q.op == OpType::ARRAY_STORE) {
                throw std::runtime_error("Error: --edit-demo requires 1-to-1 quad-to-triple mapping (no IF_REL or ARRAY_STORE allowed)");
            }
        }
        auto t_rows = mgr.triples();
        std::vector<bool> removed(t_rows.size(), false);
        EditCost cost;

        for (const auto& pair : pairs) {
            int remIdx = pair.first;
            int keepIdx = pair.second;
            if (remIdx < 0 || remIdx >= static_cast<int>(t_rows.size()) ||
                keepIdx < 0 || keepIdx >= static_cast<int>(t_rows.size())) {
                throw std::runtime_error("Invalid pair indices in applyEliminations");
            }
            removed[remIdx] = true;
            cost.instrsRemoved++;
            std::string remRef = "(" + std::to_string(remIdx) + ")";
            std::string keepRef = "(" + std::to_string(keepIdx) + ")";

            for (size_t i = 0; i < t_rows.size(); ++i) {
                if (removed[i]) continue;
                if (t_rows[i].arg1 == remRef) {
                    t_rows[i].arg1 = keepRef;
                    cost.operandsRewritten++;
                }
                if (t_rows[i].arg2 == remRef) {
                    t_rows[i].arg2 = keepRef;
                    cost.operandsRewritten++;
                }
            }
        }

        // Compaction phase: renumber surviving triples consecutively
        std::vector<int> old_to_new(t_rows.size(), -1);
        int new_idx = 0;
        for (size_t i = 0; i < t_rows.size(); ++i) {
            if (!removed[i]) {
                old_to_new[i] = new_idx;
                if (static_cast<int>(i) != new_idx) {
                    cost.survivingIndicesChanged++;
                }
                new_idx++;
            }
        }

        for (size_t i = 0; i < t_rows.size(); ++i) {
            if (removed[i]) continue;
            int ref_k = -1;
            if (parse_ref_index(t_rows[i].arg1, ref_k)) {
                if (ref_k >= 0 && ref_k < static_cast<int>(old_to_new.size())) {
                    int target_new = old_to_new[ref_k];
                    if (target_new != -1 && target_new != ref_k) {
                        t_rows[i].arg1 = "(" + std::to_string(target_new) + ")";
                        cost.operandsRewritten++;
                    }
                }
            }
            ref_k = -1;
            if (parse_ref_index(t_rows[i].arg2, ref_k)) {
                if (ref_k >= 0 && ref_k < static_cast<int>(old_to_new.size())) {
                    int target_new = old_to_new[ref_k];
                    if (target_new != -1 && target_new != ref_k) {
                        t_rows[i].arg2 = "(" + std::to_string(target_new) + ")";
                        cost.operandsRewritten++;
                    }
                }
            }
        }
        return cost;
    }

    if (f == Format::INDIRECT_TRIPLES) {
        for (const auto& q : quads) {
            if (q.op == OpType::IF_REL || q.op == OpType::ARRAY_STORE) {
                throw std::runtime_error("Error: --edit-demo requires 1-to-1 quad-to-triple mapping (no IF_REL or ARRAY_STORE allowed)");
            }
        }
        auto t_rows = mgr.triples();
        auto pointers = mgr.indirect_triples().pointers;
        EditCost cost;

        for (const auto& pair : pairs) {
            int remIdx = pair.first;
            int keepIdx = pair.second;
            cost.instrsRemoved++;

            // Remove pointer entry
            auto it = std::find(pointers.begin(), pointers.end(), remIdx);
            if (it != pointers.end()) {
                pointers.erase(it);
            }

            std::string remRef = "(" + std::to_string(remIdx) + ")";
            std::string keepRef = "(" + std::to_string(keepIdx) + ")";

            // Only active triples referenced by surviving pointers are updated
            for (int ptr : pointers) {
                if (ptr >= 0 && ptr < static_cast<int>(t_rows.size())) {
                    if (t_rows[ptr].arg1 == remRef) {
                        t_rows[ptr].arg1 = keepRef;
                        cost.operandsRewritten++;
                    }
                    if (t_rows[ptr].arg2 == remRef) {
                        t_rows[ptr].arg2 = keepRef;
                        cost.operandsRewritten++;
                    }
                }
            }
        }
        cost.survivingIndicesChanged = 0;
        return cost;
    }

    throw std::runtime_error("Unknown format in applyEliminations");
}

void FormatsManager::print_edit_demo(const EditCost& q_cost,
                                     const EditCost& t_cost,
                                     const EditCost& i_cost,
                                     std::ostream& os) {
    os << "edit                        | quadruples | triples | indirect triples\n";
    os << "instructions removed:       " << q_cost.instrsRemoved << " | " << t_cost.instrsRemoved << " | " << i_cost.instrsRemoved << "\n";
    os << "operand fields rewritten:   " << q_cost.operandsRewritten << " | " << t_cost.operandsRewritten << " | " << i_cost.operandsRewritten << "\n";
    os << "surviving indices changed:  " << q_cost.survivingIndicesChanged << " | " << t_cost.survivingIndicesChanged << " | " << i_cost.survivingIndicesChanged << "\n";
}

std::vector<std::pair<int, int>> parse_edit_pairs(const std::string& str) {
    std::vector<std::pair<int, int>> pairs;
    std::stringstream ss(str);
    std::string item;
    while (std::getline(ss, item, ',')) {
        if (item.empty()) continue;
        size_t colon = item.find(':');
        if (colon == std::string::npos) {
            throw std::runtime_error("Invalid edit pair format: " + item + " (expected removeIdx:keepIdx)");
        }
        int rem = std::stoi(item.substr(0, colon));
        int keep = std::stoi(item.substr(colon + 1));
        pairs.emplace_back(rem, keep);
    }
    return pairs;
}
