import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";

import { CapabilityRegistry } from "../registry.js";
import { IdentityProvider } from "../identity/session.js";
import { createRpcHandler } from "../rpc/server.js";
import type { AppManifest } from "../manifest/types.js";
import {
  LIST_APPS_PATH,
  LIST_CAPABILITIES_PATH,
  RPC_PATH,
} from "../rpc/protocol.js";
import {
  CookieSession,
  GithubProvider,
  MemoryUserStore,
  type FluidUser,
  type UserStore,
} from "../auth/index.js";
import type { AgentClient } from "../agent/client.js";
import { buildSkillJson, buildSkillMarkdown } from "../agent/skill.js";
import {
  buildManifestSource,
  validateScaffoldSpec,
  camel,
  type ScaffoldSpec,
} from "../scaffold/template.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHELL_DIR = join(__dirname, "../../dist/shell");

export interface FluidOsOpts {
  secret: string;
  issuer?: string;
  osAppId?: string;
  github?: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
  allowDevSignin?: boolean;
  userStore?: UserStore;
  cookieSecure?: boolean;
  agent?: AgentClient;
  scaffoldDir?: string;
  enableScaffoldEndpoint?: boolean;
}

export class FluidOs {
  readonly registry: CapabilityRegistry;
  readonly identity: IdentityProvider;
  readonly osAppId: string;
  readonly users: UserStore;
  readonly cookies: CookieSession;
  readonly github?: GithubProvider;
  readonly allowDevSignin: boolean;
  readonly cookieSecure: boolean;
  readonly scaffoldDir: string;
  readonly enableScaffoldEndpoint: boolean;
  private rpc: ReturnType<typeof createRpcHandler>;

  constructor(opts: FluidOsOpts) {
    this.registry = new CapabilityRegistry();
    this.identity = new IdentityProvider({ secret: opts.secret, issuer: opts.issuer });
    this.osAppId = opts.osAppId ?? "fluid-os";
    this.users = opts.userStore ?? new MemoryUserStore();
    this.cookies = new CookieSession(opts.secret);
    this.github = opts.github ? new GithubProvider(opts.github) : undefined;
    this.allowDevSignin = opts.allowDevSignin ?? false;
    this.cookieSecure = opts.cookieSecure ?? false;
    this.scaffoldDir = opts.scaffoldDir ?? join(process.cwd(), "examples/apps");
    this.enableScaffoldEndpoint = opts.enableScaffoldEndpoint ?? true;
    this.rpc = createRpcHandler({
      registry: this.registry,
      identity: this.identity,
      osAppId: this.osAppId,
      agent: opts.agent,
    });
  }

  install(manifest: AppManifest): void {
    this.registry.register(manifest);
  }

  issueSession(user: { id: string; email: string; name?: string; orgId?: string }, opts?: { appId?: string; ttlSeconds?: number; scope?: string[] }): Promise<string> {
    return this.identity.sign(user, {
      audienceAppId: opts?.appId ?? this.osAppId,
      ttlSeconds: opts?.ttlSeconds,
      scope: opts?.scope,
    });
  }

