#pragma once

#include "tac.hpp"

#include <iostream>
#include <string>
#include <vector>

// Compiler concept: Control Flow Graph (CFG)
// A directed graph where nodes are maximal sequences of instructions with
// single-entry single-exit execution (Basic Blocks) and edges represent control flow.

struct Edge {
    int to;             // 1-based target block ID
    std::string label; // branch condition string (e.g. "i <= n") or empty for unconditional
    bool backEdge = false;
};

struct Block {
    int id = 0;          // 1-based block ID
    std::vector<std::string> labels;
    std::vector<Quad> instrs;
    int firstOrig = 0;  // 1-based original TAC number of first instruction
    int lastOrig = 0;   // 1-based original TAC number of last instruction
    std::vector<Edge> succ;
    std::vector<int> pred; // sorted by block id in ascending order
};

struct Cfg {
    std::vector<Block> blocks;

    void print_blocks(std::ostream& os) const;
    void print_dot(std::ostream& os) const;
    void write_dot_file(const std::string& filepath) const;
    void print_code(std::ostream& os) const;
};

// Shared block printer (exact format B1:\n    x = y\n)
void printBlockCode(const Cfg& cfg, std::ostream& os);

// Constructs the CFG, performs dead code/unreachable block elimination from B1,
// identifies retreating DFS back edges, and renumbers blocks consecutively.
Cfg buildCfg(const std::vector<Quad>& quads);
