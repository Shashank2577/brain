import { useState } from "react";
import { IconPlayerPlay, IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { invokeCapability } from "./api";
import type { CapabilityEntry } from "./types";

interface Props {
  capability: CapabilityEntry;
}

export function CapabilityCard({ capability }: Props) {
  const [input, setInput] = useState("{}");
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function run() {
    setError(null);
    setOutput(null);
    setRunning(true);
    try {
      const parsed = input.trim() === "" ? {} : JSON.parse(input);
      const result = await invokeCapability(capability.id, parsed);
      setOutput(JSON.stringify(result, null, 2));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-sm font-semibold">{capability.id}</div>
            <div className="text-xs text-muted-foreground mt-1">{capability.description}</div>
          </div>
          {capability.tags && capability.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 shrink-0">
              {capability.tags.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 items-stretch">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            className="flex-1 min-h-[64px] resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder='{ "key": "value" }'
          />
          <Button onClick={run} disabled={running} size="sm" className="self-stretch">
            <IconPlayerPlay size={14} />
            {running ? "Running…" : "Invoke"}
          </Button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <IconAlertCircle size={14} className="mt-0.5 shrink-0" />
            <pre className="whitespace-pre-wrap break-words font-mono">{error}</pre>
          </div>
        )}
        {output !== null && !error && (
          <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs">
            <IconCheck size={14} className="mt-0.5 shrink-0 text-foreground/70" />
            <pre className="whitespace-pre-wrap break-words font-mono max-h-72 overflow-auto">{output}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
