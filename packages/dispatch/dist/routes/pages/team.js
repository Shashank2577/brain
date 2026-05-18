import { jsx as _jsx } from "react/jsx-runtime";
import { TeamPage } from "@agent-native/core/client/org";
import { DispatchShell } from "../../components/dispatch-shell.js";
export function meta() {
    return [{ title: "Team — Dispatch" }];
}
export default function TeamRoute() {
    return (_jsx(TeamPage, { title: "Team", createOrgDescription: "Set up a team to share dispatch destinations and approvals with your colleagues.", layout: (children) => (_jsx(DispatchShell, { title: "Team", description: "Workspace membership and approval ownership.", children: children })) }));
}
//# sourceMappingURL=team.js.map