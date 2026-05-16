#!/usr/bin/env bash
# Phase 7 prep scaffold for fluid-system test runner.
#
# Runs the four-tier pyramid in order — guards, typecheck, unit,
# integration, e2e — capturing each step's stdout/stderr to
# .test-results/<step>.log and emitting a machine-readable
# .test-results/summary.json with per-step status / duration / failure count.
#
# Exits 0 only if every executed step passes. See docs/testing/qa-runbook.md
# for the full spec.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.."; pwd)"
OUT="$ROOT/.test-results"
mkdir -p "$OUT"

# JSON summary state -- arrays of step records.
SUMMARY_TMP="$(mktemp -t fluid-os-summary.XXXXXX)"
trap 'rm -f "$SUMMARY_TMP"' EXIT
printf '[]' > "$SUMMARY_TMP"

OVERALL_STATUS=0

# Append a step record to the running JSON array.
record_step() {
  local step="$1"
  local status="$2"
  local duration_ms="$3"
  local failures="$4"
  local log_file="$5"

  node - "$SUMMARY_TMP" "$step" "$status" "$duration_ms" "$failures" "$log_file" <<'NODE'
import { readFileSync, writeFileSync } from "node:fs";

const [file, step, status, durationMs, failures, logFile] = process.argv.slice(2);
const arr = JSON.parse(readFileSync(file, "utf8"));
arr.push({
  step,
  status,
  duration_ms: Number(durationMs),
  failures: Number(failures),
  log: logFile,
});
writeFileSync(file, JSON.stringify(arr, null, 2));
NODE
}

# Run a pnpm script if it exists in the root package.json; otherwise mark
# the step as skipped. Captures combined stdout+stderr to a log file and
# uses the script's exit code to decide pass/fail.
run_step() {
  local step="$1"
  local pnpm_script="$2"
  local log_file="$OUT/${step}.log"
  local start_ms
  local end_ms
  local duration_ms
  local exit_code
  local failures

  echo ""
  echo "::group::${step}"
  echo "[test-fluid-os] step=${step} script=pnpm ${pnpm_script}"

  if ! /usr/bin/env node -e "const p=require('${ROOT}/package.json');process.exit(p.scripts && p.scripts['${pnpm_script}'] ? 0 : 1);" >/dev/null 2>&1; then
    echo "[test-fluid-os] step=${step} skipped (pnpm script '${pnpm_script}' not defined)"
    : > "$log_file"
    record_step "$step" "skipped" 0 0 "$log_file"
    echo "::endgroup::"
    return 0
  fi

  start_ms=$(node -e "console.log(Date.now())")
  set +e
  pnpm "$pnpm_script" >"$log_file" 2>&1
  exit_code=$?
  set -e
  end_ms=$(node -e "console.log(Date.now())")
  duration_ms=$((end_ms - start_ms))

  # Roughly count failing test lines for the summary. Final pass/fail is
  # decided by the script's exit code, not this number.
  failures=$(grep -cE '^\s*(FAIL|×|✗|✘|Error)' "$log_file" 2>/dev/null || true)
  failures=${failures:-0}

  if [ "$exit_code" -eq 0 ]; then
    echo "[test-fluid-os] step=${step} status=passed duration=${duration_ms}ms"
    record_step "$step" "passed" "$duration_ms" "$failures" "$log_file"
  else
    echo "[test-fluid-os] step=${step} status=failed duration=${duration_ms}ms exit=${exit_code}"
    record_step "$step" "failed" "$duration_ms" "$failures" "$log_file"
    OVERALL_STATUS=1
  fi

  echo "::endgroup::"
}

run_step "guards"      "guards"
run_step "typecheck"   "typecheck"
run_step "unit"        "test"
run_step "integration" "test:integration"
run_step "e2e"         "test:e2e"

# Smoke: every template wires SSR via createTemplateServer. Catches the
# "200-because-of-auth-redirect" trap that hid the notes/tasks/crm/meetings
# SSR outage in the previous QA pass — this check is static and doesn't
# depend on a running server or a cookie.
SSR_SMOKE_LOG="$OUT/smoke-template-ssr.log"
SSR_SMOKE_START=$(node -e "console.log(Date.now())")
set +e
node "$ROOT/scripts/smoke-template-ssr.mjs" >"$SSR_SMOKE_LOG" 2>&1
SSR_SMOKE_EXIT=$?
set -e
SSR_SMOKE_END=$(node -e "console.log(Date.now())")
SSR_SMOKE_DUR=$((SSR_SMOKE_END - SSR_SMOKE_START))
if [ "$SSR_SMOKE_EXIT" -eq 0 ]; then
  echo "[test-fluid-os] step=smoke-template-ssr status=passed duration=${SSR_SMOKE_DUR}ms"
  record_step "smoke-template-ssr" "passed" "$SSR_SMOKE_DUR" 0 "$SSR_SMOKE_LOG"
else
  echo "[test-fluid-os] step=smoke-template-ssr status=failed duration=${SSR_SMOKE_DUR}ms exit=${SSR_SMOKE_EXIT}"
  record_step "smoke-template-ssr" "failed" "$SSR_SMOKE_DUR" 1 "$SSR_SMOKE_LOG"
  OVERALL_STATUS=1
fi

# Materialize the final summary at the documented path.
node - "$SUMMARY_TMP" "$OUT/summary.json" "$OVERALL_STATUS" <<'NODE'
import { readFileSync, writeFileSync } from "node:fs";

const [src, dest, overall] = process.argv.slice(2);
const steps = JSON.parse(readFileSync(src, "utf8"));
const payload = {
  generated_at: new Date().toISOString(),
  overall_status: overall === "0" ? "passed" : "failed",
  steps,
};
writeFileSync(dest, JSON.stringify(payload, null, 2));
NODE

echo ""
echo "[test-fluid-os] summary written to $OUT/summary.json"
echo "[test-fluid-os] overall_status=$([ "$OVERALL_STATUS" -eq 0 ] && echo passed || echo failed)"

exit "$OVERALL_STATUS"
