import { useCallback, useEffect, useState, type ReactElement } from "react";
import { DispatchShell } from "@/components/dispatch-shell";

/**
 * Phase 7 — Tests dashboard inside the dispatch shell.
 *
 * Renders the most recent `bin/test-fluid-os.sh` run as a pass/fail matrix.
 * The runner writes `.test-results/summary.json` after every invocation;
 * the page fetches it via a dev-only endpoint and displays:
 *
 *   - A top strip with overall status (green/red).
 *   - One row per step (guards / typecheck / unit / integration / e2e)
 *     with status pill, duration, and failure count.
 *   - Click-to-expand details for each step, showing the captured log.
 *   - A "Run all tests" button that POSTs to a dev-only endpoint to fire
 *     the runner asynchronously.
 *
 * The route is dev-gated — visible only when `import.meta.env.DEV === true`
 * OR the server is started with `ENABLE_TESTS_UI=1`. The check happens at
 * mount so a stale build never accidentally exposes this surface in
 * production.
 */

interface StepSummary {
  step: string;
  status: "passed" | "failed" | "skipped";
  duration_ms: number;
  failures: number;
  log: string;
}

interface RunSummary {
  generated_at: string;
  overall_status: "passed" | "failed";
  steps: StepSummary[];
}

type LoadState =
  | { kind: "loading" }
  | { kind: "ok"; summary: RunSummary }
  | { kind: "missing" }
  | { kind: "error"; message: string };

const STEP_ORDER = ["guards", "typecheck", "unit", "integration", "e2e"];

function isUiVisible(): boolean {
  // `import.meta.env.DEV` is the Vite signal for `vite dev`.
  // ENABLE_TESTS_UI is the explicit opt-in for staging / preview builds.
  const env = (import.meta as { env?: Record<string, unknown> }).env ?? {};
  if (env.DEV === true) return true;
  if (env.VITE_ENABLE_TESTS_UI === "1") return true;
  if (typeof window !== "undefined") {
    const flag =
      (window as { __ENABLE_TESTS_UI__?: boolean }).__ENABLE_TESTS_UI__ ===
      true;
    if (flag) return true;
  }
  return false;
}

function statusPillClass(status: StepSummary["status"]): string {
  switch (status) {
    case "passed":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
    case "failed":
      return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30";
    case "skipped":
      return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-500/30";
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export function TestsPage(): ReactElement | null {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [runState, setRunState] = useState<
    "idle" | "running" | "done" | "error"
  >("idle");
  const [runMessage, setRunMessage] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/_agent-native/tests/summary");
      if (res.status === 404) {
        setState({ kind: "missing" });
        return;
      }
      if (!res.ok) {
        setState({
          kind: "error",
          message: `Status ${res.status} from /_agent-native/tests/summary`,
        });
        return;
      }
      const summary = (await res.json()) as RunSummary;
      setState({ kind: "ok", summary });
    } catch (err) {
      setState({
        kind: "error",
        message: (err as Error).message,
      });
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const runAll = useCallback(async () => {
    setRunState("running");
    setRunMessage("Spawning bin/test-fluid-os.sh …");
    try {
      const res = await fetch("/_agent-native/tests/run", { method: "POST" });
      if (!res.ok) {
        const body = await res.text();
        setRunState("error");
        setRunMessage(`Run failed: ${res.status} ${body}`);
        return;
      }
      setRunState("done");
      setRunMessage("Run kicked off — refresh in a few minutes for results.");
    } catch (err) {
      setRunState("error");
      setRunMessage((err as Error).message);
    }
  }, []);

  if (!isUiVisible()) {
    // Production builds with the flag off — show nothing rather than a
    // misleading "Tests" placeholder.
    return null;
  }

  return (
    <DispatchShell
      title="Tests"
      description="Phase 7 QA dashboard. Surfaces the latest `bin/test-fluid-os.sh` run with per-step pass / fail status. Visible only when import.meta.env.DEV is true or ENABLE_TESTS_UI=1."
    >
      <section className="rounded-2xl border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Most recent run</div>
            {state.kind === "ok" ? (
              <div className="text-xs text-muted-foreground">
                {new Date(state.summary.generated_at).toLocaleString()} ·{" "}
                <span
                  className={
                    state.summary.overall_status === "passed"
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-rose-700 dark:text-rose-300"
                  }
                >
                  {state.summary.overall_status.toUpperCase()}
                </span>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                {state.kind === "loading" && "Loading summary…"}
                {state.kind === "missing" &&
                  "No run yet. Click ‘Run all tests’ to generate one."}
                {state.kind === "error" && state.message}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadSummary}
              className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-xs hover:bg-accent"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={runAll}
              disabled={runState === "running"}
              className="inline-flex h-8 items-center rounded-md bg-foreground px-3 text-xs text-background disabled:opacity-60"
            >
              {runState === "running" ? "Running…" : "Run all tests"}
            </button>
          </div>
        </div>

        {runMessage ? (
          <div
            className={
              runState === "error"
                ? "mb-4 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300"
                : "mb-4 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
            }
          >
            {runMessage}
          </div>
        ) : null}

        <div className="space-y-2">
          {state.kind === "ok" ? (
            sortSteps(state.summary.steps).map((step) => (
              <div
                key={step.step}
                className="rounded-xl border bg-muted/20 px-4 py-3"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left"
                  onClick={() =>
                    setExpanded((cur) => (cur === step.step ? null : step.step))
                  }
                  aria-expanded={expanded === step.step}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${statusPillClass(step.status)}`}
                    >
                      {step.status}
                    </span>
                    <span className="text-sm font-medium">{step.step}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {step.failures > 0 ? (
                      <span className="text-rose-600 dark:text-rose-300">
                        {step.failures} failure{step.failures === 1 ? "" : "s"}
                      </span>
                    ) : null}
                    <span>{formatDuration(step.duration_ms)}</span>
                  </div>
                </button>
                {expanded === step.step ? (
                  <div className="mt-3 rounded-md border bg-background px-3 py-2 text-xs">
                    <div className="mb-2 font-mono text-muted-foreground">
                      log: {step.log}
                    </div>
                    <a
                      href={`/_agent-native/tests/log?step=${encodeURIComponent(step.step)}`}
                      className="text-blue-600 underline-offset-4 hover:underline dark:text-blue-300"
                    >
                      Open captured log
                    </a>
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              {state.kind === "loading"
                ? "Loading…"
                : state.kind === "missing"
                  ? "No run yet."
                  : `Could not load: ${state.message}`}
            </div>
          )}
        </div>
      </section>
    </DispatchShell>
  );
}

function sortSteps(steps: StepSummary[]): StepSummary[] {
  return [...steps].sort((a, b) => {
    const ai = STEP_ORDER.indexOf(a.step);
    const bi = STEP_ORDER.indexOf(b.step);
    if (ai === -1 && bi === -1) return a.step.localeCompare(b.step);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export default TestsPage;
