import { agentNativePath } from "../api-path.js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
/**
 * Inject a virtual `mcp-servers/` folder into a scope's resource tree.
 *
 * MCP servers aren't stored as resource rows — they live in the settings
 * store — but we surface them in the Workspace tree alongside `memory/`,
 * `skills/`, etc. Each server becomes a synthetic `TreeNode` whose
 * `resource.id` is an `mcp:<scope>:<id>` virtual id the panel recognizes
 * on click/delete and routes to the MCP endpoints instead of the
 * resource endpoints.
 *
 * Returns a new tree; the input is not mutated. If `servers` is empty
 * and `alwaysShow` is false, the folder is not added — same behavior as
 * any other optional folder.
 */
export function withMcpServersFolder(tree, servers, opts) {
    const alwaysShow = opts?.alwaysShow ?? false;
    if (servers.length === 0 && !alwaysShow)
        return tree;
    // Filter out any real `mcp-servers/` entries so the virtual folder is
    // authoritative. (Shouldn't happen today, but guards against collisions
    // if a user pastes a file there.)
    const filtered = tree.filter((n) => !(n.type === "folder" && n.name === "mcp-servers"));
    const now = Date.now();
    const children = servers.map((s) => {
        const virtualId = `mcp:${s.scope}:${s.id}`;
        const path = `mcp-servers/${s.name}.json`;
        return {
            name: `${s.name}.json`,
            path,
            type: "file",
            kind: "mcp-server",
            mcpServerMeta: s,
            resource: {
                id: virtualId,
                path,
                owner: s.scope,
                mimeType: "application/json",
                size: 0,
                createdAt: s.createdAt,
                updatedAt: s.createdAt,
            },
        };
    });
    const folder = {
        name: "mcp-servers",
        path: "mcp-servers",
        type: "folder",
        children,
    };
    // Insert the folder so it sorts naturally with other folders (alphabetical).
    // The backend already sorts folders-first, alpha — match that.
    const foldersFirst = [];
    const files = [];
    for (const n of filtered) {
        (n.type === "folder" ? foldersFirst : files).push(n);
    }
    foldersFirst.push(folder);
    foldersFirst.sort((a, b) => a.name.localeCompare(b.name));
    // Assign a synthetic `updatedAt`-less ordering — use current time so the
    // folder appears stable across renders; we rely on alpha sort.
    void now;
    return [...foldersFirst, ...files];
}
/**
 * Group top-level `scripts/` and `tasks/` folders into a virtual
 * `agent-scratch/` folder.
 *
 * The agent occasionally writes scratch scripts and task notes to the
 * resources store while working through a request. These aren't user
 * content — they're agent machinery — and they clutter the top of the
 * personal tree. Grouping them under a single clearly-labeled folder
 * keeps them visible (so the user can inspect or delete) without making
 * them look like first-class personal files.
 */
export function withAgentScratchFolder(tree) {
    const scratch = [];
    const rest = [];
    for (const n of tree) {
        if (n.type === "folder" && (n.name === "scripts" || n.name === "tasks")) {
            scratch.push(n);
        }
        else {
            rest.push(n);
        }
    }
    if (scratch.length === 0)
        return tree;
    const folder = {
        name: "agent-scratch",
        path: "agent-scratch",
        type: "folder",
        children: scratch,
    };
    const folders = [];
    const files = [];
    for (const n of rest) {
        (n.type === "folder" ? folders : files).push(n);
    }
    folders.push(folder);
    folders.sort((a, b) => a.name.localeCompare(b.name));
    return [...folders, ...files];
}
async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
    return res.json();
}
export function useResources(scope = "personal") {
    return useQuery({
        queryKey: ["resources", "list", scope],
        queryFn: async () => {
            const data = await fetchJson(agentNativePath(`/_agent-native/resources?scope=${scope}`));
            return data.resources ?? [];
        },
    });
}
export function useResourceTree(scope = "personal") {
    return useQuery({
        queryKey: ["resources", "tree", scope],
        queryFn: async () => {
            const data = await fetchJson(agentNativePath(`/_agent-native/resources/tree?scope=${scope}`));
            return data.tree ?? [];
        },
    });
}
export function useResource(id) {
    return useQuery({
        queryKey: ["resource", id],
        queryFn: () => fetchJson(agentNativePath(`/_agent-native/resources/${id}`)),
        enabled: !!id,
    });
}
export function useCreateResource() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (body) => {
            const res = await fetch(agentNativePath("/_agent-native/resources"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok)
                throw new Error(`Create failed: ${res.statusText}`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources"] });
        },
    });
}
export function useUpdateResource() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...body }) => {
            const res = await fetch(agentNativePath(`/_agent-native/resources/${id}`), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok)
                throw new Error(`Update failed: ${res.statusText}`);
            return res.json();
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["resources"] });
            queryClient.invalidateQueries({ queryKey: ["resource", variables.id] });
        },
    });
}
export function useDeleteResource() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const res = await fetch(agentNativePath(`/_agent-native/resources/${id}`), {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok)
                throw new Error(`Delete failed: ${res.statusText}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources"] });
        },
    });
}
export function useUploadResource() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (formData) => {
            const res = await fetch(agentNativePath("/_agent-native/resources/upload"), {
                method: "POST",
                body: formData,
            });
            if (!res.ok)
                throw new Error(`Upload failed: ${res.statusText}`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources"] });
        },
    });
}
//# sourceMappingURL=use-resources.js.map