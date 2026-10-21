#!/usr/bin/env bash
set -e

# Braun SSA Construction Acceptance Tests
TACGEN="${1:-${TACGEN:-./build/tacgen}}"

if [ ! -f "$TACGEN" ]; then
    echo "Error: tacgen executable not found at $TACGEN. Build first."
    exit 1
fi

echo "Running Braun SSA construction acceptance tests..."

# ------------------------------------------------------------------------------
# Test 1: bench/b1.mini --ssa-braun
# ------------------------------------------------------------------------------
OUT_B1=$(mktemp)
"$TACGEN" bench/b1.mini --ssa-braun > "$OUT_B1"
diff -u tests/b1.braun.expected "$OUT_B1"
rm -f "$OUT_B1"
echo "[PASS] Test 1 (bench/b1.mini --ssa-braun: phis_braun=2, verify: OK)"

# ------------------------------------------------------------------------------
# Test 2: Acceptance check 1: bench/b1.mini --ssa-compare (2 and 2, MATCH)
# ------------------------------------------------------------------------------
OUT_COMP_B1=$("$TACGEN" bench/b1.mini --ssa-compare)
echo "$OUT_COMP_B1" | grep -q "phis_cytron_pruned=2 phis_braun=2 MATCH"
echo "$OUT_COMP_B1" | grep -q "verify: OK"
echo "[PASS] Test 2 (bench/b1.mini --ssa-compare: 2 and 2, MATCH)"

# ------------------------------------------------------------------------------
# Test 3: Acceptance check 2: tests/s_dead.mini --ssa-compare (0 and 0, MATCH)
# ------------------------------------------------------------------------------
OUT_COMP_DEAD=$("$TACGEN" tests/s_dead.mini --ssa-compare)
echo "$OUT_COMP_DEAD" | grep -q "phis_cytron_pruned=0 phis_braun=0 MATCH"
echo "$OUT_COMP_DEAD" | grep -q "verify: OK"
echo "[PASS] Test 3 (tests/s_dead.mini --ssa-compare: 0 and 0, MATCH)"

# ------------------------------------------------------------------------------
# Test 4: bench/b2.mini --ssa-compare --live-out y,z,w,u
# ------------------------------------------------------------------------------
OUT_COMP_B2=$("$TACGEN" bench/b2.mini --ssa-compare --live-out y,z,w,u)
echo "$OUT_COMP_B2" | grep -q "MATCH"
echo "$OUT_COMP_B2" | grep -q "verify: OK"
echo "[PASS] Test 4 (bench/b2.mini --ssa-compare --live-out: MATCH, verify: OK)"

# ------------------------------------------------------------------------------
# Test 5: bench/b3.mini --ssa-compare
# ------------------------------------------------------------------------------
OUT_COMP_B3=$("$TACGEN" bench/b3.mini --ssa-compare)
echo "$OUT_COMP_B3" | grep -q "MATCH"
echo "$OUT_COMP_B3" | grep -q "verify: OK"
echo "[PASS] Test 5 (bench/b3.mini --ssa-compare: MATCH, verify: OK)"

# ------------------------------------------------------------------------------
# Test 6: Verify all valid test cases with --ssa-compare
# ------------------------------------------------------------------------------
for f in tests/c_unreach.mini tests/o_kill.mini tests/o_div0.mini tests/p_else.mini tests/p_paren.mini tests/p_prec.mini tests/t_and.mini tests/t_misc.mini tests/t_or.mini; do
    OUT_TEST=$("$TACGEN" "$f" --ssa-compare)
    echo "$OUT_TEST" | grep -q "verify: OK"
done
echo "[PASS] Test 6 (all valid test cases pass verifier with --ssa-compare)"

echo "========================================="
echo "All 6 Braun SSA acceptance tests passed!"
echo "========================================="
