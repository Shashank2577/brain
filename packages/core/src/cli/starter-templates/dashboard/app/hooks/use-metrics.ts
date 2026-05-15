import { useActionQuery } from "@agent-native/core/client";

export interface MetricCard {
  id: string;
  label: string;
  value: string;
  updatedAt: string;
}

interface MetricsResponse {
  metrics: MetricCard[];
}

export function useMetrics() {
  return useActionQuery<MetricsResponse>(
    "list-metrics",
    {},
    { staleTime: 5000 },
  );
}
