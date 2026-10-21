#include "parser.hpp"

#include <utility>

Parser::Parser(std::vector<Token> tokens) : tokens_(std::move(tokens)) {}

const Token& Parser::peek(size_t offset) const {
    if (cursor_ + offset >= tokens_.size()) {
        return tokens_.back(); // END_OF_FILE sentinel
    }
    return tokens_[cursor_ + offset];
}

const Token& Parser::previous() const {
    if (cursor_ == 0) {
        return tokens_.front();
    }
    return tokens_[cursor_ - 1];
}

bool Parser::is_at_end() const {
    return peek().type == TokenType::END_OF_FILE;
}

const Token& Parser::advance() {
    if (!is_at_end()) {
        cursor_++;
    }
    return previous();
}

bool Parser::check(TokenType type) const {
    return peek().type == type;
}

bool Parser::match(TokenType type) {
    if (check(type)) {
        advance();
        return true;
    }
    return false;
}

bool Parser::check_keyword(const std::string& kw) const {
    return peek().type == TokenType::KEYWORD && peek().lexeme == kw;
}

bool Parser::match_keyword(const std::string& kw) {
    if (check_keyword(kw)) {
        advance();
        return true;
    }
    return false;
}

bool Parser::check_delim(char c) const {
    return peek().type == TokenType::DELIM && peek().lexeme.size() == 1 && peek().lexeme[0] == c;
}

bool Parser::match_delim(char c) {
    if (check_delim(c)) {
        advance();
        return true;
    }
    return false;
}

// Compiler concept: Operator Disambiguation
// The lexer classifies all arithmetic and assignment operators as ARITH/ASSIGN.
// The parser disambiguates based on grammar position and operator lexeme.
bool Parser::is_assign(const Token& tok) const {
    return tok.type == TokenType::ARITH_ASSIGN && tok.lexeme == "=";
}

bool Parser::match_assign() {
    if (is_assign(peek())) {
        advance();
        return true;
    }
    return false;
}

bool Parser::is_arith_op(const Token& tok) const {
    if (tok.type != TokenType::ARITH_ASSIGN) return false;
    const std::string& lex = tok.lexeme;
    return lex == "+" || lex == "-" || lex == "*" || lex == "/";
}

bool Parser::is_arith_op(const Token& tok, const std::string& op) const {
    return tok.type == TokenType::ARITH_ASSIGN && tok.lexeme == op;
}

bool Parser::match_arith_op(const std::string& op) {
    if (is_arith_op(peek(), op)) {
        advance();
        return true;
    }
    return false;
}

bool Parser::is_relop(const Token& tok) const {
    return tok.type == TokenType::RELOP;
}

bool Parser::match_relop() {
    if (is_relop(peek())) {
        advance();
        return true;
    }
    return false;
}

bool Parser::is_logop(const Token& tok, const std::string& op) const {
    return tok.type == TokenType::LOGOP && tok.lexeme == op;
}

bool Parser::match_logop(const std::string& op) {
    if (is_logop(peek(), op)) {
        advance();
        return true;
    }
    return false;
}

std::string Parser::token_found_description(const Token& tok) const {
    if (tok.type == TokenType::END_OF_FILE) {
        return "EOF";
    }
    return "'" + tok.lexeme + "'";
}

void Parser::error(const std::string& expected_desc) {
    const Token& tok = peek();
    throw ParseError(tok.line, expected_desc, token_found_description(tok));
}

// -----------------------------------------------------------------------------
// Program and Statement Parsing
// -----------------------------------------------------------------------------
std::unique_ptr<ProgramAST> Parser::parse_program() {
    int prog_line = peek().line;
    std::vector<std::unique_ptr<StmtAST>> stmts;
    while (!is_at_end()) {
        stmts.push_back(parse_statement());
    }
    return std::make_unique<ProgramAST>(prog_line, std::move(stmts));
}

std::unique_ptr<StmtAST> Parser::parse_statement() {
    if (check_keyword("int")) {
        return parse_decl();
    }
    if (check_delim('{')) {
        return parse_block();
    }
    if (check_keyword("if")) {
        return parse_if();
    }
    if (check_keyword("while")) {
        return parse_while();
    }
    if (check_keyword("return")) {
        return parse_return();
    }
    if (check(TokenType::ID)) {
        return parse_id_statement();
    }

    error("expected statement");
}

