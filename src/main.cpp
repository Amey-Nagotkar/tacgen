#include "cfg.hpp"
#include "formats.hpp"
#include "lexer.hpp"
#include "opt.hpp"
#include "parser.hpp"
#include "tacgen.hpp"

#include <fstream>
#include <iostream>
#include <set>
#include <sstream>
#include <string>
#include <vector>

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "Usage: " << argv[0] << " <file.mini> [--tokens] [--ast] [--tac] [--formats] [--blocks] [--cfg out.dot] [--edit-demo \"R:K,R:K\"] [--opt] [--ssa] [--metrics] [--live-out a,b,c] [--all]\n";
        return 1;
    }

    std::string filename;
    bool dump_tokens = false;
    bool dump_ast = false;
    bool dump_tac = false;
    bool dump_formats = false;
    bool dump_blocks = false;
    bool dump_opt = false;
    bool has_live_out = false;
    std::set<std::string> user_live_out;
    std::string cfg_dot_file;
    std::string edit_demo_arg;

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--tokens") {
            dump_tokens = true;
        } else if (arg == "--ast") {
            dump_ast = true;
        } else if (arg == "--tac") {
            dump_tac = true;
        } else if (arg == "--formats") {
            dump_formats = true;
        } else if (arg == "--blocks") {
            dump_blocks = true;
        } else if (arg == "--opt") {
            dump_opt = true;
        } else if (arg == "--live-out") {
            if (i + 1 < argc) {
                has_live_out = true;
                std::string list_str = argv[++i];
                std::stringstream ss(list_str);
                std::string item;
                while (std::getline(ss, item, ',')) {
                    if (!item.empty()) user_live_out.insert(item);
                }
            } else {
                std::cerr << "Error: --live-out requires variable list\n";
                return 1;
            }
        } else if (arg.rfind("--live-out=", 0) == 0) {
            has_live_out = true;
            std::string list_str = arg.substr(11);
            std::stringstream ss(list_str);
            std::string item;
            while (std::getline(ss, item, ',')) {
                if (!item.empty()) user_live_out.insert(item);
            }
        } else if (arg == "--cfg") {
            if (i + 1 < argc) {
                cfg_dot_file = argv[++i];
            } else {
                std::cerr << "Error: --cfg requires output filename\n";
                return 1;
            }
        } else if (arg.rfind("--cfg=", 0) == 0) {
            cfg_dot_file = arg.substr(6);
        } else if (arg == "--edit-demo") {
            if (i + 1 < argc) {
                edit_demo_arg = argv[++i];
            } else {
                std::cerr << "Error: --edit-demo requires argument \"R:K,R:K\"\n";
                return 1;
            }
        } else if (arg.rfind("--edit-demo=", 0) == 0) {
            edit_demo_arg = arg.substr(12);
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

        if (dump_formats) {
            FormatsManager fm(tacgen.quads());
            fm.print_formats(std::cout);
            return 0;
        }

        if (!edit_demo_arg.empty()) {
            auto pairs = parse_edit_pairs(edit_demo_arg);
            EditCost q_cost = FormatsManager::applyEliminations(Format::QUADRUPLES, pairs, tacgen.quads());
            EditCost t_cost = FormatsManager::applyEliminations(Format::TRIPLES, pairs, tacgen.quads());
            EditCost i_cost = FormatsManager::applyEliminations(Format::INDIRECT_TRIPLES, pairs, tacgen.quads());
            FormatsManager::print_edit_demo(q_cost, t_cost, i_cost, std::cout);
            return 0;
        }

        if (dump_blocks || !cfg_dot_file.empty()) {
            Cfg cfg = buildCfg(tacgen.quads());
            if (dump_blocks) {
                cfg.print_blocks(std::cout);
            }
            if (!cfg_dot_file.empty()) {
                cfg.write_dot_file(cfg_dot_file);
            }
            return 0;
        }

        if (dump_opt) {
            Cfg cfg = buildCfg(tacgen.quads());
            OptResult opt_res = optimize(std::move(cfg), user_live_out, has_live_out);
            opt_res.print(std::cout);
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
