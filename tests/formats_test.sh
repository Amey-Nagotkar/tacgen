#!/usr/bin/env bash
set -e

# Compiler acceptance tests for intermediate representation formats and edit demo

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN="${1:-${PROJECT_ROOT}/build/tacgen}"

if [ ! -x "$BIN" ]; then
    echo "Error: tacgen binary not found at '$BIN'. Please build first."
    exit 1
fi

FAILURES=0

run_diff_test() {
    local test_name="$1"
    local cmd="$2"
    local expected_file="$3"

    local tmp_out
    tmp_out=$(mktemp)
    trap 'rm -f "$tmp_out"' EXIT

    set +e
    eval "$cmd" > "$tmp_out" 2>&1
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

echo "Running Formats and Edit-Demo acceptance tests..."

run_diff_test "Test 1 (bench/b3.mini --formats matches Stage-1 Tables 4-6)" \
    "\"$BIN\" \"${PROJECT_ROOT}/bench/b3.mini\" --formats" \
    "${PROJECT_ROOT}/tests/b3.formats.expected"

run_diff_test "Test 2 (bench/b3.mini --edit-demo matches Stage-2 Table 10)" \
    "\"$BIN\" \"${PROJECT_ROOT}/bench/b3.mini\" --edit-demo \"3:1,2:0\"" \
    "${PROJECT_ROOT}/tests/b3.edit_demo.expected"

run_diff_test "Test 3 (bench/b1.mini --formats: two triples for relop, summary bytes)" \
    "\"$BIN\" \"${PROJECT_ROOT}/bench/b1.mini\" --formats" \
    "${PROJECT_ROOT}/tests/b1.formats.expected"

run_diff_test "Test 4 (tests/t_misc.mini --formats: array store two triples, calls)" \
    "\"$BIN\" \"${PROJECT_ROOT}/tests/t_misc.mini\" --formats" \
    "${PROJECT_ROOT}/tests/t_misc.formats.expected"

echo "========================================="
if [ "$FAILURES" -eq 0 ]; then
    echo "All 4 formats acceptance tests passed!"
    echo "========================================="
    exit 0
else
    echo "$FAILURES formats acceptance test(s) failed."
    echo "========================================="
    exit 1
fi
