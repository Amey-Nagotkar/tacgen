#pragma once

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
    NOP           // nop
};

struct Quad {
    OpType op;
    std::string arg1;
    std::string arg2;
    std::string result;
    std::string rel;
    std::vector<std::string> labels;

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
        }
        return "";
    }
};
