#!/usr/bin/env bash
set -eo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

BUILD_DIR="${1:-build}"

echo "=================================================="
echo "Building project in ${BUILD_DIR}..."
echo "=================================================="
cmake --build "$BUILD_DIR"

TACGEN="${PROJECT_ROOT}/${BUILD_DIR}/tacgen"
export TACGEN

if [ ! -x "$TACGEN" ]; then
    echo "Error: tacgen executable not found or not executable at $TACGEN"
    exit 1
fi

TOTAL_TESTS=0
FAILED_TESTS=0
PASSED_TESTS=0

echo ""
echo "=================================================="
echo "Running test suites..."
echo "=================================================="

# Run every tests/*_test.sh sorted by name
for test_script in $(find tests -maxdepth 1 -name "*_test.sh" | sort); do
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    SCRIPT_NAME="$(basename "$test_script")"
    if bash "$test_script" "$TACGEN" > /dev/null 2>&1; then
        echo "PASS: $SCRIPT_NAME"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo "FAIL: $SCRIPT_NAME"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
done

# Run --metrics-all and diff golden file
TOTAL_TESTS=$((TOTAL_TESTS + 1))
DIFF_TMP=$(mktemp)
if "$TACGEN" --metrics-all bench --runs 50 > /dev/null 2>&1 && \
   grep -v '^b4,' out/metrics.csv | grep -v 'time_' > "$DIFF_TMP" && \
   diff -u tests/metrics.golden.csv "$DIFF_TMP" > /dev/null 2>&1; then
    echo "PASS: metrics_golden_diff"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "FAIL: metrics_golden_diff"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
rm -f "$DIFF_TMP"

echo ""
echo "=================================================="
echo "Summary: $PASSED_TESTS / $TOTAL_TESTS passed, $FAILED_TESTS failed."
echo "=================================================="

if [ "$FAILED_TESTS" -ne 0 ]; then
    exit 1
fi
exit 0
