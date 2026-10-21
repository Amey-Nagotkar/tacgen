#!/usr/bin/env bash
set -e

# SSA Construction, Dominance, and Verifier Acceptance Tests
TACGEN="./build/tacgen"

if [ ! -f "$TACGEN" ]; then
    echo "Error: tacgen executable not found at $TACGEN. Build first."
    exit 1
fi

echo "Running SSA acceptance tests..."

# ------------------------------------------------------------------------------
# Test 1: bench/b1.mini --ssa
# Dominator table: B1 idom - DF {} ; B2 idom B1 DF {B2} phi s,i ; B3 idom B2 DF {B2} ; B4 idom B2 DF {}.
# Listing with s2 = phi(s1, s3) and i2 = phi(i1, i3), phis_unpruned=2 phis_pruned=2, verify: OK.
# ------------------------------------------------------------------------------
OUT_B1=$(mktemp)
"$TACGEN" bench/b1.mini --ssa > "$OUT_B1"
diff -u tests/b1.ssa.expected "$OUT_B1"
rm -f "$OUT_B1"
echo "[PASS] Test 1 (bench/b1.mini --ssa: while loop SSA, dom table, phis s,i, verify: OK)"

# ------------------------------------------------------------------------------
# Test 2: tests/s_dead.mini
# Pruned vs Unpruned phi placement:
# --ssa: phis_unpruned=1 phis_pruned=0, join block does not place dead phi
# --ssa-unpruned: places x3 = phi(x1, x2) at join block
# ------------------------------------------------------------------------------
OUT_DEAD_PRUNED=$(mktemp)
"$TACGEN" tests/s_dead.mini --ssa > "$OUT_DEAD_PRUNED"
diff -u tests/s_dead.ssa.expected "$OUT_DEAD_PRUNED"
rm -f "$OUT_DEAD_PRUNED"

OUT_DEAD_UNPRUNED=$(mktemp)
"$TACGEN" tests/s_dead.mini --ssa-unpruned > "$OUT_DEAD_UNPRUNED"
diff -u tests/s_dead.ssa_unpruned.expected "$OUT_DEAD_UNPRUNED"
rm -f "$OUT_DEAD_UNPRUNED"
echo "[PASS] Test 2 (tests/s_dead.mini: pruned vs unpruned phi placement, verify: OK)"

# ------------------------------------------------------------------------------
# Test 3: bench/b3.mini --ssa
# Single exit block without return: shows a1 = t5 and final exit_use a1, verify: OK
# ------------------------------------------------------------------------------
OUT_B3=$(mktemp)
"$TACGEN" bench/b3.mini --ssa > "$OUT_B3"
diff -u tests/b3.ssa.expected "$OUT_B3"
rm -f "$OUT_B3"
echo "[PASS] Test 3 (bench/b3.mini --ssa: 0 phis, exit_use pseudo-instruction, verify: OK)"

# ------------------------------------------------------------------------------
# Test 4: bench/b2.mini --ssa
# Satisfies the verifier: exactly one definition per SSA name, dominated uses
# ------------------------------------------------------------------------------
OUT_B2=$(mktemp)
"$TACGEN" bench/b2.mini --ssa > "$OUT_B2"
if ! grep -q "verify: OK" "$OUT_B2"; then
    echo "[FAIL] Test 4 expected verify: OK"
    rm -f "$OUT_B2"
    exit 1
fi
rm -f "$OUT_B2"
echo "[PASS] Test 4 (bench/b2.mini --ssa: verifier passes with verify: OK)"

echo "========================================="
echo "All 4 SSA acceptance tests passed!"
echo "========================================="
