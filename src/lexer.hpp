#pragma once

#include <string>
#include <vector>
#include <iosfwd>

// Compiler concept: Lexical Analysis (Scanning)
// Converts an input stream of characters into a sequence of atomic units called Tokens.
// Whitespace and comments are eliminated at this stage.

enum class TokenType {
    KEYWORD,      // int, if, else, while, return
    ID,           // variable/function identifiers
    NUM,          // integer numeric literals
    RELOP,        // relational operators: <, <=, >, >=, ==, !=
    LOGOP,        // logical operators: &&, ||, !
    ARITH_ASSIGN, // arithmetic operators (+, -, *, /) and assignment (=)
    DELIM,        // delimiters: (, ), {, }, [, ], ;, ,
    END_OF_FILE   // end-of-file sentinel
};

// String representation for token classes (e.g., for diagnostic/table output)
std::string token_type_to_string(TokenType type);

struct Token {
    TokenType type;
    std::string lexeme;
    int line;

    std::string type_name() const {
        return token_type_to_string(type);
    }

    // Helper query methods for cleaner recursive descent parser implementation
    bool is(TokenType t) const { return type == t; }
    bool is(TokenType t, const std::string& lex) const { return type == t && lexeme == lex; }
    bool is_keyword(const std::string& kw) const { return type == TokenType::KEYWORD && lexeme == kw; }
    bool is_delim(char c) const { return type == TokenType::DELIM && lexeme.size() == 1 && lexeme[0] == c; }
    bool is_assign() const { return type == TokenType::ARITH_ASSIGN && lexeme == "="; }
    bool is_arith() const {
        return type == TokenType::ARITH_ASSIGN &&
               (lexeme == "+" || lexeme == "-" || lexeme == "*" || lexeme == "/");
    }
};

class Lexer {
public:
    explicit Lexer(std::string source);

    // Get the next token from the input stream
    Token next_token();

    // Scan all tokens until END_OF_FILE, returning the complete token list
    std::vector<Token> tokenize();

private:
    std::string source_;
    size_t cursor_ = 0;
    int line_ = 1;

    char peek(size_t offset = 0) const;
    char advance();
    bool is_at_end() const;
    void skip_whitespace_and_comments();
};

// Format and print the token sequence as a formatted table
void print_token_table(const std::vector<Token>& tokens, std::ostream& os);
