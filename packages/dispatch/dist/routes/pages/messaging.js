import { jsx as _jsx } from "react/jsx-runtime";
import { MessagingSetupPanel } from "../../components/messaging-setup-panel.js";
import { DispatchShell } from "../../components/dispatch-shell.js";
export function meta() {
    return [{ title: "Messaging — Dispatch" }];
}
export default function MessagingRoute() {
    return (_jsx(DispatchShell, { title: "Messaging", description: "Connect Slack and Telegram directly in dispatch so inbound conversations come through one place.", children: _jsx(MessagingSetupPanel, {}) }));
}
//# sourceMappingURL=messaging.js.map