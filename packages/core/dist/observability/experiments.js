import { getDbExec } from "../db/client.js";
import { insertExperiment, updateExperiment, listExperiments, getExperiment, upsertAssignment, getAssignment, insertExperimentResult, ensureObservabilityTables, } from "./store.js";
// ─── Hashing ────────────────────────────────────────────────────────
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
}
function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
// ─── Active experiments cache (short TTL for hot path) ──────────────
let _cachedActive = null;
let _cachedActiveAt = 0;
const CACHE_TTL_MS = 5_000;
async function getActiveExperiments() {
    const now = Date.now();
    if (_cachedActive && now - _cachedActiveAt < CACHE_TTL_MS) {
        return _cachedActive;
    }
    const all = await listExperiments();
    _cachedActive = all.filter((e) => e.status === "running");
    _cachedActiveAt = now;
    return _cachedActive;
}
function invalidateCache() {
    _cachedActive = null;
    _cachedActiveAt = 0;
}
// ─── Experiment lifecycle ───────────────────────────────────────────
export async function createExperiment(opts) {
    const experiment = {
        id: generateId("exp"),
        name: opts.name,
        status: "draft",
        variants: opts.variants,
        metrics: opts.metrics,
        assignmentLevel: opts.assignmentLevel ?? "user",
        startedAt: null,
        endedAt: null,
        createdAt: Date.now(),
    };
    await insertExperiment(experiment);
    return experiment;
}
export async function startExperiment(id) {
    await updateExperiment(id, { status: "running" });
    invalidateCache();
}
export async function pauseExperiment(id) {
    await updateExperiment(id, { status: "paused" });
    invalidateCache();
}
export async function completeExperiment(id) {
    await updateExperiment(id, { status: "completed", endedAt: Date.now() });
    invalidateCache();
}
// ─── Variant assignment ─────────────────────────────────────────────
export async function resolveVariant(experimentId, userId) {
    const existing = await getAssignment(experimentId, userId);
    if (existing) {
        const experiment = await getExperiment(experimentId);
        if (!experiment)
            throw new Error(`Experiment ${experimentId} not found`);
        const variant = experiment.variants.find((v) => v.id === existing.variantId);
        if (!variant)
            throw new Error(`Variant ${existing.variantId} not found in experiment ${experimentId}`);
        return variant;
    }
    const experiment = await getExperiment(experimentId);
    if (!experiment)
        throw new Error(`Experiment ${experimentId} not found`);
    if (experiment.variants.length === 0)
        throw new Error("Experiment has no variants");
    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight <= 0)
        throw new Error("Experiment has no valid variant weights");
    const hashValue = simpleHash(experimentId + userId) % totalWeight;
    let cumulative = 0;
    let chosen;
    for (const variant of experiment.variants) {
        cumulative += variant.weight;
        if (hashValue < cumulative) {
            chosen = variant;
            break;
        }
    }
    // Fallback to last variant if rounding causes no match
    if (!chosen)
        chosen = experiment.variants[experiment.variants.length - 1];
    // Fire-and-forget persistence
    upsertAssignment({
        experimentId,
        userId,
        variantId: chosen.id,
        assignedAt: Date.now(),
    }).catch(() => { });
    return chosen;
}
export async function resolveActiveExperimentConfig(userId) {
    const active = await getActiveExperiments();
    if (active.length === 0)
        return null;
    const assignments = [];
    const merged = {};
    const variants = await Promise.all(active.map((exp) => resolveVariant(exp.id, userId)));
    for (let i = 0; i < active.length; i++) {
        const exp = active[i];
        const variant = variants[i];
        assignments.push({ experimentId: exp.id, variantId: variant.id });
        Object.assign(merged, variant.config);
    }
    return { configs: merged, assignments };
}
// ─── Results computation ────────────────────────────────────────────
export async function computeExperimentResults(experimentId) {
    const experiment = await getExperiment(experimentId);
    if (!experiment)
        throw new Error(`Experiment ${experimentId} not found`);
    await ensureObservabilityTables();
    const client = getDbExec();
    const results = [];
    const now = Date.now();
    for (const variant of experiment.variants) {
        const { rows: assignmentRows } = await client.execute({
            sql: `SELECT user_id FROM agent_experiment_assignments WHERE experiment_id = ? AND variant_id = ?`,
            args: [experimentId, variant.id],
        });
        if (assignmentRows.length === 0) {
            const emptyMetrics = [
                "avg_cost",
                "avg_latency",
                "avg_eval_score",
                "tool_success_rate",
                "satisfaction",
                "sample_size",
            ];
            for (const metric of emptyMetrics) {
                const result = {
                    id: generateId("expres"),
                    experimentId,
                    variantId: variant.id,
                    metric,
                    value: 0,
                    sampleSize: 0,
                    confidenceLow: 0,
                    confidenceHigh: 0,
                    computedAt: now,
                };
                results.push(result);
                insertExperimentResult(result).catch(() => { });
            }
            continue;
        }
        const userIds = assignmentRows.map((r) => String(r.user_id));
        const placeholders = userIds.map(() => "?").join(", ");
        // Scope runs to this variant's assigned users via user_id on the summary.
        // Previously used INNER JOIN agent_feedback which excluded runs without
        // any feedback — silently underreporting cost/latency/tool metrics.
        const { rows: userTraceRows } = await client.execute({
            sql: `SELECT s.total_cost_cents_x100, s.total_duration_ms, s.successful_tools, s.tool_calls, s.run_id
            FROM agent_trace_summaries s
            WHERE s.user_id IN (${placeholders})
            ${experiment.startedAt ? "AND s.created_at >= ?" : ""}`,
            args: experiment.startedAt ? [...userIds, experiment.startedAt] : userIds,
        });
        const costs = [];
        const latencies = [];
        const toolRates = [];
        for (const row of userTraceRows) {
            costs.push(Number(row.total_cost_cents_x100) / 100);
            latencies.push(Number(row.total_duration_ms));
            const totalTools = Number(row.tool_calls);
            const successTools = Number(row.successful_tools);
            toolRates.push(totalTools > 0 ? successTools / totalTools : 1);
        }
        // Eval scores for these runs
        const runIds = userTraceRows.map((r) => String(r.run_id));
        let evalScores = [];
        if (runIds.length > 0) {
            const runPlaceholders = runIds.map(() => "?").join(", ");
            const { rows: evalRows } = await client.execute({
                sql: `SELECT score FROM agent_evals WHERE run_id IN (${runPlaceholders})`,
                args: runIds,
            });
            evalScores = evalRows.map((r) => Number(r.score));
        }
        // Satisfaction scores (inverse of frustration) for these users' threads
        const { rows: satRows } = await client.execute({
            sql: `SELECT frustration_score FROM agent_satisfaction_scores
            WHERE thread_id IN (
              SELECT DISTINCT f.thread_id FROM agent_feedback f
              WHERE f.user_id IN (${placeholders}) AND f.thread_id IS NOT NULL
            )
            ${experiment.startedAt ? "AND computed_at >= ?" : ""}`,
            args: experiment.startedAt ? [...userIds, experiment.startedAt] : userIds,
        });
        const satisfactionScores = satRows.map((r) => 1 - Number(r.frustration_score) / 100);
        const sampleSize = userTraceRows.length;
        const metricEntries = [
            {
                metric: "avg_cost",
                value: mean(costs),
                std: stddev(costs),
                n: costs.length,
            },
            {
                metric: "avg_latency",
                value: mean(latencies),
                std: stddev(latencies),
                n: latencies.length,
            },
            {
                metric: "avg_eval_score",
                value: mean(evalScores),
                std: stddev(evalScores),
                n: evalScores.length,
            },
            {
                metric: "tool_success_rate",
                value: mean(toolRates),
                std: stddev(toolRates),
                n: toolRates.length,
            },
            {
                metric: "satisfaction",
                value: mean(satisfactionScores),
                std: stddev(satisfactionScores),
                n: satisfactionScores.length,
            },
            { metric: "sample_size", value: sampleSize, std: 0, n: sampleSize },
        ];
        for (const entry of metricEntries) {
            const [low, high] = confidenceInterval(entry.value, entry.std, entry.n);
            const result = {
                id: generateId("expres"),
                experimentId,
                variantId: variant.id,
                metric: entry.metric,
                value: entry.value,
                sampleSize,
                confidenceLow: low,
                confidenceHigh: high,
                computedAt: now,
            };
            results.push(result);
            insertExperimentResult(result).catch(() => { });
        }
    }
    return results;
}
// ─── Stats helpers ──────────────────────────────────────────────────
function mean(values) {
    if (values.length === 0)
        return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
}
function stddev(values) {
    if (values.length < 2)
        return 0;
    const avg = mean(values);
    const squaredDiffs = values.map((v) => (v - avg) ** 2);
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}
function confidenceInterval(avg, std, n) {
    if (n < 2)
        return [avg, avg];
    const se = std / Math.sqrt(n);
    const margin = 1.96 * se;
    return [avg - margin, avg + margin];
}
//# sourceMappingURL=experiments.js.map