#include "ast.hpp"

// Helper function to produce 2-space indentation per level
static std::string pad(int indent) {
    return std::string(indent, ' ');
}

// -----------------------------------------------------------------------------
// Arithmetic Expression Implementations
// -----------------------------------------------------------------------------
NumAST::NumAST(int line, int value) : ExprAST(line), value(value) {}
void NumAST::print(std::ostream& os, int indent) const {
    os << pad(indent) << "Num " << value << "\n";
}

VarAST::VarAST(int line, std::string name) : ExprAST(line), name(std::move(name)) {}
void VarAST::print(std::ostream& os, int indent) const {
    os << pad(indent) << "Var " << name << "\n";
}

ArrayRefAST::ArrayRefAST(int line, std::string name, std::unique_ptr<ExprAST> index)
    : ExprAST(line), name(std::move(name)), index(std::move(index)) {}
void ArrayRefAST::print(std::ostream& os, int indent) const {
    os << pad(indent) << "ArrayRef " << name << "\n";
    if (index) {
        index->print(os, indent + 2);
    }
}

CallAST::CallAST(int line, std::string name, std::vector<std::unique_ptr<ExprAST>> args)
    : ExprAST(line), name(std::move(name)), args(std::move(args)) {}
void CallAST::print(std::ostream& os, int indent) const {
    os << pad(indent) << "Call " << name << "\n";
    for (const auto& arg : args) {
        if (arg) {
            arg->print(os, indent + 2);
        }
    }
}

UnOpAST::UnOpAST(int line, std::string op, std::unique_ptr<ExprAST> operand)
    : ExprAST(line), op(std::move(op)), operand(std::move(operand)) {}
void UnOpAST::print(std::ostream& os, int indent) const {
    os << pad(indent) << "UnOp " << op << "\n";
    if (operand) {
        operand->print(os, indent + 2);
    }
}

BinOpAST::BinOpAST(int line, std::string op, std::unique_ptr<ExprAST> left, std::unique_ptr<ExprAST> right)
    : ExprAST(line), op(std::move(op)), left(std::move(left)), right(std::move(right)) {}
void BinOpAST::print(std::ostream& os, int indent) const {
    os << pad(indent) << "BinOp " << op << "\n";
    if (left) {
        left->print(os, indent + 2);
    }
    if (right) {
        right->print(os, indent + 2);
    }
}

// -----------------------------------------------------------------------------
// Boolean Expression Implementations
// -----------------------------------------------------------------------------
RelOpAST::RelOpAST(int line, std::string op, std::unique_ptr<ExprAST> left, std::unique_ptr<ExprAST> right)
    : BoolAST(line), op(std::move(op)), left(std::move(left)), right(std::move(right)) {}
void RelOpAST::print(std::ostream& os, int indent) const {
    os << pad(indent) << "RelOp " << op << "\n";
    if (left) {
        left->print(os, indent + 2);
    }
    if (right) {
        right->print(os, indent + 2);
    }
}

AndAST::AndAST(int line, std::unique_ptr<BoolAST> left, std::unique_ptr<BoolAST> right)
    : BoolAST(line), left(std::move(left)), right(std::move(right)) {}
void AndAST::print(std::ostream& os, int indent) const {
    os << pad(indent) << "And\n";
    if (left) {
        left->print(os, indent + 2);
    }
    if (right) {
        right->print(os, indent + 2);
    }
}

OrAST::OrAST(int line, std::unique_ptr<BoolAST> left, std::unique_ptr<BoolAST> right)
    : BoolAST(line), left(std::move(left)), right(std::move(right)) {}
void OrAST::print(std::ostream& os, int indent) const {
    os << pad(indent) << "Or\n";
    if (left) {
        left->print(os, indent + 2);
    }
    if (right) {
        right->print(os, indent + 2);
    }
}

NotAST::NotAST(int line, std::unique_ptr<BoolAST> operand)
    : BoolAST(line), operand(std::move(operand)) {}
