import { jsx as _jsx } from "react/jsx-runtime";
import { NewWorkspaceAppFlow } from "@agent-native/core/client";
import { DispatchShell } from "../../components/dispatch-shell.js";
export function meta() {
    return [{ title: "New App — Dispatch" }];
}
export default function NewAppRoute() {
    return (_jsx(DispatchShell, { title: "New App", description: "Create a workspace app from a prompt and apply the workspace vault policy.", children: _jsx(NewWorkspaceAppFlow, { sourceApp: "dispatch", className: "px-0 py-0" }) }));
}
//# sourceMappingURL=new-app.js.map