std::unique_ptr<StmtAST> Parser::parse_decl() {
    advance(); // consume 'int'
    if (!check(TokenType::ID)) {
        error("expected identifier after 'int'");
    }
    Token id_tok = advance();
    if (!match_delim(';')) {
        error("expected ';'");
    }
    return std::make_unique<DeclAST>(id_tok.line, id_tok.lexeme);
}

std::unique_ptr<StmtAST> Parser::parse_block() {
    int block_line = peek().line;
    advance(); // consume '{'
    std::vector<std::unique_ptr<StmtAST>> stmts;
    while (!check_delim('}') && !is_at_end()) {
        stmts.push_back(parse_statement());
    }
    if (!match_delim('}')) {
        error("expected '}'");
    }
    return std::make_unique<BlockAST>(block_line, std::move(stmts));
}

// Compiler concept: Dangling-Else Disambiguation
// An optional 'else' matches the innermost open 'if' because parse_statement()
// eagerly checks for 'else' immediately after completing the then-statement.
std::unique_ptr<StmtAST> Parser::parse_if() {
    int if_line = peek().line;
    advance(); // consume 'if'
    if (!match_delim('(')) {
        error("expected '(' after 'if'");
    }
    auto cond = parse_bool();
    if (!match_delim(')')) {
        error("expected ')' after if condition");
    }
    auto then_stmt = parse_statement();
    std::unique_ptr<StmtAST> else_stmt = nullptr;
    if (match_keyword("else")) {
        else_stmt = parse_statement();
    }
    return std::make_unique<IfAST>(if_line, std::move(cond), std::move(then_stmt), std::move(else_stmt));
}

std::unique_ptr<StmtAST> Parser::parse_while() {
    int while_line = peek().line;
    advance(); // consume 'while'
    if (!match_delim('(')) {
        error("expected '(' after 'while'");
    }
    auto cond = parse_bool();
    if (!match_delim(')')) {
        error("expected ')' after while condition");
    }
    auto body = parse_statement();
    return std::make_unique<WhileAST>(while_line, std::move(cond), std::move(body));
}

std::unique_ptr<StmtAST> Parser::parse_return() {
    int ret_line = peek().line;
    advance(); // consume 'return'
    auto expr = parse_expr();
    if (!match_delim(';')) {
        error("expected ';'");
    }
    return std::make_unique<ReturnAST>(ret_line, std::move(expr));
}

std::unique_ptr<StmtAST> Parser::parse_id_statement() {
    Token id_tok = advance();
    if (match_delim('[')) {
        // id[E] = E;
        auto index = parse_expr();
        if (!match_delim(']')) {
            error("expected ']'");
        }
        if (!match_assign()) {
            error("expected '=' after ']'");
        }
        auto rhs = parse_expr();
        if (!match_delim(';')) {
            error("expected ';'");
        }
        return std::make_unique<ArrayAssignAST>(id_tok.line, id_tok.lexeme, std::move(index), std::move(rhs));
    }
    if (match_assign()) {
        // id = E;
        auto rhs = parse_expr();
        if (!match_delim(';')) {
            error("expected ';'");
        }
        return std::make_unique<AssignAST>(id_tok.line, id_tok.lexeme, std::move(rhs));
    }
    error("expected '=' or '[' after identifier");
}

// -----------------------------------------------------------------------------
// Arithmetic Expression Parsing
// -----------------------------------------------------------------------------
std::unique_ptr<ExprAST> Parser::parse_expr() {
    return parse_additive();
}

// Compiler concept: Left-Associative Elimination of Left Recursion
// Grammar production E -> E + T | E - T | T is converted into an iterative loop:
// T ((+|-) T)*, naturally building left-leaning AST binary nodes ((a - b) - c).
std::unique_ptr<ExprAST> Parser::parse_additive() {
    auto left = parse_multiplicative();
    while (is_arith_op(peek(), "+") || is_arith_op(peek(), "-")) {
        Token op_tok = advance();
        auto right = parse_multiplicative();
        left = std::make_unique<BinOpAST>(op_tok.line, op_tok.lexeme, std::move(left), std::move(right));
    }
    return left;
}

std::unique_ptr<ExprAST> Parser::parse_multiplicative() {
    auto left = parse_unary();
    while (is_arith_op(peek(), "*") || is_arith_op(peek(), "/")) {
        Token op_tok = advance();
        auto right = parse_unary();
        left = std::make_unique<BinOpAST>(op_tok.line, op_tok.lexeme, std::move(left), std::move(right));
    }
    return left;
}

