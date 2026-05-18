export function workspaceAppHref(app) {
    if (app.status === "pending")
        return app.builderUrl || null;
    return app.path || app.url || null;
}
export function isPendingBuilderHref(app) {
    return app.status === "pending" && !!app.builderUrl;
}
//# sourceMappingURL=workspace-apps.js.map