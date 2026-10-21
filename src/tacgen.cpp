#include "tacgen.hpp"

#include <stdexcept>

const std::string TACGenerator::FALL = "@FALL";

TACGenerator::TACGenerator() = default;

std::string TACGenerator::newtemp() {
    temp_counter_++;
    return "t" + std::to_string(temp_counter_);
}

std::string TACGenerator::newlabel() {
    label_counter_++;
    return "L" + std::to_string(label_counter_);
}

void TACGenerator::attach_label(const std::string& label) {
    if (label != FALL && !label.empty()) {
        pending_labels_.push_back(label);
    }
}

void TACGenerator::emit(Quad q) {
    if (!pending_labels_.empty()) {
        q.labels = std::move(pending_labels_);
        pending_labels_.clear();
    }
    quads_.push_back(std::move(q));
}

std::string TACGenerator::invert_relop(const std::string& relop) const {
    if (relop == "<")  return ">=";
    if (relop == "<=") return ">";
    if (relop == ">")  return "<=";
    if (relop == ">=") return "<";
    if (relop == "==") return "!=";
    if (relop == "!=") return "==";
    throw std::runtime_error("Unknown relational operator: " + relop);
}

// -----------------------------------------------------------------------------
// Expression Translation
// -----------------------------------------------------------------------------
std::string TACGenerator::gen_expr(const ExprAST& expr) {
    if (auto num = dynamic_cast<const NumAST*>(&expr)) {
        return std::to_string(num->value);
    }
    if (auto var = dynamic_cast<const VarAST*>(&expr)) {
        return var->name;
    }
    if (auto bin = dynamic_cast<const BinOpAST*>(&expr)) {
        std::string l = gen_expr(*bin->left);
        std::string r = gen_expr(*bin->right);
        std::string t = newtemp();
        emit(Quad{OpType::BINOP, l, r, t, bin->op, {}});
        return t;
    }
    if (auto un = dynamic_cast<const UnOpAST*>(&expr)) {
        std::string x = gen_expr(*un->operand);
        std::string t = newtemp();
        emit(Quad{OpType::UNARY_MINUS, x, "", t, "", {}});
        return t;
    }
    if (auto arr = dynamic_cast<const ArrayRefAST*>(&expr)) {
        std::string idx = gen_expr(*arr->index);
        std::string t = newtemp();
        emit(Quad{OpType::ARRAY_LOAD, arr->name, idx, t, "", {}});
        return t;
    }
    if (auto call = dynamic_cast<const CallAST*>(&expr)) {
        std::vector<std::string> arg_addrs;
        arg_addrs.reserve(call->args.size());
        for (const auto& a : call->args) {
            arg_addrs.push_back(gen_expr(*a));
        }
        for (const auto& a : arg_addrs) {
            emit(Quad{OpType::PARAM, a, "", "", "", {}});
        }
        std::string t = newtemp();
        emit(Quad{OpType::CALL, call->name, std::to_string(arg_addrs.size()), t, "", {}});
        return t;
    }
    throw std::runtime_error("Unknown expression node in TAC generation");
}

// -----------------------------------------------------------------------------
// Boolean Condition Translation (Short-Circuit Jump Code with Fall-Through)
// -----------------------------------------------------------------------------
void TACGenerator::gen_bool(const BoolAST& cond, const std::string& true_label, const std::string& false_label) {
    if (auto rel = dynamic_cast<const RelOpAST*>(&cond)) {
        std::string x = gen_expr(*rel->left);
        std::string y = gen_expr(*rel->right);
        if (true_label != FALL && false_label != FALL) {
            emit(Quad{OpType::IF_REL, x, y, true_label, rel->op, {}});
            emit(Quad{OpType::GOTO, "", "", false_label, "", {}});
        } else if (false_label == FALL) {
            emit(Quad{OpType::IF_REL, x, y, true_label, rel->op, {}});
        } else if (true_label == FALL) {
            emit(Quad{OpType::IF_REL, x, y, false_label, invert_relop(rel->op), {}});
        }
        return;
    }
    if (auto a = dynamic_cast<const AndAST*>(&cond)) {
        std::string b1_false = (false_label == FALL ? newlabel() : false_label);
        std::string b1_true = FALL;
        gen_bool(*a->left, b1_true, b1_false);
        gen_bool(*a->right, true_label, false_label);
        if (false_label == FALL) {
            attach_label(b1_false);
        }
        return;
    }
    if (auto o = dynamic_cast<const OrAST*>(&cond)) {
        std::string b1_true = (true_label == FALL ? newlabel() : true_label);
        std::string b1_false = FALL;
        gen_bool(*o->left, b1_true, b1_false);
        gen_bool(*o->right, true_label, false_label);
        if (true_label == FALL) {
            attach_label(b1_true);
        }
        return;
    }
    if (auto n = dynamic_cast<const NotAST*>(&cond)) {
        gen_bool(*n->operand, false_label, true_label);
        return;
    }
    throw std::runtime_error("Unknown boolean node in TAC generation");
}

