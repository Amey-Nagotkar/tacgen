#pragma once

#include "ast.hpp"
#include "tac.hpp"

#include <iostream>
#include <string>
#include <vector>

// Compiler concept: Syntax-Directed Translation into Three Address Code
// Traverses the AST to emit intermediate quadruples using newtemp() and newlabel()
// with inherited true/false labels and short-circuit jump code with fall-through.

class TACGenerator {
public:
    explicit TACGenerator();

    // Generate TAC quads from the program AST
    void generate(const ProgramAST& prog);

    // Accessors for generated intermediate representation and statistics
    const std::vector<Quad>& quads() const { return quads_; }
    int tempCount() const { return temp_counter_; }
    int labelCount() const { return label_counter_; }
    int temp_count() const { return temp_counter_; }
    int label_count() const { return label_counter_; }

    // Print formatted TAC listing to stream
    void print(std::ostream& os) const;

private:
    std::vector<Quad> quads_;
    std::vector<std::string> pending_labels_;
    int temp_counter_ = 0;
    int label_counter_ = 0;

    // Special label sentinel representing "fall through to the next instruction"
    static const std::string FALL;

    std::string newtemp();
    std::string newlabel();
    void attach_label(const std::string& label);
    void emit(Quad q);

    // Expression translation (evaluates AST and returns operand address)
    std::string gen_expr(const ExprAST& expr);

    // Statement translation
    void gen_stmt(const StmtAST& stmt);

    // Boolean condition translation with short-circuit jump code and fall-through
    void gen_bool(const BoolAST& cond, const std::string& true_label, const std::string& false_label);

    std::string invert_relop(const std::string& relop) const;
};
