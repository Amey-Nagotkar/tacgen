#pragma once

#include <iostream>
#include <memory>
#include <string>
#include <vector>

// Compiler concept: Abstract Syntax Tree (AST)
// The AST is a structural, hierarchical representation of the source program that
// abstracts away concrete syntax details (like punctuation and delimiters) while
// preserving the syntactic and semantic structure for analysis and code generation.

class ASTNode {
public:
    int line;
    explicit ASTNode(int line) : line(line) {}
    virtual ~ASTNode() = default;
    virtual void print(std::ostream& os, int indent = 0) const = 0;
};

// -----------------------------------------------------------------------------
// Arithmetic Expression AST Nodes
// -----------------------------------------------------------------------------
class ExprAST : public ASTNode {
public:
    using ASTNode::ASTNode;
};

class NumAST : public ExprAST {
public:
    int value;
    NumAST(int line, int value);
    void print(std::ostream& os, int indent = 0) const override;
};

class VarAST : public ExprAST {
public:
    std::string name;
    VarAST(int line, std::string name);
    void print(std::ostream& os, int indent = 0) const override;
};

class ArrayRefAST : public ExprAST {
public:
    std::string name;
    std::unique_ptr<ExprAST> index;
    ArrayRefAST(int line, std::string name, std::unique_ptr<ExprAST> index);
    void print(std::ostream& os, int indent = 0) const override;
};

class CallAST : public ExprAST {
public:
    std::string name;
    std::vector<std::unique_ptr<ExprAST>> args;
    CallAST(int line, std::string name, std::vector<std::unique_ptr<ExprAST>> args);
    void print(std::ostream& os, int indent = 0) const override;
};

class UnOpAST : public ExprAST {
public:
    std::string op;
    std::unique_ptr<ExprAST> operand;
    UnOpAST(int line, std::string op, std::unique_ptr<ExprAST> operand);
    void print(std::ostream& os, int indent = 0) const override;
};

class BinOpAST : public ExprAST {
public:
    std::string op;
    std::unique_ptr<ExprAST> left;
    std::unique_ptr<ExprAST> right;
    BinOpAST(int line, std::string op, std::unique_ptr<ExprAST> left, std::unique_ptr<ExprAST> right);
    void print(std::ostream& os, int indent = 0) const override;
};

// -----------------------------------------------------------------------------
// Boolean Expression AST Nodes (used exclusively in if / while conditions)
// -----------------------------------------------------------------------------
class BoolAST : public ASTNode {
public:
    using ASTNode::ASTNode;
};

class RelOpAST : public BoolAST {
public:
    std::string op;
    std::unique_ptr<ExprAST> left;
    std::unique_ptr<ExprAST> right;
    RelOpAST(int line, std::string op, std::unique_ptr<ExprAST> left, std::unique_ptr<ExprAST> right);
    void print(std::ostream& os, int indent = 0) const override;
};

class AndAST : public BoolAST {
public:
    std::unique_ptr<BoolAST> left;
    std::unique_ptr<BoolAST> right;
    AndAST(int line, std::unique_ptr<BoolAST> left, std::unique_ptr<BoolAST> right);
    void print(std::ostream& os, int indent = 0) const override;
};

class OrAST : public BoolAST {
public:
    std::unique_ptr<BoolAST> left;
    std::unique_ptr<BoolAST> right;
    OrAST(int line, std::unique_ptr<BoolAST> left, std::unique_ptr<BoolAST> right);
    void print(std::ostream& os, int indent = 0) const override;
};

class NotAST : public BoolAST {
public:
    std::unique_ptr<BoolAST> operand;
    NotAST(int line, std::unique_ptr<BoolAST> operand);
    void print(std::ostream& os, int indent = 0) const override;
};

// -----------------------------------------------------------------------------
// Statement AST Nodes
// -----------------------------------------------------------------------------
class StmtAST : public ASTNode {
public:
    using ASTNode::ASTNode;
};

class ProgramAST : public StmtAST {
public:
    std::vector<std::unique_ptr<StmtAST>> stmts;
    ProgramAST(int line, std::vector<std::unique_ptr<StmtAST>> stmts);
    void print(std::ostream& os, int indent = 0) const override;
};

class BlockAST : public StmtAST {
public:
    std::vector<std::unique_ptr<StmtAST>> stmts;
    BlockAST(int line, std::vector<std::unique_ptr<StmtAST>> stmts);
    void print(std::ostream& os, int indent = 0) const override;
};

class DeclAST : public StmtAST {
public:
    std::string name;
    DeclAST(int line, std::string name);
    void print(std::ostream& os, int indent = 0) const override;
};

class AssignAST : public StmtAST {
public:
    std::string name;
    std::unique_ptr<ExprAST> rhs;
    AssignAST(int line, std::string name, std::unique_ptr<ExprAST> rhs);
    void print(std::ostream& os, int indent = 0) const override;
};

class ArrayAssignAST : public StmtAST {
public:
    std::string name;
    std::unique_ptr<ExprAST> index;
    std::unique_ptr<ExprAST> rhs;
    ArrayAssignAST(int line, std::string name, std::unique_ptr<ExprAST> index, std::unique_ptr<ExprAST> rhs);
    void print(std::ostream& os, int indent = 0) const override;
};

class IfAST : public StmtAST {
public:
    std::unique_ptr<BoolAST> cond;
    std::unique_ptr<StmtAST> then_stmt;
    std::unique_ptr<StmtAST> else_stmt;
    IfAST(int line, std::unique_ptr<BoolAST> cond, std::unique_ptr<StmtAST> then_stmt, std::unique_ptr<StmtAST> else_stmt = nullptr);
    void print(std::ostream& os, int indent = 0) const override;
};

class WhileAST : public StmtAST {
public:
    std::unique_ptr<BoolAST> cond;
    std::unique_ptr<StmtAST> body;
    WhileAST(int line, std::unique_ptr<BoolAST> cond, std::unique_ptr<StmtAST> body);
    void print(std::ostream& os, int indent = 0) const override;
};

class ReturnAST : public StmtAST {
public:
    std::unique_ptr<ExprAST> expr;
    ReturnAST(int line, std::unique_ptr<ExprAST> expr);
    void print(std::ostream& os, int indent = 0) const override;
};
