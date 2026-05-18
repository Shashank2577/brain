/**
 * Agents bundle — loads AGENTS.md and .agents/skills/ from the template.
 *
 * This is the single source of truth the framework's agent uses to mirror what
 * Claude Code / Codex / any other agent would see when running locally in the
 * repo. The filesystem is the canonical source; this module is just a loader
 * that works both in dev (direct fs read) and production (content bundled at
 * build time via the `virtual:agents-bundle` Vite plugin).
 *
 * Resolution order inside `loadAgentsBundle()`:
 *   1. Virtual module (`virtual:agents-bundle`) — inlined at build time by the
 *      framework's Vite plugin. This is the ONLY path that works on edge
 *      runtimes (Cloudflare Workers) where `readFileSync` doesn't exist.
 *   2. Filesystem fallback — `process.cwd()/AGENTS.md` +
 *      `process.cwd()/.agents/skills/`. Only reliable in local dev and Node
 *      production (`agent-native start`); not on Netlify/Vercel/CF at runtime.
 *   3. Empty bundle — everything silently returns empty strings.
 *
 * Result is cached in module scope so it's only computed once per cold start.
 */
export interface SkillMeta {
    name: string;
    description: string;
}
export interface Skill {
    meta: SkillMeta;
    /** Contents of SKILL.md (the entry file of the skill). */
    content: string;
    /**
     * Filesystem path to the skill directory, relative to the template root
     * (e.g. `.agents/skills/create-deck`). The agent can read any file here via
     * shell in dev — skills are folders, not single files, and may contain
     * supporting assets, scripts, or additional markdown.
     */
    dir: string;
    /**
     * Files inside the skill directory (relative to the skill dir), excluding
     * `SKILL.md`. Lets the agent know what else is available without a separate
     * `ls` call. Empty array if the skill is single-file.
     */
    extraFiles: string[];
}
export interface AgentsBundle {
    /** Contents of the template's AGENTS.md (empty string if missing). */
    agentsMd: string;
    /**
     * Contents of the workspace core's AGENTS.md, if the app is inside an
     * enterprise monorepo with a `workspaceCore` configured. Empty string
     * otherwise. Sits between the framework system prompt and the template's
     * AGENTS.md in the instruction stack.
     */
    workspaceAgentsMd?: string;
    /**
     * Map from skill name → skill content. Contains skills merged from the
     * workspace core layer (if present) and the template layer. On name
     * collision, the template's version wins so apps can override a shared
     * enterprise skill by dropping a same-named file under
     * `.agents/skills/<name>/`.
     */
    skills: Record<string, Skill>;
}
/**
 * Parse the YAML frontmatter at the top of a skill file.
 * Only pulls out `name` and `description` — deliberately simple, no YAML lib.
 * Handles:
 *   - Inline: `description: Some text`
 *   - Folded scalar: `description: >-\n  multi\n  line` → "multi line"
 *   - Literal scalar: `description: |\n  multi\n  line` → "multi\nline"
 */
export declare function parseSkillFrontmatter(content: string): Partial<SkillMeta>;
/**
 * Paths to a workspace-core's agent resources, for merging into a template's
 * bundle. All fields optional — pass null for any missing piece.
 */
export interface WorkspaceAgentsSource {
    /** Absolute path to the workspace core's skills/ directory. */
    skillsDir: string | null;
    /** Absolute path to the workspace core's AGENTS.md. */
    agentsMdPath: string | null;
    /** Root dir (used to compute `dir` paths for workspace-core skills). */
    rootDir: string;
}
/**
 * Read AGENTS.md + all skills directly from the filesystem rooted at `cwd`.
 * Optionally also reads a workspace-core's AGENTS.md and skills directory
 * and merges them in (template wins on name collisions). Used by both the
 * Vite plugin (at build time) and the runtime fallback (in dev / Node prod).
 *
 * Synchronous — the Vite plugin's load hook calls it inline during the build.
 */
export declare function readAgentsBundleFromFs(cwd: string, workspaceSource?: WorkspaceAgentsSource | null): AgentsBundle;
/**
 * Load the agents bundle. Returns a cached result on subsequent calls.
 * Tries the virtual module first (works everywhere, including edge), then
 * falls back to filesystem reads from `process.cwd()` — which, when a
 * workspace core is present, also merges in the workspace core's skills
 * and AGENTS.md.
 */
export declare function loadAgentsBundle(): Promise<AgentsBundle>;
/**
 * Generate the `<skills>` block to inject into the system prompt.
 *
 * Skills are folders at `.agents/skills/<name>/` containing a `SKILL.md` entry
 * file plus any number of supporting files (additional markdown, examples,
 * images, scripts). This block lists what's available and how to read them.
 *
 * In dev mode the agent has shell access and reads skills via `cat` — exactly
 * like running `claude` locally in the repo. In production mode the agent has
 * no shell; templates that need skill content at runtime should inline the
 * critical parts directly in `AGENTS.md`.
 */
export declare function generateSkillsPromptBlock(bundle: AgentsBundle): string;
/** For tests — reset the module cache. */
export declare function __resetAgentsBundleCache(): void;
//# sourceMappingURL=agents-bundle.d.ts.map