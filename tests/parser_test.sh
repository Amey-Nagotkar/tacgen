#!/usr/bin/env bash
set -e

# Compiler acceptance tests for Parser module

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN="${1:-${PROJECT_ROOT}/build/tacgen}"

if [ ! -x "$BIN" ]; then
    echo "Error: tacgen binary not found at '$BIN'. Please build first."
    exit 1
fi

FAILURES=0

run_test() {
    local test_name="$1"
    local cmd="$2"
    local check_fn="$3"

    set +e
    local output
    output=$(eval "$cmd" 2>&1)
    local status=$?
    set -e

    if eval "$check_fn \"\$status\" \"\$output\""; then
        echo "[PASS] $test_name"
    else
        echo "[FAIL] $test_name"
        echo "Output was:"
        echo "$output"
        FAILURES=$((FAILURES + 1))
    fi
}

# Test 1: bench/b1.mini
check_t1() {
    local status="$1"
    local out="$2"
    [ "$status" -eq 0 ] || return 1
    echo "$out" | grep -q "While (line 4)" || return 1
    echo "$out" | grep -q "RelOp <=" || return 1
    echo "$out" | grep -q "Var i" || return 1
    echo "$out" | grep -q "Var n" || return 1
    echo "$out" | grep -q "Block (line 4)" || return 1
    echo "$out" | grep -q "Assign s (line 5)" || return 1
    echo "$out" | grep -q "Assign i (line 6)" || return 1
    echo "$out" | grep -q "Return (line 8)" || return 1
    return 0
}
run_test "Test 1 (b1.mini: while relop, block assigns, return)" \
    "\"$BIN\" \"${PROJECT_ROOT}/bench/b1.mini\" --ast" check_t1

# Test 2: bench/b3.mini
check_t2() {
    local status="$1"
    local out="$2"
    [ "$status" -eq 0 ] || return 1
    # Check that root RHS is BinOp +, children are BinOp *, UnOp - applied to Var c
    echo "$out" | grep -q "BinOp +" || return 1
    echo "$out" | grep -q "BinOp \*" || return 1
    echo "$out" | grep -q "UnOp -" || return 1
    echo "$out" | grep -q "Var c" || return 1
    # Check that minus does not cover b * c (BinOp * should be above UnOp -)
    local binop_pos unop_pos
    binop_pos=$(echo "$out" | grep -n "BinOp \*" | head -n 1 | cut -d: -f1)
    unop_pos=$(echo "$out" | grep -n "UnOp -" | head -n 1 | cut -d: -f1)
    [ "$binop_pos" -lt "$unop_pos" ] || return 1
    return 0
}
run_test "Test 2 (b3.mini: precedence of unary minus vs multiplication)" \
    "\"$BIN\" \"${PROJECT_ROOT}/bench/b3.mini\" --ast" check_t2

# Test 3: bench/b2.mini
check_t3() {
    local status="$1"
    local out="$2"
    [ "$status" -eq 0 ] || return 1
    local assign_count
    assign_count=$(echo "$out" | grep -c "Assign ")
    [ "$assign_count" -eq 6 ] || return 1
    return 0
}
run_test "Test 3 (b2.mini: parses six assigns without error)" \
    "\"$BIN\" \"${PROJECT_ROOT}/bench/b2.mini\" --ast" check_t3

# Test 4: tests/p_prec.mini (x = a - b - c; -> ((a - b) - c))
check_t4() {
    local status="$1"
    local out="$2"
    [ "$status" -eq 0 ] || return 1
    # In ((a - b) - c), the outer BinOp - has left child (BinOp - (Var a, Var b)) and right child Var c.
    # Therefore, line with second BinOp - has deeper indentation (6 spaces) than first BinOp - (4 spaces).
    echo "$out" | grep -q "    BinOp -" || return 1
    echo "$out" | grep -q "      BinOp -" || return 1
    echo "$out" | grep -q "        Var a" || return 1
    echo "$out" | grep -q "        Var b" || return 1
    echo "$out" | grep -q "      Var c" || return 1
    return 0
}
run_test "Test 4 (p_prec.mini: left-associativity ((a - b) - c))" \
    "\"$BIN\" \"${PROJECT_ROOT}/tests/p_prec.mini\" --ast" check_t4

# Test 5: tests/p_paren.mini
check_t5() {
    local status="$1"
    local out="$2"
    [ "$status" -eq 0 ] || return 1
    echo "$out" | grep -q "While (line 1)" || return 1
    echo "$out" | grep -q "And" || return 1
    echo "$out" | grep -q "RelOp <" || return 1
    echo "$out" | grep -q "BinOp +" || return 1
    echo "$out" | grep -q "Not" || return 1
    echo "$out" | grep -q "RelOp ==" || return 1
    return 0
}
run_test "Test 5 (p_paren.mini: parenthesis disambiguation in condition)" \
    "\"$BIN\" \"${PROJECT_ROOT}/tests/p_paren.mini\" --ast" check_t5

# Test 6: tests/p_else.mini
check_t6() {
    local status="$1"
    local out="$2"
    [ "$status" -eq 0 ] || return 1
    # Check that inner If contains both Assign x = 1 and Assign x = 2
    echo "$out" | grep -q "  If (line 1)" || return 1
    echo "$out" | grep -q "    If (line 1)" || return 1
    echo "$out" | grep -q "      Assign x (line 1)" || return 1
    return 0
}
run_test "Test 6 (p_else.mini: dangling else binds to inner if)" \
    "\"$BIN\" \"${PROJECT_ROOT}/tests/p_else.mini\" --ast" check_t6

# Test 7: tests/p_array.mini
check_t7() {
    local status="$1"
    local out="$2"
    [ "$status" -eq 0 ] || return 1
    echo "$out" | grep -q "Decl arr (line 1)" || return 1
    echo "$out" | grep -q "ArrayAssign arr (line 1)" || return 1
    echo "$out" | grep -q "ArrayRef arr" || return 1
    echo "$out" | grep -q "Call f" || return 1
    return 0
}
run_test "Test 7 (p_array.mini: array indexing, array assignment, calls)" \
    "\"$BIN\" \"${PROJECT_ROOT}/tests/p_array.mini\" --ast" check_t7

# Test 8: tests/p_bad.mini
check_t8() {
    local status="$1"
    local out="$2"
    # Exit code must be non-zero
    [ "$status" -ne 0 ] || return 1
    # Error message must contain line number and expected/found
    echo "$out" | grep -q "syntax error at line 1" || return 1
    return 0
}
run_test "Test 8 (p_bad.mini: syntax error on 'x = ;' with non-zero exit)" \
    "\"$BIN\" \"${PROJECT_ROOT}/tests/p_bad.mini\" --ast" check_t8

if [ "$FAILURES" -eq 0 ]; then
    echo "========================================="
    echo "All 8 parser acceptance tests passed!"
    echo "========================================="
    exit 0
else
    echo "========================================="
    echo "$FAILURES parser acceptance test(s) failed."
    echo "========================================="
    exit 1
fi
