export interface AgentRequest {
  prompt: string;
  user?: { id: string; email: string };
  callerAppId?: string;
  schema?: unknown;
}

export interface AgentClient {
  ask(req: AgentRequest): Promise<string>;
}

export class StubAgentClient implements AgentClient {
  async ask({ prompt }: AgentRequest): Promise<string> {
    return `[agent not configured] would respond to: ${prompt.slice(0, 240)}${prompt.length > 240 ? "…" : ""}`;
  }
}
