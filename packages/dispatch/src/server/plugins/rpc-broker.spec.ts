/**
 * Tests for the Item A3 dispatch broker route — verifies signed-identity
 * authentication, FQID lookup, error envelopes, and the load-bearing
 * security invariant: the user's identity reaches the target capability,
 * NEVER the calling app's id.
 */
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineAction } from "@agent-native/core";
import {
  getRequestOrgId,
  getRequestUserEmail,
} from "@agent-native/core/server";
import {
  brokerDispatch,
  buildRegistry,
  type ActionLike,
} from "./capability-registry.js";
import { signIdentity } from "../lib/identity-header.js";

const SECRET = "broker-test-secret-12345678901234567890";

async function makeRegistry() {
  const captured: { email?: string; orgId?: string } = {};
  const innerAction: ActionLike = defineAction({
    description: "Capture identity",
    schema: z.object({}).passthrough(),
    run: async () => {
      captured.email = getRequestUserEmail();
      captured.orgId = getRequestOrgId();
      return { observed: true, ...captured };
    },
  });
  const echoAction: ActionLike = defineAction({
    description: "Echo title",
    schema: z.object({ title: z.string() }),
    run: async (args) => ({ id: "n1", title: args.title }),
  });
  const registry = await buildRegistry({
    templatesDir: "",
    staticCapabilities: {
      "notes.capture": innerAction,
      "notes.create-note": echoAction,
    },
  });
  return { registry, captured };
}

describe("brokerDispatch", () => {
  it("happy path: signed header + valid fqid invokes the capability", async () => {
    const { registry } = await makeRegistry();
    const token = signIdentity(
      { userEmail: "alice@x", orgId: "org_1" },
      SECRET,
    );
    const { status, response } = await brokerDispatch({
      registry,
      identityHeader: token,
      body: { fqid: "notes.create-note", input: { title: "Hi" } },
      secret: SECRET,
    });
    expect(status).toBe(200);
    expect(response.ok).toBe(true);
    if (response.ok) {
      expect(response.output).toEqual({ id: "n1", title: "Hi" });
    }
  });

  it("returns 401 for a missing identity header", async () => {
    const { registry } = await makeRegistry();
    const { status, response } = await brokerDispatch({
      registry,
      identityHeader: undefined,
      body: { fqid: "notes.create-note", input: { title: "x" } },
      secret: SECRET,
    });
    expect(status).toBe(401);
    expect(response.ok).toBe(false);
    if (!response.ok) expect(response.error.code).toBe("unauthenticated");
  });

  it("returns 401 for a bad signature", async () => {
    const { registry } = await makeRegistry();
    const tokenWithOtherSecret = signIdentity(
      { userEmail: "alice@x" },
      "different-secret",
    );
    const { status, response } = await brokerDispatch({
      registry,
      identityHeader: tokenWithOtherSecret,
      body: { fqid: "notes.create-note", input: { title: "x" } },
      secret: SECRET,
    });
    expect(status).toBe(401);
    expect(response.ok).toBe(false);
  });

  it("returns 401 with code identity_expired for an expired header", async () => {
    const { registry } = await makeRegistry();
    const past = 1_000_000_000;
    const token = signIdentity({ userEmail: "alice@x" }, SECRET, {
      ttlSeconds: 1,
      nowSeconds: past,
    });
    const { status, response } = await brokerDispatch({
      registry,
      identityHeader: token,
      body: { fqid: "notes.create-note", input: { title: "x" } },
      secret: SECRET,
    });
    expect(status).toBe(401);
    expect(response.ok).toBe(false);
    if (!response.ok) expect(response.error.code).toBe("identity_expired");
  });

  it("returns 404 for an unknown fqid", async () => {
    const { registry } = await makeRegistry();
    const token = signIdentity({ userEmail: "alice@x" }, SECRET);
    const { status, response } = await brokerDispatch({
      registry,
      identityHeader: token,
      body: { fqid: "nope.missing", input: {} },
      secret: SECRET,
    });
    expect(status).toBe(404);
    expect(response.ok).toBe(false);
    if (!response.ok) {
      expect(response.error.code).toBe("unknown_capability");
      expect(response.error.fqid).toBe("nope.missing");
    }
  });

  it("returns 400 for missing fqid in body", async () => {
    const { registry } = await makeRegistry();
    const token = signIdentity({ userEmail: "alice@x" }, SECRET);
    const { status, response } = await brokerDispatch({
      registry,
      identityHeader: token,
      body: { input: { title: "x" } },
      secret: SECRET,
    });
    expect(status).toBe(400);
    expect(response.ok).toBe(false);
    if (!response.ok) expect(response.error.code).toBe("missing_fqid");
  });

  it("returns 500 with handler_error when the capability throws", async () => {
    const boom: ActionLike = {
      tool: { description: "boom" },
      run: async () => {
        throw new Error("kaboom");
      },
    };
    const registry = await buildRegistry({
      templatesDir: "",
      staticCapabilities: { "x.boom": boom },
    });
    const token = signIdentity({ userEmail: "alice@x" }, SECRET);
    const { status, response } = await brokerDispatch({
      registry,
      identityHeader: token,
      body: { fqid: "x.boom", input: {} },
      secret: SECRET,
    });
    expect(status).toBe(500);
    expect(response.ok).toBe(false);
    if (!response.ok) {
      expect(response.error.code).toBe("handler_error");
      expect(response.error.message).toMatch(/kaboom/);
    }
  });

  it("identity propagation: target capability sees the USER's email, not a caller-app id", async () => {
    const { registry, captured } = await makeRegistry();
    // Token carries the END USER's identity. There is no "caller app id"
    // claim in the header by design — that's the load-bearing CLAUDE.md rule.
    const token = signIdentity(
      { userEmail: "user@end.local", orgId: "org_end" },
      SECRET,
    );
    const { status, response } = await brokerDispatch({
      registry,
      identityHeader: token,
      body: { fqid: "notes.capture", input: {} },
      secret: SECRET,
    });
    expect(status).toBe(200);
    expect(response.ok).toBe(true);
    expect(captured.email).toBe("user@end.local");
    expect(captured.orgId).toBe("org_end");
    // Sanity: nothing in the round trip exposed an app-id field
    if (response.ok) {
      const out = response.output as Record<string, unknown>;
      expect(out.email).toBe("user@end.local");
      expect(out.orgId).toBe("org_end");
    }
  });
});
