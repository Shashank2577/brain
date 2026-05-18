import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { dedupeCollabUsersByEmail, emailToColor, emailToName, } from "../../collab/client.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "./ui/tooltip.js";
const AVATAR_SIZE = 28;
const OVERLAP = -8;
const BORDER_WIDTH = 2;
const FONT_SIZE = 12;
const AGENT_COLOR = "#00B5FF";
const baseAvatarStyle = {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: FONT_SIZE,
    fontWeight: 700,
    color: "#fff",
    border: `${BORDER_WIDTH}px solid #fff`,
    flexShrink: 0,
    position: "relative",
    cursor: "default",
    boxSizing: "border-box",
};
const containerStyle = {
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
};
const pulseKeyframes = `
@keyframes _anPresencePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
`;
let styleInjected = false;
function injectStyles() {
    if (styleInjected || typeof document === "undefined")
        return;
    const style = document.createElement("style");
    style.textContent = pulseKeyframes;
    document.head.appendChild(style);
    styleInjected = true;
}
function UserAvatar({ user, isFirst }) {
    const color = user.color || emailToColor(user.email);
    const name = user.name || emailToName(user.email);
    const initial = name.charAt(0).toUpperCase();
    return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("div", { style: {
                        ...baseAvatarStyle,
                        backgroundColor: color,
                        marginLeft: isFirst ? 0 : OVERLAP,
                    }, "aria-label": `${name} (${user.email})`, tabIndex: 0, children: initial }) }), _jsx(TooltipContent, { side: "bottom", children: user.email })] }));
}
function AgentAvatar({ active }) {
    injectStyles();
    return (_jsxs("div", { style: {
            display: "flex",
            alignItems: "center",
            gap: 4,
        }, children: [_jsx("div", { style: {
                    ...baseAvatarStyle,
                    backgroundColor: AGENT_COLOR,
                    marginLeft: 0,
                    animation: active ? "_anPresencePulse 2s infinite" : undefined,
                }, title: active ? "AI is editing" : "AI agent", children: "A" }), active && _jsx(AgentEditingChip, {})] }));
}
function AgentEditingChip() {
    return (_jsxs("span", { style: {
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            height: 20,
            padding: "0 8px",
            borderRadius: 9999,
            backgroundColor: `${AGENT_COLOR}20`,
            color: AGENT_COLOR,
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: "nowrap",
        }, children: [_jsx("span", { style: {
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: AGENT_COLOR,
                    animation: "_anPresencePulse 2s infinite",
                    flexShrink: 0,
                } }), "AI editing"] }));
}
function OverflowBadge({ count, isFirst, }) {
    return (_jsxs("div", { style: {
            ...baseAvatarStyle,
            backgroundColor: "rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.5)",
            marginLeft: isFirst ? 0 : OVERLAP,
            fontSize: 10,
        }, title: `${count} more collaborator${count === 1 ? "" : "s"}`, children: ["+", count] }));
}
export function PresenceBar({ activeUsers, agentPresent, agentActive, currentUserEmail, maxVisible = 5, className, }) {
    const { humanUsers, showAgent } = useMemo(() => {
        const currentEmail = currentUserEmail?.trim().toLowerCase();
        const uniqueUsers = dedupeCollabUsersByEmail(activeUsers);
        const humans = uniqueUsers.filter((u) => {
            const email = u.email.trim().toLowerCase();
            return email !== currentEmail && email !== "agent@system";
        });
        const hasAgentUser = uniqueUsers.some((u) => u.email.trim().toLowerCase() === "agent@system");
        return {
            humanUsers: humans,
            showAgent: agentPresent || agentActive || hasAgentUser,
        };
    }, [activeUsers, currentUserEmail, agentPresent, agentActive]);
    const visibleUsers = humanUsers.slice(0, maxVisible);
    const overflowCount = humanUsers.length - visibleUsers.length;
    if (!showAgent && humanUsers.length === 0)
        return null;
    return (_jsx(TooltipProvider, { delayDuration: 150, children: _jsxs("div", { style: containerStyle, className: className, children: [showAgent && _jsx(AgentAvatar, { active: !!agentActive }), visibleUsers.length > 0 && (_jsxs("div", { style: {
                        display: "flex",
                        alignItems: "center",
                        marginLeft: showAgent ? 6 : 0,
                    }, children: [visibleUsers.map((u, i) => (_jsx(UserAvatar, { user: u, isFirst: i === 0 }, u.email))), overflowCount > 0 && (_jsx(OverflowBadge, { count: overflowCount, isFirst: false }))] }))] }) }));
}
//# sourceMappingURL=PresenceBar.js.map