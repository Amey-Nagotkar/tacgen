#pragma once

#include "tac.hpp"

#include <iostream>
#include <string>
#include <utility>
#include <vector>

// =============================================================================
// Memory Model Specification
// op = 1 byte, each operand or result or index = 4 bytes, pointer = 4 bytes.
// - bytesQuad     = 13 * (#quads)        (op + 3 fields)
// - bytesTriple   =  9 * (#triples)      (op + 2 fields)
// - bytesIndirect = 13 * (#triples)      (triple 9 + one pointer 4 per entry)
// Labels and printed text are excluded.
// =============================================================================
constexpr int BYTES_OP = 1;
constexpr int BYTES_FIELD = 4;
constexpr int BYTES_PTR = 4;

constexpr int BYTES_PER_QUAD = 13;      // 1 + 4*3
constexpr int BYTES_PER_TRIPLE = 9;     // 1 + 4*2
constexpr int BYTES_PER_INDIRECT = 13;  // 9 + 4

enum class Format {
    QUADRUPLES,
    TRIPLES,
    INDIRECT_TRIPLES
};

struct QuadrupleRow {
    std::string op;
    std::string arg1;
    std::string arg2;
    std::string result;
    std::vector<std::string> labels;
};

struct TripleRow {
    std::string op;
    std::string arg1;
    std::string arg2;
    std::vector<std::string> labels;
};

struct IndirectTriples {
    std::vector<TripleRow> triples;
    std::vector<int> pointers; // 0-based indices into triples
};

struct EditCost {
    int instrsRemoved = 0;
    int operandsRewritten = 0;
    int survivingIndicesChanged = 0;
};

class FormatsManager {
public:
    explicit FormatsManager(const std::vector<Quad>& quads);

    const std::vector<QuadrupleRow>& quadruples() const { return quads_table_; }
    const std::vector<TripleRow>& triples() const { return triples_table_; }
    const IndirectTriples& indirect_triples() const { return indirect_table_; }

    void print_formats(std::ostream& os) const;

    static EditCost applyEliminations(Format f,
                                      const std::vector<std::pair<int, int>>& pairs,
                                      const std::vector<Quad>& quads);

    static void print_edit_demo(const EditCost& q_cost,
                                const EditCost& t_cost,
                                const EditCost& i_cost,
                                std::ostream& os);

private:
    std::vector<QuadrupleRow> quads_table_;
    std::vector<TripleRow> triples_table_;
    IndirectTriples indirect_table_;

    void build_quadruples(const std::vector<Quad>& quads);
    void build_triples(const std::vector<Quad>& quads);
    void build_indirect();
};

std::vector<std::pair<int, int>> parse_edit_pairs(const std::string& str);
