#!/usr/bin/env bash
set -e

# Compiler acceptance test for Lexer module
# Runs tacgen --tokens on bench/b1.mini and diffs against tests/b1.tokens.expected

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN="${1:-${PROJECT_ROOT}/build/tacgen}"

if [ ! -x "$BIN" ]; then
    echo "Error: tacgen binary not found at '$BIN'. Please build the project first."
    exit 1
fi

TMP_OUT="$(mktemp)"
trap 'rm -f "$TMP_OUT"' EXIT

"$BIN" "${PROJECT_ROOT}/bench/b1.mini" --tokens > "$TMP_OUT"

if diff -u "${PROJECT_ROOT}/tests/b1.tokens.expected" "$TMP_OUT"; then
    echo "[PASS] lexer_test: bench/b1.mini tokens matched expected output exactly."
    exit 0
else
    echo "[FAIL] lexer_test: token mismatch detected."
    exit 1
fi