void NotAST::print(std::ostream& os, int indent) const {
    os << pad(indent) << "Not\n";
    if (operand) {
        operand->print(os, indent + 2);
    }
}

// -----------------------------------------------------------------------------
// Statement Implementations (prints line numbers only for statement nodes)
// -----------------------------------------------------------------------------
ProgramAST::ProgramAST(int line, std::vector<std::unique_ptr<StmtAST>> stmts)
    : StmtAST(line), stmts(std::move(stmts)) {}
void ProgramAST::print(std::ostream& os, int indent) const {
    os << pad(indent) << "Program (line " << line << ")\n";
    for (const auto& s : stmts) {
        if (s) {
            s->print(os, indent + 2);
        }
    }
}

BlockAST::BlockAST(int line, std::vector<std::unique_ptr<StmtAST>> stmts)
    : StmtAST(line), stmts(std::move(stmts)) {}
void BlockAST::print(std::ostream& os, int indent) const {
    os << pad(indent) << "Block (line " << line << ")\n";
    for (const auto& s : stmts) {
        if (s) {
            s->print(os, indent + 2);
        }
    }
}

DeclAST::DeclAST(int line, std::string name)
    : StmtAST(line), name(std::move(name)) {}
void DeclAST::print(std::ostream& os, int indent) const {
    os << pad(indent) << "Decl " << name << " (line " << line << ")\n";
}

AssignAST::AssignAST(int line, std::string name, std::unique_ptr<ExprAST> rhs)
    : StmtAST(line), name(std::move(name)), rhs(std::move(rhs)) {}
void AssignAST::print(std::ostream& os, int indent) const {
    os << pad(indent) << "Assign " << name << " (line " << line << ")\n";
    if (rhs) {
        rhs->print(os, indent + 2);
    }
}

ArrayAssignAST::ArrayAssignAST(int line, std::string name, std::unique_ptr<ExprAST> index, std::unique_ptr<ExprAST> rhs)
    : StmtAST(line), name(std::move(name)), index(std::move(index)), rhs(std::move(rhs)) {}
void ArrayAssignAST::print(std::ostream& os, int indent) const {
    os << pad(indent) << "ArrayAssign " << name << " (line " << line << ")\n";
    if (index) {
        index->print(os, indent + 2);
    }
    if (rhs) {
        rhs->print(os, indent + 2);
    }
}

IfAST::IfAST(int line, std::unique_ptr<BoolAST> cond, std::unique_ptr<StmtAST> then_stmt, std::unique_ptr<StmtAST> else_stmt)
    : StmtAST(line), cond(std::move(cond)), then_stmt(std::move(then_stmt)), else_stmt(std::move(else_stmt)) {}
void IfAST::print(std::ostream& os, int indent) const {
    os << pad(indent) << "If (line " << line << ")\n";
    if (cond) {
        cond->print(os, indent + 2);
    }
    if (then_stmt) {
        then_stmt->print(os, indent + 2);
    }
    if (else_stmt) {
        else_stmt->print(os, indent + 2);
    }
}

WhileAST::WhileAST(int line, std::unique_ptr<BoolAST> cond, std::unique_ptr<StmtAST> body)
    : StmtAST(line), cond(std::move(cond)), body(std::move(body)) {}
void WhileAST::print(std::ostream& os, int indent) const {
    os << pad(indent) << "While (line " << line << ")\n";
    if (cond) {
        cond->print(os, indent + 2);
    }
    if (body) {
        body->print(os, indent + 2);
    }
}

ReturnAST::ReturnAST(int line, std::unique_ptr<ExprAST> expr)
    : StmtAST(line), expr(std::move(expr)) {}
void ReturnAST::print(std::ostream& os, int indent) const {
    os << pad(indent) << "Return (line " << line << ")\n";
    if (expr) {
        expr->print(os, indent + 2);
    }
}
