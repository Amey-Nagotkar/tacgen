#include "lexer.hpp"
#include "parser.hpp"
#include "tacgen.hpp"

#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "Usage: " << argv[0] << " <file.mini> [--tokens] [--ast] [--tac] [--formats] [--cfg out.dot] [--opt] [--ssa] [--metrics] [--live-out a,b,c] [--all]\n";
        return 1;
    }

    std::string filename;
    bool dump_tokens = false;
    bool dump_ast = false;
    bool dump_tac = false;

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--tokens") {
            dump_tokens = true;
        } else if (arg == "--ast") {
            dump_ast = true;
        } else if (arg == "--tac") {
            dump_tac = true;
        } else if (!arg.empty() && arg[0] == '-') {
            // Other CLI options to be handled in subsequent stages
        } else {
            if (filename.empty()) {
                filename = arg;
            }
        }
    }

    if (filename.empty()) {
        std::cerr << "Error: no input file specified.\n";
        return 1;
    }

    std::ifstream file(filename);
    if (!file.is_open()) {
        std::cerr << "Error: cannot open file '" << filename << "'\n";
        return 1;
    }

    std::stringstream buffer;
    buffer << file.rdbuf();
    std::string source = buffer.str();

    try {
        Lexer lexer(source);
        std::vector<Token> tokens = lexer.tokenize();

        if (dump_tokens) {
            print_token_table(tokens, std::cout);
            return 0;
        }

        Parser parser(std::move(tokens));
        auto ast = parser.parse_program();

        if (dump_ast) {
            ast->print(std::cout);
            return 0;
        }

        TACGenerator tacgen;
        tacgen.generate(*ast);

        if (dump_tac) {
            tacgen.print(std::cout);
            return 0;
        }
    } catch (const ParseError& ex) {
        std::cerr << ex.what() << "\n";
        return 1;
    } catch (const std::exception& ex) {
        std::cerr << "Error: " << ex.what() << "\n";
        return 1;
    }

    return 0;
}
