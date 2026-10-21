#!/usr/bin/env bash
set -e

# Compiler acceptance tests for TAC generation module

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN="${1:-${TACGEN:-${PROJECT_ROOT}/build/tacgen}}"

if [ ! -x "$BIN" ]; then
    echo "Error: tacgen binary not found at '$BIN'. Please build first."
    exit 1
fi

FAILURES=0

run_diff_test() {
    local test_name="$1"
    local input_file="$2"
    local expected_file="$3"

    local tmp_out
    tmp_out=$(mktemp)
    trap 'rm -f "$tmp_out"' EXIT

    set +e
    "$BIN" "$input_file" --tac > "$tmp_out" 2>&1
    local status=$?
    set -e

    if [ "$status" -ne 0 ]; then
        echo "[FAIL] $test_name (non-zero exit status $status)"
        cat "$tmp_out"
        FAILURES=$((FAILURES + 1))
        return
    fi

    if diff -u "$expected_file" "$tmp_out"; then
        echo "[PASS] $test_name"
    else
        echo "[FAIL] $test_name (diff mismatch)"
        FAILURES=$((FAILURES + 1))
    fi
}

echo "Running TAC generation acceptance tests..."
run_diff_test "Test 1 (bench/b1.mini: while loop with relop, assigns, return)" \
    "${PROJECT_ROOT}/bench/b1.mini" "${PROJECT_ROOT}/tests/b1.tac.expected"

run_diff_test "Test 2 (bench/b3.mini: unary minus and multiplication)" \
    "${PROJECT_ROOT}/bench/b3.mini" "${PROJECT_ROOT}/tests/b3.tac.expected"

run_diff_test "Test 3 (bench/b2.mini: 12 instructions unoptimized)" \
    "${PROJECT_ROOT}/bench/b2.mini" "${PROJECT_ROOT}/tests/b2.tac.expected"

run_diff_test "Test 4 (tests/t_and.mini: short-circuit and jump code)" \
    "${PROJECT_ROOT}/tests/t_and.mini" "${PROJECT_ROOT}/tests/t_and.tac.expected"

run_diff_test "Test 5 (tests/t_or.mini: short-circuit or jump code)" \
    "${PROJECT_ROOT}/tests/t_or.mini" "${PROJECT_ROOT}/tests/t_or.tac.expected"

run_diff_test "Test 6 (tests/t_misc.mini: array load/store and calls)" \
    "${PROJECT_ROOT}/tests/t_misc.mini" "${PROJECT_ROOT}/tests/t_misc.tac.expected"

echo "========================================="
if [ "$FAILURES" -eq 0 ]; then
    echo "All 6 TAC acceptance tests passed!"
    echo "========================================="
    exit 0
else
    echo "$FAILURES TAC acceptance test(s) failed."
    echo "========================================="
    exit 1
fi