// -----------------------------------------------------------------------------
// Statement Translation
// -----------------------------------------------------------------------------
void TACGenerator::gen_stmt(const StmtAST& stmt) {
    if (dynamic_cast<const DeclAST*>(&stmt)) {
        // Variable declaration emits no executable TAC instruction
        return;
    }
    if (auto assign = dynamic_cast<const AssignAST*>(&stmt)) {
        std::string addr = gen_expr(*assign->rhs);
        emit(Quad{OpType::ASSIGN, addr, "", assign->name, "", {}});
        return;
    }
    if (auto arr_assign = dynamic_cast<const ArrayAssignAST*>(&stmt)) {
        std::string idx = gen_expr(*arr_assign->index);
        std::string val = gen_expr(*arr_assign->rhs);
        emit(Quad{OpType::ARRAY_STORE, idx, val, arr_assign->name, "", {}});
        return;
    }
    if (auto ret = dynamic_cast<const ReturnAST*>(&stmt)) {
        std::string addr = gen_expr(*ret->expr);
        emit(Quad{OpType::RETURN, addr, "", "", "", {}});
        return;
    }
    if (auto block = dynamic_cast<const BlockAST*>(&stmt)) {
        for (const auto& s : block->stmts) {
            if (s) {
                gen_stmt(*s);
            }
        }
        return;
    }
    if (auto w = dynamic_cast<const WhileAST*>(&stmt)) {
        std::string begin = newlabel();
        std::string next = newlabel();
        attach_label(begin);
        gen_bool(*w->cond, FALL, next);
        gen_stmt(*w->body);
        emit(Quad{OpType::GOTO, "", "", begin, "", {}});
        attach_label(next);
        return;
    }
    if (auto i = dynamic_cast<const IfAST*>(&stmt)) {
        if (!i->else_stmt) {
            std::string next = newlabel();
            gen_bool(*i->cond, FALL, next);
            gen_stmt(*i->then_stmt);
            attach_label(next);
        } else {
            std::string else_lbl = newlabel();
            std::string next = newlabel();
            gen_bool(*i->cond, FALL, else_lbl);
            gen_stmt(*i->then_stmt);
            emit(Quad{OpType::GOTO, "", "", next, "", {}});
            attach_label(else_lbl);
            gen_stmt(*i->else_stmt);
            attach_label(next);
        }
        return;
    }
    throw std::runtime_error("Unknown statement node in TAC generation");
}

void TACGenerator::generate(const ProgramAST& prog) {
    quads_.clear();
    pending_labels_.clear();
    temp_counter_ = 0;
    label_counter_ = 0;

    for (const auto& s : prog.stmts) {
        if (s) {
            gen_stmt(*s);
        }
    }

    // Pending labels at end of program attach to a final NOP
    if (!pending_labels_.empty()) {
        emit(Quad{OpType::NOP, "", "", "", "", {}});
    }
}

void TACGenerator::print(std::ostream& os) const {
    for (size_t i = 0; i < quads_.size(); ++i) {
        os << (i + 1) << ": ";
        for (const auto& lbl : quads_[i].labels) {
            os << lbl << ": ";
        }
        os << quads_[i].to_string() << "\n";
    }
    os << "instructions=" << quads_.size()
       << " temporaries=" << temp_counter_
       << " labels=" << label_counter_ << "\n";
}
