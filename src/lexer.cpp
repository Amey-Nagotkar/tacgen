#include "lexer.hpp"

#include <cctype>
#include <iomanip>
#include <iostream>
#include <stdexcept>
#include <unordered_map>
#include <unordered_set>

// Compiler concept: Token Classification
// Maps token type enums to standard textual representation for debugging and reporting.
std::string token_type_to_string(TokenType type) {
    switch (type) {
        case TokenType::KEYWORD:      return "KEYWORD";
        case TokenType::ID:           return "ID";
        case TokenType::NUM:          return "NUM";
        case TokenType::RELOP:        return "RELOP";
        case TokenType::LOGOP:        return "LOGOP";
        case TokenType::ARITH_ASSIGN: return "ARITH/ASSIGN";
        case TokenType::DELIM:        return "DELIM";
        case TokenType::END_OF_FILE:  return "EOF";
    }
    return "UNKNOWN";
}

Lexer::Lexer(std::string source) : source_(std::move(source)) {}

char Lexer::peek(size_t offset) const {
    if (cursor_ + offset >= source_.size()) {
        return '\0';
    }
    return source_[cursor_ + offset];
}

char Lexer::advance() {
    if (is_at_end()) {
        return '\0';
    }
    return source_[cursor_++];
}

bool Lexer::is_at_end() const {
    return cursor_ >= source_.size();
}

// Compiler concept: Lexical Filtering
// Strips comments and whitespace characters, tracking line numbers for error reporting.
void Lexer::skip_whitespace_and_comments() {
    while (!is_at_end()) {
        char c = peek();
        if (c == ' ' || c == '\t' || c == '\r') {
            advance();
        } else if (c == '\n') {
            line_++;
            advance();
        } else if (c == '/' && peek(1) == '/') {
            // Line comment: consume until newline or end of file
            advance(); // '/'
            advance(); // '/'
            while (!is_at_end() && peek() != '\n') {
                advance();
            }
        } else {
            break;
        }
    }
}

// Compiler concept: Maximal Munch (Longest Match)
// Two-character operators (<=, >=, ==, !=, &&, ||) are prioritized over single-character operators.
// Keywords are prioritized over general identifiers.
Token Lexer::next_token() {
    skip_whitespace_and_comments();

    if (is_at_end()) {
        return Token{TokenType::END_OF_FILE, "", line_};
    }

    int token_line = line_;
    char c = peek();

    // 1. Two-character operators tried first
    if (c == '<' && peek(1) == '=') {
        advance(); advance();
        return Token{TokenType::RELOP, "<=", token_line};
    }
    if (c == '>' && peek(1) == '=') {
        advance(); advance();
        return Token{TokenType::RELOP, ">=", token_line};
    }
    if (c == '=' && peek(1) == '=') {
        advance(); advance();
        return Token{TokenType::RELOP, "==", token_line};
    }
    if (c == '!' && peek(1) == '=') {
        advance(); advance();
        return Token{TokenType::RELOP, "!=", token_line};
    }
    if (c == '&' && peek(1) == '&') {
        advance(); advance();
        return Token{TokenType::LOGOP, "&&", token_line};
    }
    if (c == '|' && peek(1) == '|') {
        advance(); advance();
        return Token{TokenType::LOGOP, "||", token_line};
    }

    // 2. Single-character relational & logical operators
    if (c == '<') {
        advance();
        return Token{TokenType::RELOP, "<", token_line};
    }
    if (c == '>') {
        advance();
        return Token{TokenType::RELOP, ">", token_line};
    }
    if (c == '!') {
        advance();
        return Token{TokenType::LOGOP, "!", token_line};
    }

    // 3. Single-character arithmetic and assignment operators
    if (c == '=') {
        advance();
        return Token{TokenType::ARITH_ASSIGN, "=", token_line};
    }
    if (c == '+' || c == '-' || c == '*' || c == '/') {
        advance();
        return Token{TokenType::ARITH_ASSIGN, std::string(1, c), token_line};
    }

    // 4. Delimiters
    if (c == '(' || c == ')' || c == '{' || c == '}' ||
        c == '[' || c == ']' || c == ';' || c == ',') {
        advance();
        return Token{TokenType::DELIM, std::string(1, c), token_line};
    }

    // 5. Numeric literals: [0-9]+
    if (std::isdigit(static_cast<unsigned char>(c))) {
        std::string num_str;
        while (!is_at_end() && std::isdigit(static_cast<unsigned char>(peek()))) {
            num_str += advance();
        }
        return Token{TokenType::NUM, num_str, token_line};
    }

    // 6. Identifiers and Keywords: [a-zA-Z_][a-zA-Z0-9_]*
    if (std::isalpha(static_cast<unsigned char>(c)) || c == '_') {
        std::string id_str;
        while (!is_at_end() && (std::isalnum(static_cast<unsigned char>(peek())) || peek() == '_')) {
            id_str += advance();
        }

        // Compiler concept: Keyword Reservation
        // Check if the identifier matches a reserved keyword.
        static const std::unordered_set<std::string> keywords = {
            "int", "if", "else", "while", "return"
        };

        if (keywords.find(id_str) != keywords.end()) {
            return Token{TokenType::KEYWORD, id_str, token_line};
        }
        return Token{TokenType::ID, id_str, token_line};
    }

    // Handle single & or | which are invalid in the mini-language
    if (c == '&') {
        advance();
        throw std::runtime_error("Lexer error at line " + std::to_string(token_line) +
                                 ": expected '&&', single '&' is not supported");
    }
    if (c == '|') {
        advance();
        throw std::runtime_error("Lexer error at line " + std::to_string(token_line) +
                                 ": expected '||', single '|' is not supported");
    }

    // Unrecognized character
    advance();
    throw std::runtime_error("Lexer error at line " + std::to_string(token_line) +
                             ": unrecognized character '" + std::string(1, c) + "'");
}

std::vector<Token> Lexer::tokenize() {
    std::vector<Token> tokens;
    while (true) {
        Token tok = next_token();
        tokens.push_back(tok);
        if (tok.type == TokenType::END_OF_FILE) {
            break;
        }
    }
    return tokens;
}

void print_token_table(const std::vector<Token>& tokens, std::ostream& os) {
    os << std::left << std::setw(6) << "LINE"
       << std::setw(15) << "CLASS"
       << "LEXEME\n";
    for (const auto& tok : tokens) {
        if (tok.type == TokenType::END_OF_FILE) {
            continue;
        }
        os << std::left << std::setw(6) << tok.line
           << std::setw(15) << tok.type_name()
           << tok.lexeme << "\n";
    }
}
