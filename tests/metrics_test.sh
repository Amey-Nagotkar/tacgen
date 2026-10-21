#!/usr/bin/env bash
set -e

TACGEN="${1:-${TACGEN:-./build/tacgen}}"

if [ ! -f "$TACGEN" ]; then
    echo "Error: tacgen executable not found at $TACGEN. Build first."
    exit 1
fi

echo "Running Metrics and Evaluation acceptance tests..."

# ------------------------------------------------------------------------------
# Test 1: tacgen --metrics-all bench (runs N=50 for test speed, writes out/metrics.csv)
# ------------------------------------------------------------------------------
"$TACGEN" --metrics-all bench --runs 50 > /dev/null

if [ ! -f "out/metrics.csv" ]; then
    echo "Error: out/metrics.csv not created."
    exit 1
fi

# ------------------------------------------------------------------------------
# Test 2: Diff b1..b3 rows (excluding time_*) against tests/metrics.golden.csv
# ------------------------------------------------------------------------------
ACTUAL_CSV=$(mktemp)
grep -v '^b4,' out/metrics.csv | grep -v 'time_' > "$ACTUAL_CSV"
diff -u tests/metrics.golden.csv "$ACTUAL_CSV"
rm -f "$ACTUAL_CSV"
echo "[PASS] Test 1 & 2 (benchmarks b1..b3 metrics match tests/metrics.golden.csv exactly)"

# ------------------------------------------------------------------------------
# Test 3: Check b4 invariants in out/metrics.csv
# ------------------------------------------------------------------------------
B4_PHIS_UNPRUNED=$(grep "^b4,phis_unpruned," out/metrics.csv | cut -d',' -f3)
B4_PHIS_PRUNED=$(grep "^b4,phis_pruned," out/metrics.csv | cut -d',' -f3)

if [ "$B4_PHIS_PRUNED" -gt "$B4_PHIS_UNPRUNED" ]; then
    echo "Error: b4 phis_pruned ($B4_PHIS_PRUNED) > phis_unpruned ($B4_PHIS_UNPRUNED)"
    exit 1
fi
echo "[PASS] Test 3 (b4 phis_pruned <= phis_unpruned: $B4_PHIS_PRUNED <= $B4_PHIS_UNPRUNED)"

# Check deletion totals growth from b3 to b4
B3_ENTRIES=$(grep "^b3,triple_entries," out/metrics.csv | cut -d',' -f3)
B4_ENTRIES=$(grep "^b4,triple_entries," out/metrics.csv | cut -d',' -f3)
B3_SHIFTS=$(grep "^b3,del_shift_total_triple," out/metrics.csv | cut -d',' -f3)
B4_SHIFTS=$(grep "^b4,del_shift_total_triple," out/metrics.csv | cut -d',' -f3)
B3_REWRITES=$(grep "^b3,del_rewrite_total_triple," out/metrics.csv | cut -d',' -f3)
B4_REWRITES=$(grep "^b4,del_rewrite_total_triple," out/metrics.csv | cut -d',' -f3)

# Ratio check: (B4_SHIFTS / B3_SHIFTS) > (B4_ENTRIES / B3_ENTRIES)
# B4_SHIFTS * B3_ENTRIES > B4_ENTRIES * B3_SHIFTS
if [ $((B4_SHIFTS * B3_ENTRIES)) -le $((B4_ENTRIES * B3_SHIFTS)) ]; then
    echo "Error: del_shift_total_triple did not grow faster than triple_entries"
    exit 1
fi

if [ $((B4_REWRITES * B3_ENTRIES)) -le $((B4_ENTRIES * B3_REWRITES)) ]; then
    echo "Error: del_rewrite_total_triple did not grow faster than triple_entries"
    exit 1
fi
echo "[PASS] Test 4 (b3 to b4 deletion costs grew faster than entry count: entries $B3_ENTRIES->$B4_ENTRIES, shifts $B3_SHIFTS->$B4_SHIFTS, rewrites $B3_REWRITES->$B4_REWRITES)"

# ------------------------------------------------------------------------------
# Test 5: Single file --metrics prints two-column table with (indicative only)
# ------------------------------------------------------------------------------
OUT_SINGLE=$(mktemp)
"$TACGEN" bench/b1.mini --metrics --runs 20 > "$OUT_SINGLE"
grep -q "tac_instrs" "$OUT_SINGLE"
grep -q "time_frontend_us_mean" "$OUT_SINGLE"
grep -q "(indicative only)" "$OUT_SINGLE"
rm -f "$OUT_SINGLE"
echo "[PASS] Test 5 (single file --metrics prints two-column table with indicative markings)"

# ------------------------------------------------------------------------------
# Test 6: --all runs tac, formats, blocks, opt, ssa, ssa-opt
# ------------------------------------------------------------------------------
OUT_ALL=$(mktemp)
"$TACGEN" bench/b1.mini --all > "$OUT_ALL"
grep -q "=== TAC ===" "$OUT_ALL"
grep -q "=== FORMATS ===" "$OUT_ALL"
grep -q "=== BLOCKS & CFG ===" "$OUT_ALL"
grep -q "=== OPTIMIZATION ===" "$OUT_ALL"
grep -q "=== SSA ===" "$OUT_ALL"
grep -q "=== SSA OPTIMIZER ===" "$OUT_ALL"
rm -f "$OUT_ALL"
echo "[PASS] Test 6 (--all runs all pipeline stages successfully)"

echo "========================================="
echo "All 6 metrics acceptance tests passed!"
echo "========================================="
