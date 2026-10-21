#!/usr/bin/env bash
set -e

# Compiler acceptance tests for Basic Blocks and CFG module

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

echo "Running CFG and Basic Blocks acceptance tests..."

# Test 1: bench/b1.mini --blocks
run_diff_test "Test 1 (bench/b1.mini: 4 blocks, back edge B3->B2)" \
    "\"$BIN\" \"${PROJECT_ROOT}/bench/b1.mini\" --blocks" \
    "${PROJECT_ROOT}/tests/b1.blocks.expected"

# Test 2: bench/b3.mini --blocks
run_diff_test "Test 2 (bench/b3.mini: single block [1-6], 0 edges)" \
    "\"$BIN\" \"${PROJECT_ROOT}/bench/b3.mini\" --blocks" \
    "${PROJECT_ROOT}/tests/b3.blocks.expected"

# Test 3: tests/t_and.mini --blocks
run_diff_test "Test 3 (tests/t_and.mini: 5 blocks, 6 edges, 0 back edges)" \
    "\"$BIN\" \"${PROJECT_ROOT}/tests/t_and.mini\" --blocks" \
    "${PROJECT_ROOT}/tests/t_and.blocks.expected"

# Test 4: tests/t_or.mini --blocks
run_diff_test "Test 4 (tests/t_or.mini: 4 blocks, 5 edges, 0 back edges)" \
    "\"$BIN\" \"${PROJECT_ROOT}/tests/t_or.mini\" --blocks" \
    "${PROJECT_ROOT}/tests/t_or.blocks.expected"

# Test 5: tests/c_unreach.mini unreachable block warning and removal
test_5() {
    local test_name="Test 5 (c_unreach.mini: warning on stderr and unreachable block removal)"
    local tmp_out tmp_err
    tmp_out=$(mktemp)
    tmp_err=$(mktemp)
    trap 'rm -f "$tmp_out" "$tmp_err"' EXIT

    set +e
    "$BIN" "${PROJECT_ROOT}/tests/c_unreach.mini" --blocks > "$tmp_out" 2> "$tmp_err"
    local status=$?
    set -e

    if [ "$status" -ne 0 ]; then
        echo "[FAIL] $test_name (exit code $status)"
        FAILURES=$((FAILURES + 1))
        return
    fi

    if grep -q "warning: removed unreachable block B2 (instrs 3-3)" "$tmp_err" && \
       grep -q "blocks=1 edges=0" "$tmp_out"; then
        echo "[PASS] $test_name"
    else
        echo "[FAIL] $test_name"
        echo "Stderr was: $(cat "$tmp_err")"
        echo "Stdout was: $(cat "$tmp_out")"
        FAILURES=$((FAILURES + 1))
    fi
}
test_5

# Test 6: Graphviz dot generation and png compilation
test_6() {
    local test_name="Test 6 (Graphviz dot output and compilation to PNG)"
    local tmp_dir
    tmp_dir="${PROJECT_ROOT}/out"
    mkdir -p "$tmp_dir"

    set +e
    "$BIN" "${PROJECT_ROOT}/bench/b1.mini" --cfg "${tmp_dir}/b1.dot" && \
        dot -Tpng "${tmp_dir}/b1.dot" -o "${tmp_dir}/b1.png"
    local status=$?
    set -e

    if [ "$status" -eq 0 ] && [ -s "${tmp_dir}/b1.png" ]; then
        echo "[PASS] $test_name"
    else
        echo "[FAIL] $test_name"
        FAILURES=$((FAILURES + 1))
    fi
}
test_6

echo "========================================="
if [ "$FAILURES" -eq 0 ]; then
    echo "All 6 CFG acceptance tests passed!"
    echo "========================================="
    exit 0
else
    echo "$FAILURES CFG acceptance test(s) failed."
    echo "========================================="
    exit 1
fi