// Compiler concept: Unary Minus vs Subtraction Disambiguation
// A '-' encountered at the start of an operand expression is parsed as unary negation,
// which has higher precedence than multiplication/division.
std::unique_ptr<ExprAST> Parser::parse_unary() {
    if (match_arith_op("-")) {
        Token op_tok = previous();
        auto operand = parse_unary();
        return std::make_unique<UnOpAST>(op_tok.line, "-", std::move(operand));
    }
    return parse_primary();
}

std::unique_ptr<ExprAST> Parser::parse_primary() {
    if (check(TokenType::NUM)) {
        Token num_tok = advance();
        int val = std::stoi(num_tok.lexeme);
        return std::make_unique<NumAST>(num_tok.line, val);
    }
    if (check(TokenType::ID)) {
        Token id_tok = advance();
        if (match_delim('(')) {
            // Function call: id(args)
            std::vector<std::unique_ptr<ExprAST>> args;
            if (!check_delim(')')) {
                while (true) {
                    args.push_back(parse_expr());
                    if (match_delim(',')) {
                        continue;
                    }
                    break;
                }
            }
            if (!match_delim(')')) {
                error("expected ')' after arguments");
            }
            return std::make_unique<CallAST>(id_tok.line, id_tok.lexeme, std::move(args));
        }
        if (match_delim('[')) {
            // Array reference: id[E]
            auto index = parse_expr();
            if (!match_delim(']')) {
                error("expected ']'");
            }
            return std::make_unique<ArrayRefAST>(id_tok.line, id_tok.lexeme, std::move(index));
        }
        // Variable identifier (free input or declared variable)
        return std::make_unique<VarAST>(id_tok.line, id_tok.lexeme);
    }
    if (match_delim('(')) {
        auto expr = parse_expr();
        if (!match_delim(')')) {
            error("expected ')'");
        }
        return expr;
    }

    error("expected expression");
}

// -----------------------------------------------------------------------------
// Boolean Expression Parsing
// -----------------------------------------------------------------------------
std::unique_ptr<BoolAST> Parser::parse_bool() {
    return parse_bool_or();
}

std::unique_ptr<BoolAST> Parser::parse_bool_or() {
    auto left = parse_bool_and();
    while (match_logop("||")) {
        Token op_tok = previous();
        auto right = parse_bool_and();
        left = std::make_unique<OrAST>(op_tok.line, std::move(left), std::move(right));
    }
    return left;
}

std::unique_ptr<BoolAST> Parser::parse_bool_and() {
    auto left = parse_bool_not();
    while (match_logop("&&")) {
        Token op_tok = previous();
        auto right = parse_bool_not();
        left = std::make_unique<AndAST>(op_tok.line, std::move(left), std::move(right));
    }
    return left;
}

std::unique_ptr<BoolAST> Parser::parse_bool_not() {
    if (match_logop("!")) {
        Token op_tok = previous();
        auto operand = parse_bool_not();
        return std::make_unique<NotAST>(op_tok.line, std::move(operand));
    }
    return parse_bool_atom();
}

// Compiler concept: Backtracking / Parenthesis Disambiguation in Boolean Context
// A leading '(' can represent either:
// 1. A parenthesized boolean expression: e.g. (a < b || c < d)
// 2. A parenthesized arithmetic subexpression in a relational comparison: e.g. (a + b) < c
// We solve this by saving the token cursor, speculatively attempting to parse a complete
// parenthesized boolean expression, and verifying that the closing ')' is NOT followed by
// an arithmetic or relational operator. If any condition fails, we backtrack to the saved
// cursor position and parse as a relational comparison (E relop E).
std::unique_ptr<BoolAST> Parser::parse_bool_atom() {
    if (check_delim('(')) {
        size_t saved_cursor = cursor_;
        try {
            advance(); // consume '('
            auto b = parse_bool_or();
            if (check_delim(')')) {
                advance(); // consume ')'
                // Check if this closing parenthesis is followed by an operator indicating
                // that what we just parsed was actually part of an arithmetic operand (e.g. (a + b) < c).
                if (!is_relop(peek()) && !is_arith_op(peek())) {
                    return b;
                }
            }
        } catch (const ParseError&) {
            // Speculative boolean parse failed, backtrack to parse as relational comparison
        }
        cursor_ = saved_cursor;
    }

    auto left = parse_expr();
    if (!is_relop(peek())) {
        error("expected relational operator (<, <=, >, >=, ==, !=)");
    }
    Token op_tok = advance();
    auto right = parse_expr();
    return std::make_unique<RelOpAST>(op_tok.line, op_tok.lexeme, std::move(left), std::move(right));
}
