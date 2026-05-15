import { describe, it, expect, vi, beforeEach } from "vitest";
import type { EngineEvent, EngineStreamOptions } from "../types.js";

async function collectEvents(
  iterable: AsyncIterable<EngineEvent>,
): Promise<EngineEvent[]> {
  const events: EngineEvent[] = [];
  for await (const e of iterable) {
    events.push(e);
  }
  return events;
}

/**
 * Encode a JS value as a Bedrock-style `{ chunk: { bytes } }` envelope so
 * the engine's stream loop sees exactly what `BedrockRuntimeClient.send`
 * yields in production.
 */
function bedrockChunk(payload: unknown): { chunk: { bytes: Uint8Array } } {
  return {
    chunk: { bytes: new TextEncoder().encode(JSON.stringify(payload)) },
  };
}

/**
 * Build a `client.send()` mock that returns an async iterable of the given
 * chunks (each already wrapped via `bedrockChunk`).
 */
function mockSendReturning(
  chunks: Array<{ chunk: { bytes: Uint8Array } } | Record<string, unknown>>,
) {
  return vi.fn().mockResolvedValue({
    body: (async function* () {
      for (const c of chunks) yield c;
    })(),
  });
}

/**
 * Install vi.doMock for @aws-sdk/client-bedrock-runtime backed by a
 * configurable `client.send` implementation. Returns the captured send mock
 * plus the BedrockRuntimeClient constructor mock so each test can inspect
 * the call arguments.
 */
function installBedrockMock(send: ReturnType<typeof vi.fn>): {
  clientCtor: ReturnType<typeof vi.fn>;
  commandCtor: ReturnType<typeof vi.fn>;
} {
  // The engine calls `new BedrockRuntimeClient(...)` and `new
  // InvokeModelWithResponseStreamCommand(...)` — use class declarations
  // so `new` resolves to a real constructor while still recording every
  // construction via vi.fn().
  const clientCtor = vi.fn();
  class MockBedrockRuntimeClient {
    send = send;
    constructor(config: unknown) {
      clientCtor(config);
    }
  }
  const commandCtor = vi.fn();
  class MockInvokeModelWithResponseStreamCommand {
    input: unknown;
    constructor(input: unknown) {
      commandCtor(input);
      this.input = input;
    }
  }
  vi.doMock("@aws-sdk/client-bedrock-runtime", () => ({
    BedrockRuntimeClient: MockBedrockRuntimeClient,
    InvokeModelWithResponseStreamCommand:
      MockInvokeModelWithResponseStreamCommand,
  }));
  return { clientCtor, commandCtor };
}

const BASE_STREAM_OPTS: EngineStreamOptions = {
  model: "anthropic.claude-3-5-sonnet-20240620-v1:0",
  systemPrompt: "You are a helpful assistant.",
  messages: [{ role: "user", content: [{ type: "text", text: "Hello" }] }],
  tools: [],
  abortSignal: new AbortController().signal,
};

