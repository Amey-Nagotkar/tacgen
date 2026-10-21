#pragma once

#include "ast.hpp"
#include "lexer.hpp"

#include <memory>
#include <stdexcept>
#include <string>
#include <vector>

// Compiler concept: Syntax Error Reporting
// Specialized exception thrown during parsing that captures the line number
// and formatted diagnostic message according to compiler specifications.
class ParseError : public std::runtime_error {
public:
    int line;
    ParseError(int line, const std::string& expected, const std::string& found)
        : std::runtime_error("syntax error at line " + std::to_string(line) + ": " + expected + ", found " + found),
          line(line) {}
};

// Compiler concept: Recursive Descent Parsing
// A top-down parsing technique where grammar productions are mapped to mutually
// recursive functions. Left recursion is eliminated via iterative loops to preserve
// left associativity.
class Parser {
public:
    explicit Parser(std::vector<Token> tokens);

    std::unique_ptr<ProgramAST> parse_program();

private:
    std::vector<Token> tokens_;
    size_t cursor_ = 0;

    const Token& peek(size_t offset = 0) const;
    const Token& previous() const;
    bool is_at_end() const;
    const Token& advance();

    bool check(TokenType type) const;
    bool match(TokenType type);
    bool check_keyword(const std::string& kw) const;
    bool match_keyword(const std::string& kw);
    bool check_delim(char c) const;
    bool match_delim(char c);

    // Operator helpers recognizing tokens by position and lexeme
    bool is_assign(const Token& tok) const;
    bool match_assign();
    bool is_arith_op(const Token& tok) const;
    bool is_arith_op(const Token& tok, const std::string& op) const;
    bool match_arith_op(const std::string& op);
    bool is_relop(const Token& tok) const;
    bool match_relop();
    bool is_logop(const Token& tok, const std::string& op) const;
    bool match_logop(const std::string& op);

    std::string token_found_description(const Token& tok) const;
    [[noreturn]] void error(const std::string& expected_desc);

    // Statement grammar productions
    std::unique_ptr<StmtAST> parse_statement();
    std::unique_ptr<StmtAST> parse_decl();
    std::unique_ptr<StmtAST> parse_block();
    std::unique_ptr<StmtAST> parse_if();
    std::unique_ptr<StmtAST> parse_while();
    std::unique_ptr<StmtAST> parse_return();
    std::unique_ptr<StmtAST> parse_id_statement();

    // Arithmetic expression grammar productions (precedence levels)
    std::unique_ptr<ExprAST> parse_expr();
    std::unique_ptr<ExprAST> parse_additive();
    std::unique_ptr<ExprAST> parse_multiplicative();
    std::unique_ptr<ExprAST> parse_unary();
    std::unique_ptr<ExprAST> parse_primary();

    // Boolean expression grammar productions
    std::unique_ptr<BoolAST> parse_bool();
    std::unique_ptr<BoolAST> parse_bool_or();
    std::unique_ptr<BoolAST> parse_bool_and();
    std::unique_ptr<BoolAST> parse_bool_not();
    std::unique_ptr<BoolAST> parse_bool_atom();
};
