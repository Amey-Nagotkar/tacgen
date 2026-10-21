#!/usr/bin/env bash
set -e

# SSA Optimization Acceptance Tests
TACGEN="./build/tacgen"

if [ ! -f "$TACGEN" ]; then
    echo "Error: tacgen executable not found at $TACGEN. Build first."
    exit 1
fi

echo "Running SSA Optimization acceptance tests..."

# ------------------------------------------------------------------------------
# Test 1: bench/b1.mini --ssa-opt
# counts ssa instrs: 12 -> 8, B1 empty, phis simplified with constants/temporaries, verify: OK
# ------------------------------------------------------------------------------
OUT_B1=$(mktemp)
"$TACGEN" bench/b1.mini --ssa-opt > "$OUT_B1"
diff -u tests/b1.ssaopt.expected "$OUT_B1"
rm -f "$OUT_B1"
echo "[PASS] Test 1 (bench/b1.mini --ssa-opt: 12 -> 8, B1 empty, verify: OK)"

# ------------------------------------------------------------------------------
# Test 2: bench/b2.mini --ssa-opt --live-out y,z,w,u
# runs without crashing and passes verifier
# ------------------------------------------------------------------------------
OUT_B2=$(mktemp)
"$TACGEN" bench/b2.mini --ssa-opt --live-out y,z,w,u > "$OUT_B2"
if ! grep -q "verify: OK" "$OUT_B2"; then
    echo "[FAIL] Test 2 expected verify: OK. Got:"
    cat "$OUT_B2"
    rm -f "$OUT_B2"
    exit 1
fi
rm -f "$OUT_B2"
echo "[PASS] Test 2 (bench/b2.mini --ssa-opt --live-out: passes verifier)"

# ------------------------------------------------------------------------------
# Test 3: bench/b3.mini --ssa-opt
# runs without crashing and passes verifier
# ------------------------------------------------------------------------------
OUT_B3=$(mktemp)
"$TACGEN" bench/b3.mini --ssa-opt > "$OUT_B3"
if ! grep -q "verify: OK" "$OUT_B3"; then
    echo "[FAIL] Test 3 expected verify: OK. Got:"
    cat "$OUT_B3"
    rm -f "$OUT_B3"
    exit 1
fi
rm -f "$OUT_B3"
echo "[PASS] Test 3 (bench/b3.mini --ssa-opt: passes verifier)"

echo "========================================="
echo "All 3 SSA optimization acceptance tests passed!"
echo "========================================="
