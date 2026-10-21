#!/usr/bin/env bash
set -e

# Optimizer and Liveness Acceptance Tests
TACGEN="./build/tacgen"

if [ ! -f "$TACGEN" ]; then
    echo "Error: tacgen executable not found at $TACGEN. Build first."
    exit 1
fi

echo "Running Optimizer and Liveness acceptance tests..."

# ------------------------------------------------------------------------------
# Test 1: bench/b2.mini --opt --live-out y,z,w,u
# "Instrs after" column is exactly 12,12,12,12,12,6,4.
# Final code: B1: y = 23 / z = a << 3 / w = b + c / u = w. Temporaries remaining: 0.
# ------------------------------------------------------------------------------
OUT_B2=$(mktemp)
"$TACGEN" bench/b2.mini --opt --live-out y,z,w,u > "$OUT_B2"
diff -u tests/b2.opt.expected "$OUT_B2"
rm -f "$OUT_B2"
echo "[PASS] Test 1 (bench/b2.mini --opt --live-out: 12,12,12,12,12,6,4, 0 temps remaining)"

# ------------------------------------------------------------------------------
# Test 2: bench/b3.mini --opt
# Column 6,6,6,6,6,4,3. Final code: B1: t1 = minus c / t2 = b * t1 / a = t2 + t2.
# ------------------------------------------------------------------------------
OUT_B3=$(mktemp)
"$TACGEN" bench/b3.mini --opt > "$OUT_B3"
diff -u tests/b3.opt.expected "$OUT_B3"
rm -f "$OUT_B3"
echo "[PASS] Test 2 (bench/b3.mini --opt: 6,6,6,6,6,4,3, CSE and copy prop and coalescing)"

# ------------------------------------------------------------------------------
# Test 3: bench/b1.mini --opt
# Column 10,10,10,10,10,10,8. Final code:
# B1: s = 0 / i = 1 ; B2 (labels L1): if i > n goto L2 ;
# B3: t1 = i << 1 / s = s + t1 / i = i + 1 / goto L1 ; B4 (labels L2): return s.
# ------------------------------------------------------------------------------
OUT_B1=$(mktemp)
"$TACGEN" bench/b1.mini --opt > "$OUT_B1"
diff -u tests/b1.opt.expected "$OUT_B1"
rm -f "$OUT_B1"
echo "[PASS] Test 3 (bench/b1.mini --opt: 10,10,10,10,10,10,8, multi-block loop CFG)"

# ------------------------------------------------------------------------------
# Test 4: tests/o_kill.mini
# x = a + b; a = 5; y = a + b;
# The two additions must NOT be merged.
# Final code: x = a + b / a = 5 / y = 5 + b (3 instrs, column 5,5,5,5,5,5,3).
# ------------------------------------------------------------------------------
OUT_KILL=$(mktemp)
"$TACGEN" tests/o_kill.mini --opt > "$OUT_KILL"
diff -u tests/o_kill.opt.expected "$OUT_KILL"
rm -f "$OUT_KILL"
echo "[PASS] Test 4 (tests/o_kill.mini: redefinition kills CSE, 5,5,5,5,5,5,3)"

# ------------------------------------------------------------------------------
# Test 5: tests/o_div0.mini
# x = 5 / 0; y = x + 1;
# Warning is printed to stderr, exit status 0, no crash, and t1 = 5 / 0 appears.
# ------------------------------------------------------------------------------
OUT_DIV0=$(mktemp)
ERR_DIV0=$(mktemp)
set +e
"$TACGEN" tests/o_div0.mini --opt > "$OUT_DIV0" 2> "$ERR_DIV0"
STATUS=$?
set -e

if [ $STATUS -ne 0 ]; then
    echo "[FAIL] Test 5 exited with non-zero status: $STATUS"
    rm -f "$OUT_DIV0" "$ERR_DIV0"
    exit 1
fi

if ! grep -q "warning: constant division by zero at instruction 1, fold skipped" "$ERR_DIV0"; then
    echo "[FAIL] Test 5 expected division by zero warning on stderr. Got:"
    cat "$ERR_DIV0"
    rm -f "$OUT_DIV0" "$ERR_DIV0"
    exit 1
fi

if ! grep -q "t1 = 5 / 0" "$OUT_DIV0"; then
    echo "[FAIL] Test 5 expected instruction 't1 = 5 / 0' to still appear in final code. Got:"
    cat "$OUT_DIV0"
    rm -f "$OUT_DIV0" "$ERR_DIV0"
    exit 1
fi

rm -f "$OUT_DIV0" "$ERR_DIV0"
echo "[PASS] Test 5 (tests/o_div0.mini: division by zero warning, no crash, t1 = 5 / 0 preserved)"

echo "========================================="
echo "All 5 optimizer acceptance tests passed!"
echo "========================================="
