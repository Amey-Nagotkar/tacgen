#pragma once

#include <cctype>
#include <stdexcept>
#include <string>
#include <vector>

// Compiler concept: Three Address Code (TAC) Quadruple representation
// Each Quad represents an atomic instruction of the form:
// result = arg1 op arg2, or jumps/calls/returns.
// A label is NOT its own instruction; instead, labels attach to the target instruction.

enum class OpType {
    ASSIGN,       // x = y
    BINOP,        // x = y op z
    UNARY_MINUS,  // x = minus y
    IF_REL,       // if arg1 rel arg2 goto result
    GOTO,         // goto result
    PARAM,        // param arg1
    CALL,         // result = call arg1, arg2 (arg2 is param count)
    RETURN,       // return arg1 (arg1 optional)
    ARRAY_LOAD,   // result = arg1[arg2]
    ARRAY_STORE,  // result[arg1] = arg2
    NOP,          // nop
    PHI,          // result = phi(phiArgs...)
    EXIT_USE      // exit_use phiArgs...
};

struct Quad {
    OpType op = OpType::NOP;
    std::string arg1;
    std::string arg2;
    std::string result;
    std::string rel;
    std::vector<std::string> labels;
    int orig_idx = 0;
    std::vector<std::string> phiArgs;

    Quad() = default;
    Quad(OpType op, std::string a1 = "", std::string a2 = "", std::string res = "",
         std::string r = "", std::vector<std::string> lbls = {}, int o_idx = 0,
         std::vector<std::string> pArgs = {})
        : op(op), arg1(std::move(a1)), arg2(std::move(a2)), result(std::move(res)),
          rel(std::move(r)), labels(std::move(lbls)), orig_idx(o_idx), phiArgs(std::move(pArgs)) {}

    // Format the TAC instruction body (excluding label prefixes)
    std::string to_string() const {
        switch (op) {
            case OpType::ASSIGN:
                return result + " = " + arg1;
            case OpType::BINOP:
                return result + " = " + arg1 + " " + rel + " " + arg2;
            case OpType::UNARY_MINUS:
                return result + " = minus " + arg1;
            case OpType::IF_REL:
                return "if " + arg1 + " " + rel + " " + arg2 + " goto " + result;
            case OpType::GOTO:
                return "goto " + result;
            case OpType::PARAM:
                return "param " + arg1;
            case OpType::CALL:
                if (result.empty()) {
                    return "call " + arg1 + ", " + arg2;
                }
                return result + " = call " + arg1 + ", " + arg2;
            case OpType::RETURN:
                if (arg1.empty()) {
                    return "return";
                }
                return "return " + arg1;
            case OpType::ARRAY_LOAD:
                return result + " = " + arg1 + "[" + arg2 + "]";
            case OpType::ARRAY_STORE:
                return result + "[" + arg1 + "] = " + arg2;
            case OpType::NOP:
                return "nop";
            case OpType::PHI: {
                std::string s = result + " = phi(";
                for (size_t i = 0; i < phiArgs.size(); ++i) {
                    if (i > 0) s += ", ";
                    s += phiArgs[i];
                }
                s += ")";
                return s;
            }
            case OpType::EXIT_USE: {
                std::string s = "exit_use ";
                for (size_t i = 0; i < phiArgs.size(); ++i) {
                    if (i > 0) s += ", ";
                    s += phiArgs[i];
                }
                return s;
            }
        }
        return "";
    }
};

// =============================================================================
// Shared Helpers for Analysis and Optimization
// =============================================================================

// Matches temporary variable naming convention: ^t[0-9]+$
inline bool isTemp(const std::string& name) {
    if (name.size() < 2 || name[0] != 't') return false;
    for (size_t i = 1; i < name.size(); ++i) {
        if (!std::isdigit(static_cast<unsigned char>(name[i]))) return false;
    }
    return true;
}

// Matches integer literals (optionally signed): ^-?[0-9]+$
inline bool isLiteral(const std::string& name) {
    if (name.empty()) return false;
    size_t i = 0;
    if (name[0] == '-') {
        if (name.size() == 1) return false;
        i = 1;
    }
    for (; i < name.size(); ++i) {
        if (!std::isdigit(static_cast<unsigned char>(name[i]))) return false;
    }
    return true;
}

// Inverts relational operators: < <-> >=, <= <-> >, == <-> !=
inline std::string invert_relop(const std::string& relop) {
    if (relop == "<")  return ">=";
    if (relop == "<=") return ">";
    if (relop == ">")  return "<=";
    if (relop == ">=") return "<";
    if (relop == "==") return "!=";
    if (relop == "!=") return "==";
    throw std::runtime_error("Unknown relational operator: " + relop);
}

// Returns the scalar variable defined by the Quad, or empty string if none.
// (ARRAY_STORE defines memory element, not scalar variable).
inline std::string defOf(const Quad& q) {
    switch (q.op) {
        case OpType::ASSIGN:
        case OpType::BINOP:
        case OpType::UNARY_MINUS:
        case OpType::CALL:
        case OpType::ARRAY_LOAD:
        case OpType::PHI:
            return q.result;
        default:
            return "";
    }
}

// Returns mutable pointers to every operand that is a USE in the Quad.
// Non-empty operands are returned; callers filter literals using isLiteral().
inline std::vector<std::string*> usesOf(Quad& q) {
    std::vector<std::string*> res;
    auto add = [&](std::string& s) {
        if (!s.empty()) res.push_back(&s);
    };
    switch (q.op) {
        case OpType::IF_REL:
            add(q.arg1);
            add(q.arg2);
            break;
        case OpType::RETURN:
        case OpType::PARAM:
        case OpType::ASSIGN:
        case OpType::UNARY_MINUS:
            add(q.arg1);
            break;
        case OpType::BINOP:
            add(q.arg1);
            add(q.arg2);
            break;
        case OpType::ARRAY_LOAD:
            add(q.arg1);
            add(q.arg2);
            break;
        case OpType::ARRAY_STORE:
            add(q.result); // array identifier
            add(q.arg1);   // index
            add(q.arg2);   // value
            break;
        case OpType::PHI:
        case OpType::EXIT_USE:
            for (auto& arg : q.phiArgs) {
                add(arg);
            }
            break;
        case OpType::CALL:
        case OpType::GOTO:
        case OpType::NOP:
            break;
    }
    return res;
}

// Const overload of usesOf
inline std::vector<const std::string*> usesOf(const Quad& q) {
    std::vector<const std::string*> res;
    auto add = [&](const std::string& s) {
        if (!s.empty()) res.push_back(&s);
    };
    switch (q.op) {
        case OpType::IF_REL:
            add(q.arg1);
            add(q.arg2);
            break;
        case OpType::RETURN:
        case OpType::PARAM:
        case OpType::ASSIGN:
        case OpType::UNARY_MINUS:
            add(q.arg1);
            break;
        case OpType::BINOP:
            add(q.arg1);
            add(q.arg2);
            break;
        case OpType::ARRAY_LOAD:
            add(q.arg1);
            add(q.arg2);
            break;
        case OpType::ARRAY_STORE:
            add(q.result); // array identifier
            add(q.arg1);   // index
            add(q.arg2);   // value
            break;
        case OpType::PHI:
        case OpType::EXIT_USE:
            for (const auto& arg : q.phiArgs) {
                add(arg);
            }
            break;
        case OpType::CALL:
        case OpType::GOTO:
        case OpType::NOP:
            break;
    }
    return res;
}
