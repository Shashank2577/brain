export const REMOTE_AGENT_RESOURCE_PREFIX = "remote-agents/";
export const LEGACY_REMOTE_AGENT_RESOURCE_PREFIX = "agents/";
export const REMOTE_AGENT_RESOURCE_PREFIXES = [
    REMOTE_AGENT_RESOURCE_PREFIX,
    LEGACY_REMOTE_AGENT_RESOURCE_PREFIX,
];
function normalizeFrontmatterValue(value) {
    const trimmed = value.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}
export function parseFrontmatter(content) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!match)
        return null;
    const raw = match[0];
    const yamlBlock = match[1];
    const fields = [];
    const lines = yamlBlock.split("\n");
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)/);
        if (!kvMatch) {
            i++;
            continue;
        }
        const key = kvMatch[1];
        let value = kvMatch[2].trim();
        if (value === ">-" || value === ">" || value === "|" || value === "|-") {
            const multiLines = [];
            i++;
            while (i < lines.length && /^\s+/.test(lines[i])) {
                multiLines.push(lines[i].trim());
                i++;
            }
            value = multiLines.join(" ");
        }
        else {
            i++;
        }
        fields.push({ key, value: normalizeFrontmatterValue(value) });
    }
    return {
        raw,
        body: content.slice(raw.length),
        fields,
    };
}
export function serializeFrontmatter(fields) {
    const lines = fields.map(({ key, value }) => {
        if (key === "description" && value.length > 60) {
            const words = value.split(" ");
            const wrapped = [];
            let line = "";
            for (const word of words) {
                if (line && line.length + word.length + 1 > 72) {
                    wrapped.push(`  ${line}`);
                    line = word;
                }
                else {
                    line = line ? `${line} ${word}` : word;
                }
            }
            if (line)
                wrapped.push(`  ${line}`);
            return `${key}: >-\n${wrapped.join("\n")}`;
        }
        const needsQuotes = value.includes(":") || value.startsWith("[") || value.startsWith("{");
        return `${key}: ${needsQuotes ? JSON.stringify(value) : value}`;
    });
    return `---\n${lines.join("\n")}\n---\n`;
}
export function getFrontmatterValue(frontmatter, key) {
    return frontmatter?.fields.find((field) => field.key === key)?.value;
}
export function frontmatterFieldsToObject(frontmatter) {
    return Object.fromEntries(frontmatter?.fields.map((f) => [f.key, f.value]) ?? []);
}
export function isSkillPath(path) {
    return path.startsWith("skills/") && path.endsWith(".md");
}
export function getSkillNameFromPath(path) {
    const relative = path
        .replace(/^\.agents\/skills\//, "")
        .replace(/^skills\//, "");
    if (relative.endsWith("/SKILL.md")) {
        return (relative
            .replace(/\/SKILL\.md$/, "")
            .split("/")
            .pop() || relative);
    }
    return relative.split("/").pop()?.replace(/\.md$/, "") || path;
}
export function isJobPath(path) {
    return path.startsWith("jobs/") && path.endsWith(".md");
}
export function isCustomAgentPath(path) {
    return path.startsWith("agents/") && path.endsWith(".md");
}
export function isRemoteAgentPath(path) {
    return (path.endsWith(".json") &&
        REMOTE_AGENT_RESOURCE_PREFIXES.some((prefix) => path.startsWith(prefix)));
}
export function getRemoteAgentIdFromPath(path) {
    const prefix = REMOTE_AGENT_RESOURCE_PREFIXES.find((candidate) => path.startsWith(candidate));
    const withoutPrefix = prefix ? path.slice(prefix.length) : path;
    return withoutPrefix.replace(/\.json$/, "");
}
export function remoteAgentResourcePath(id) {
    return `${REMOTE_AGENT_RESOURCE_PREFIX}${id}.json`;
}
export function getResourceKind(path) {
    if (isSkillPath(path))
        return "skill";
    if (isJobPath(path))
        return "job";
    if (isCustomAgentPath(path))
        return "agent";
    if (isRemoteAgentPath(path))
        return "remote-agent";
    return "file";
}
export function parseSkillMetadata(content, path) {
    if (!isSkillPath(path))
        return null;
    const frontmatter = parseFrontmatter(content);
    return {
        name: getFrontmatterValue(frontmatter, "name") || getSkillNameFromPath(path),
        description: getFrontmatterValue(frontmatter, "description"),
    };
}
export function parseCustomAgentProfile(content, path) {
    if (!isCustomAgentPath(path))
        return null;
    const frontmatter = parseFrontmatter(content);
    const values = frontmatterFieldsToObject(frontmatter);
    const id = path.replace(/^agents\//, "").replace(/\.md$/, "");
    return {
        id,
        path,
        name: values.name || id,
        description: values.description,
        model: values.model && values.model !== "inherit" ? values.model : undefined,
        tools: values.tools || undefined,
        color: values.color || undefined,
        delegateDefault: values["delegate-default"] === "true",
        instructions: (frontmatter?.body ?? content).trim(),
    };
}
export function parseRemoteAgentManifest(content, path) {
    if (!isRemoteAgentPath(path))
        return null;
    try {
        const data = JSON.parse(content);
        const id = data.id || getRemoteAgentIdFromPath(path);
        if (!data.url)
            return null;
        return {
            id,
            path,
            name: data.name || id,
            description: data.description || "",
            url: data.url,
            color: data.color || "#6B7280",
        };
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=metadata.js.map