  async handle(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path === "/" || path === "/index.html") return this.serveAsset("index.html", "text/html");
    if (path.startsWith("/assets/")) {
      const ext = path.split(".").pop() ?? "";
      const ct =
        ext === "js" ? "application/javascript"
        : ext === "css" ? "text/css"
        : ext === "svg" ? "image/svg+xml"
        : "application/octet-stream";
      return this.serveAsset(path.replace(/^\//, ""), ct);
    }

    if (path === "/_fluid-os/me") return this.handleMe(req);
    if (path === "/_fluid-os/auth/dev") return this.handleDevSignin(req);
    if (path === "/_fluid-os/auth/github") return this.handleGithubStart();
    if (path === "/_fluid-os/auth/github/callback") return this.handleGithubCallback(req);
    if (path === "/_fluid-os/auth/logout") return this.handleLogout();
    if (path === "/_fluid-os/auth/token") return this.handleMintToken(req);

    if (path === "/_fluid-os/skill.md") return this.handleSkillMd();
    if (path === "/_fluid-os/skill.json") return this.handleSkillJson();
    if (path === "/_fluid-os/scaffold" && req.method === "POST") return this.handleScaffold(req);
    if (path === "/_fluid-os/scaffold/suggest" && req.method === "POST") return this.handleSuggest(req);

    return this.rpc.handle(req);
  }

  routes() {
    return {
      rpc: RPC_PATH,
      apps: LIST_APPS_PATH,
      capabilities: LIST_CAPABILITIES_PATH,
      shell: "/",
    };
  }

  // ---- auth helpers ----

  private async currentUser(req: Request): Promise<FluidUser | null> {
    const cookie = this.cookies.readFromHeader(req.headers.get("cookie"));
    if (!cookie) return null;
    try {
      const claims = await this.cookies.verify(cookie);
      return this.users.byId(claims.sub) ?? null;
    } catch {
      return null;
    }
  }

  private async handleMe(req: Request): Promise<Response> {
    const user = await this.currentUser(req);
    if (!user) return json({ error: "not_signed_in" }, { status: 401 });
    return json({ user });
  }

  private async handleDevSignin(req: Request): Promise<Response> {
    if (!this.allowDevSignin) {
      return new Response("Dev sign-in is disabled. Pass allowDevSignin:true.", { status: 403 });
    }
    const url = new URL(req.url);
    const id = url.searchParams.get("id") ?? "u_dev";
    const email = url.searchParams.get("email") ?? `${id}@example.com`;
    const name = url.searchParams.get("name") ?? id;
    const user = this.users.upsertDev({ id, email, name });
    const token = await this.cookies.sign(user.id);
    return new Response("", {
      status: 302,
      headers: {
        location: "/",
        "set-cookie": this.cookies.buildSetCookie(token, { secure: this.cookieSecure }),
      },
    });
  }

  private async handleGithubStart(): Promise<Response> {
    if (!this.github) {
      return new Response("GitHub OAuth not configured. Set FLUID_OS_GITHUB_CLIENT_ID / SECRET.", { status: 501 });
    }
    const state = randomBytes(16).toString("hex");
    const cookie = `fluid_os_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${this.cookieSecure ? "; Secure" : ""}`;
    return new Response("", {
      status: 302,
      headers: { location: this.github.authorizeUrl(state), "set-cookie": cookie },
    });
  }

  private async handleGithubCallback(req: Request): Promise<Response> {
    if (!this.github) return new Response("GitHub OAuth not configured", { status: 501 });
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const cookieHeader = req.headers.get("cookie") ?? "";
    const stateMatch = cookieHeader.match(/(?:^|;\s*)fluid_os_oauth_state=([^;]+)/);
    if (!code || !state || !stateMatch || stateMatch[1] !== state) {
      return new Response("Invalid OAuth state", { status: 400 });
    }
    const accessToken = await this.github.exchangeCode(code);
    const { profile, email } = await this.github.fetchProfile(accessToken);
    const user = this.users.upsertFromGithub(profile, email);
    const session = await this.cookies.sign(user.id);
    return new Response("", {
      status: 302,
      headers: {
        location: "/",
        "set-cookie": this.cookies.buildSetCookie(session, { secure: this.cookieSecure }),
      },
    });
  }

  private handleLogout(): Response {
    return new Response("", {
      status: 302,
      headers: { location: "/", "set-cookie": this.cookies.buildClearCookie() },
    });
  }

  private async handleMintToken(req: Request): Promise<Response> {
    const user = await this.currentUser(req);
    if (!user) return json({ error: "not_signed_in" }, { status: 401 });
    const token = await this.issueSession(user, { appId: this.osAppId });
    return json({ token, user });
  }

  // ---- skill + scaffold ----

  private handleSkillMd(): Response {
    return new Response(buildSkillMarkdown(this.registry), {
      headers: { "content-type": "text/markdown; charset=utf-8" },
    });
  }

  private handleSkillJson(): Response {
    return json(buildSkillJson(this.registry));
  }

  private async handleScaffold(req: Request): Promise<Response> {
    if (!this.enableScaffoldEndpoint) {
      return json({ error: "scaffold_disabled" }, { status: 403 });
    }
    const user = await this.currentUser(req);
    if (!user) return json({ error: "not_signed_in" }, { status: 401 });

    let spec: ScaffoldSpec;
    try {
      spec = (await req.json()) as ScaffoldSpec;
    } catch {
      return json({ error: "invalid_body" }, { status: 400 });
    }
    const err = validateScaffoldSpec(spec);
    if (err) return json({ error: "invalid_spec", message: err }, { status: 400 });

    if (this.registry.hasApp(spec.id)) {
      return json({ error: "id_taken", message: `App "${spec.id}" already installed.` }, { status: 409 });
    }

    const allIds = new Set<string>();
    for (const c of this.registry.listCapabilities()) allIds.add(c.id);
    const unknown = spec.consumes.filter((c) => !allIds.has(c));
    if (unknown.length > 0) {
      return json(
        { error: "unknown_consumes", message: `Unknown capabilities: ${unknown.join(", ")}` },
        { status: 400 },
      );
    }

    const dir = join(this.scaffoldDir, spec.id);
    if (existsSync(dir)) {
      return json({ error: "dir_exists", message: `${dir} already exists.` }, { status: 409 });
    }
    mkdirSync(dir, { recursive: true });
    const file = join(dir, "manifest.ts");
    writeFileSync(file, buildManifestSource(spec), "utf8");

    try {
      const mod = (await import(pathToFileURL(file).href)) as Record<string, AppManifest | undefined>;
      const exportName = `${camel(spec.id)}App`;
      const manifest = mod[exportName];
      if (!manifest) {
        return json(
          {
            error: "missing_export",
            message: `Manifest file was written to ${file} but \`${exportName}\` is not exported.`,
            file,
          },
          { status: 500 },
        );
      }
      this.registry.register(manifest);
    } catch (e) {
      return json(
        {
          error: "import_failed",
          message: `Manifest file was written to ${file} but importing it failed: ${(e as Error).message}`,
          file,
        },
        { status: 500 },
      );
    }

    return json({
      ok: true,
      file,
      app: {
        id: spec.id,
        name: spec.name,
        description: spec.description,
        consumes: spec.consumes,
        capabilities: spec.capabilities.map((c) => `${spec.id}.${c.id}`),
      },
    });
  }

  private async handleSuggest(req: Request): Promise<Response> {
    let body: { description?: string } = {};
    try {
      body = (await req.json()) as { description?: string };
    } catch {
      return json({ error: "invalid_body" }, { status: 400 });
    }
    const description = (body.description ?? "").toLowerCase();
    const tokens = new Set(
      description
        .replace(/[^a-z0-9\s.-]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length >= 3),
    );

    const scored: { id: string; description: string; score: number; appId: string }[] = [];
    for (const cap of this.registry.listCapabilities()) {
      const haystack = `${cap.appId} ${cap.id} ${cap.description}`.toLowerCase();
      let score = 0;
      for (const t of tokens) if (haystack.includes(t)) score++;
      if (score > 0) scored.push({ id: cap.id, description: cap.description, appId: cap.appId, score });
    }
    scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

    return json({ suggestions: scored.slice(0, 12) });
  }

  // ---- static assets ----

  private serveAsset(filename: string, contentType: string): Response {
    try {
      const body = readFileSync(join(SHELL_DIR, filename));
      return new Response(body, { headers: { "content-type": contentType } });
    } catch {
      return new Response("Shell asset missing: " + filename, { status: 500 });
    }
  }
}

function json<T>(body: T, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
}