describe("createBedrockEngine", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.doUnmock("@aws-sdk/client-bedrock-runtime");
    delete process.env.AWS_REGION;
    delete process.env.AWS_DEFAULT_REGION;
    delete process.env.AWS_PROFILE;
    delete process.env.AWS_ACCESS_KEY_ID; // guard:allow-env-credential — test setup
    delete process.env.AWS_SECRET_ACCESS_KEY; // guard:allow-env-credential — test setup
    delete process.env.AWS_SESSION_TOKEN; // guard:allow-env-credential — test setup
  });

  it("exposes the expected name, label, defaults, and capabilities", async () => {
    const { createBedrockEngine, BEDROCK_DEFAULT_MODEL, BEDROCK_CAPABILITIES } =
      await import("./bedrock.js");
    const engine = createBedrockEngine({});
    expect(engine.name).toBe("bedrock");
    expect(engine.label).toContain("Bedrock");
    expect(engine.defaultModel).toBe(BEDROCK_DEFAULT_MODEL);
    expect(engine.capabilities).toMatchObject(BEDROCK_CAPABILITIES);
    expect(engine.supportedModels).toContain(
      "anthropic.claude-3-5-sonnet-20240620-v1:0",
    );
    expect(engine.supportedModels).toContain(
      "anthropic.claude-3-haiku-20240307-v1:0",
    );
    expect(engine.supportedModels).toContain(
      "anthropic.claude-3-sonnet-20240229-v1:0",
    );
    expect(engine.supportedModels).toContain(
      "anthropic.claude-3-opus-20240229-v1:0",
    );
  });

  it("streamChat sends correct InvokeModel request shape for a simple user message", async () => {
    const send = mockSendReturning([
      bedrockChunk({
        type: "message_start",
        message: { usage: { input_tokens: 7, output_tokens: 0 } },
      }),
      bedrockChunk({
        type: "content_block_start",
        index: 0,
        content_block: { type: "text", text: "" },
      }),
      bedrockChunk({
        type: "content_block_delta",
        index: 0,
        delta: { type: "text_delta", text: "Hi" },
      }),
      bedrockChunk({
        type: "content_block_stop",
        index: 0,
      }),
      bedrockChunk({
        type: "message_delta",
        delta: { stop_reason: "end_turn" },
        usage: { output_tokens: 4 },
      }),
      bedrockChunk({ type: "message_stop" }),
    ]);
    const { clientCtor, commandCtor } = installBedrockMock(send);

    const { createBedrockEngine } = await import("./bedrock.js");
    const engine = createBedrockEngine({
      region: "us-west-2",
      accessKeyId: "AKIAFAKE",
      secretAccessKey: "secret",
    });

    await collectEvents(engine.stream(BASE_STREAM_OPTS));

    // Verify the client was constructed against the requested region. When
    // explicit credentials are passed the engine wires them to the client
    // config rather than falling through to the AWS default chain.
    expect(clientCtor).toHaveBeenCalledTimes(1);
    const clientArgs = clientCtor.mock.calls[0]![0] as {
      region: string;
      credentials?: { accessKeyId: string; secretAccessKey: string };
    };
    expect(clientArgs.region).toBe("us-west-2");
    expect(clientArgs.credentials?.accessKeyId).toBe("AKIAFAKE");
    expect(clientArgs.credentials?.secretAccessKey).toBe("secret");

    // Verify the command was built with the right modelId and body shape.
    expect(commandCtor).toHaveBeenCalledTimes(1);
    const input = commandCtor.mock.calls[0]![0] as {
      modelId: string;
      contentType: string;
      body: Uint8Array;
    };
    expect(input.modelId).toBe(BASE_STREAM_OPTS.model);
    expect(input.contentType).toBe("application/json");
    const body = JSON.parse(new TextDecoder().decode(input.body));
    expect(body.anthropic_version).toBe("bedrock-2023-05-31");
    expect(body.system).toBe(BASE_STREAM_OPTS.systemPrompt);
    expect(Array.isArray(body.messages)).toBe(true);
    expect(body.messages[0]).toMatchObject({ role: "user" });
    // No tools were configured, so the body should omit the `tools` field
    // entirely (Bedrock rejects empty arrays).
    expect(body.tools).toBeUndefined();
    expect(typeof body.max_tokens).toBe("number");
  });

  it("translates response chunks into the framework's EngineEvent stream", async () => {
    const send = mockSendReturning([
      bedrockChunk({
        type: "message_start",
        message: { usage: { input_tokens: 10, output_tokens: 0 } },
      }),
      bedrockChunk({
        type: "content_block_start",
        index: 0,
        content_block: { type: "text", text: "" },
      }),
      bedrockChunk({
        type: "content_block_delta",
        index: 0,
        delta: { type: "text_delta", text: "Hello, " },
      }),
      bedrockChunk({
        type: "content_block_delta",
        index: 0,
        delta: { type: "text_delta", text: "world!" },
      }),
      bedrockChunk({ type: "content_block_stop", index: 0 }),
      bedrockChunk({
        type: "message_delta",
        delta: { stop_reason: "end_turn" },
        usage: { output_tokens: 5 },
      }),
      bedrockChunk({ type: "message_stop" }),
    ]);
    installBedrockMock(send);

    const { createBedrockEngine } = await import("./bedrock.js");
    const engine = createBedrockEngine({});

    const events = await collectEvents(engine.stream(BASE_STREAM_OPTS));

    const textDeltas = events.filter((e) => e.type === "text-delta");
    expect(textDeltas.map((e: any) => e.text).join("")).toBe("Hello, world!");

    const assistant = events.find((e) => e.type === "assistant-content") as any;
    expect(assistant).toBeDefined();
    expect(assistant.parts).toEqual([{ type: "text", text: "Hello, world!" }]);

    const usage = events.find((e) => e.type === "usage") as any;
    expect(usage).toBeDefined();
    expect(usage.inputTokens).toBe(10);
    expect(usage.outputTokens).toBe(5);

    const stop = events.find((e) => e.type === "stop") as any;
    expect(stop).toBeDefined();
    expect(stop.reason).toBe("end_turn");
  });

  it("formats tool definitions correctly in the request and assembles tool-call events from chunk stream", async () => {
    const send = mockSendReturning([
      bedrockChunk({
        type: "message_start",
        message: { usage: { input_tokens: 50, output_tokens: 0 } },
      }),
      bedrockChunk({
        type: "content_block_start",
        index: 0,
        content_block: {
          type: "tool_use",
          id: "tool_call_1",
          name: "get_weather",
        },
      }),
      bedrockChunk({
        type: "content_block_delta",
        index: 0,
        delta: { type: "input_json_delta", partial_json: '{"city"' },
      }),
      bedrockChunk({
        type: "content_block_delta",
        index: 0,
        delta: { type: "input_json_delta", partial_json: ':"NYC"}' },
      }),
      bedrockChunk({ type: "content_block_stop", index: 0 }),
      bedrockChunk({
        type: "message_delta",
        delta: { stop_reason: "tool_use" },
        usage: { output_tokens: 8 },
      }),
      bedrockChunk({ type: "message_stop" }),
    ]);
    const { commandCtor } = installBedrockMock(send);

    const { createBedrockEngine } = await import("./bedrock.js");
    const engine = createBedrockEngine({});

    const opts: EngineStreamOptions = {
      ...BASE_STREAM_OPTS,
      tools: [
        {
          name: "get_weather",
          description: "Look up the weather for a city.",
          inputSchema: {
            type: "object",
            properties: { city: { type: "string" } },
            required: ["city"],
          },
        },
      ],
    };

    const events = await collectEvents(engine.stream(opts));

    // Tool definitions in the wire body match Anthropic's `input_schema`
    // shape (snake_case key) — confirms the engine reuses
    // engineToolsToAnthropic correctly.
    const input = commandCtor.mock.calls[0]![0] as { body: Uint8Array };
    const body = JSON.parse(new TextDecoder().decode(input.body));
    expect(Array.isArray(body.tools)).toBe(true);
    expect(body.tools).toHaveLength(1);
    expect(body.tools[0]).toMatchObject({
      name: "get_weather",
      description: "Look up the weather for a city.",
      input_schema: {
        type: "object",
        properties: { city: { type: "string" } },
        required: ["city"],
      },
    });

    // The engine assembles a tool-call event from the input_json_delta
    // chunks plus content_block_stop, and the assistant-content captures
    // the parsed tool call.
    const toolCall = events.find((e) => e.type === "tool-call") as any;
    expect(toolCall).toBeDefined();
    expect(toolCall.id).toBe("tool_call_1");
    expect(toolCall.name).toBe("get_weather");
    expect(toolCall.input).toEqual({ city: "NYC" });

    const toolInputStart = events.find(
      (e) => e.type === "tool-input-start",
    ) as any;
    expect(toolInputStart?.name).toBe("get_weather");

    const toolInputDeltas = events.filter(
      (e) => e.type === "tool-input-delta",
    ) as any[];
    expect(toolInputDeltas.map((e) => e.text).join("")).toBe('{"city":"NYC"}');

    const stop = events.find((e) => e.type === "stop") as any;
    expect(stop.reason).toBe("tool_use");
  });

  it("re-emits a stop event when Bedrock send() throws", async () => {
    const send = vi.fn().mockRejectedValue(
      Object.assign(
        new Error("Model 'anthropic.claude-3-5-sonnet' is not accessible."),
        {
          name: "AccessDeniedException",
        },
      ),
    );
    installBedrockMock(send);

    const { createBedrockEngine } = await import("./bedrock.js");
    const engine = createBedrockEngine({});

    const events = await collectEvents(engine.stream(BASE_STREAM_OPTS));
    const stop = events.find((e) => e.type === "stop") as any;
    expect(stop).toBeDefined();
    expect(stop.reason).toBe("error");
    // The error string passes through the AWS SDK exception name so users
    // can act on AccessDeniedException ("request model access") /
    // ValidationException (wrong region) / etc.
    expect(stop.error).toContain("AccessDeniedException");
    expect(stop.error).toContain("Model");
  });

  it("emits a single error stop when the stream surfaces a ThrottlingException", async () => {
    const send = mockSendReturning([
      // Bedrock surfaces stream-level errors via named union members in
      // place of `chunk` — the engine must convert these to a single
      // terminal `stop` event.
      {
        throttlingException: { message: "Too many requests" },
      },
    ]);
    installBedrockMock(send);

    const { createBedrockEngine } = await import("./bedrock.js");
    const engine = createBedrockEngine({});

    const events = await collectEvents(engine.stream(BASE_STREAM_OPTS));
    const stop = events.find((e) => e.type === "stop") as any;
    expect(stop.reason).toBe("error");
    expect(stop.error).toContain("ThrottlingException");
    expect(stop.error).toContain("Too many requests");
  });

  it("defaults region to us-east-1 and reads AWS env vars when fallback is allowed", async () => {
    process.env.AWS_REGION = "eu-west-1";
    process.env.AWS_ACCESS_KEY_ID = "AKIAFROMENV";
    process.env.AWS_SECRET_ACCESS_KEY = "secretfromenv";

    const send = mockSendReturning([
      bedrockChunk({
        type: "message_start",
        message: { usage: { input_tokens: 1, output_tokens: 0 } },
      }),
      bedrockChunk({
        type: "message_delta",
        delta: { stop_reason: "end_turn" },
        usage: { output_tokens: 1 },
      }),
      bedrockChunk({ type: "message_stop" }),
    ]);
    const { clientCtor } = installBedrockMock(send);

    const { createBedrockEngine } = await import("./bedrock.js");
    const engine = createBedrockEngine({});

    await collectEvents(engine.stream(BASE_STREAM_OPTS));

    const clientArgs = clientCtor.mock.calls[0]![0] as {
      region: string;
      credentials?: { accessKeyId: string };
    };
    expect(clientArgs.region).toBe("eu-west-1");
    expect(clientArgs.credentials?.accessKeyId).toBe("AKIAFROMENV");
    expect(engine.name).toBe("bedrock");
  });
});
