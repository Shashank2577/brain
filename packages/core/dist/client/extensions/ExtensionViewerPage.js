import { jsx as _jsx } from "react/jsx-runtime";
import { agentNativePath } from "../api-path.js";
import { useEffect } from "react";
import { useParams } from "react-router";
import { ExtensionViewer } from "./ExtensionViewer.js";
import { ExtensionsListPage } from "./ExtensionsListPage.js";
import { incrementExtensionView } from "./extension-popularity.js";
export function ExtensionViewerPage() {
    const { id } = useParams();
    useEffect(() => {
        if (id && id !== "new") {
            incrementExtensionView(id);
        }
        fetch(agentNativePath("/_agent-native/application-state/navigation"), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                view: "extensions",
                ...(id && id !== "new" ? { extensionId: id } : {}),
            }),
        }).catch(() => { });
    }, [id]);
    if (id === "new") {
        // No manual editor — extensions are created via the agent
        return _jsx(ExtensionsListPage, {});
    }
    if (!id)
        return null;
    return _jsx(ExtensionViewer, { extensionId: id });
}
//# sourceMappingURL=ExtensionViewerPage.js.map