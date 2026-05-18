import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { IconFile, IconFolder, IconFileText, IconCheckbox, IconMail, IconUser, IconPresentation, IconStack2, IconMessageChatbot, } from "@tabler/icons-react";
const iconProps = { size: 14, className: "shrink-0 text-muted-foreground" };
function MentionIcon({ icon }) {
    switch (icon) {
        case "folder":
            return _jsx(IconFolder, { ...iconProps });
        case "document":
            return _jsx(IconFileText, { ...iconProps });
        case "form":
            return _jsx(IconCheckbox, { ...iconProps });
        case "email":
            return _jsx(IconMail, { ...iconProps });
        case "user":
            return _jsx(IconUser, { ...iconProps });
        case "deck":
            return _jsx(IconPresentation, { ...iconProps });
        case "agent":
            return _jsx(IconMessageChatbot, { ...iconProps });
        case "file":
            return _jsx(IconFile, { ...iconProps });
        default:
            return _jsx(IconStack2, { ...iconProps });
    }
}
const MentionReferenceComponent = ({ node }) => {
    return (_jsx(NodeViewWrapper, { as: "span", className: "inline", children: _jsxs("span", { className: "inline-flex items-center gap-1 rounded-md border border-input bg-muted/50 px-1.5 py-0.5 text-xs font-medium text-foreground align-middle mx-0.5 max-w-[200px] select-none", title: node.attrs.refPath || node.attrs.refId || node.attrs.label, children: [_jsx(MentionIcon, { icon: node.attrs.icon }), _jsx("span", { className: "truncate", children: node.attrs.label })] }) }));
};
export const MentionReference = Node.create({
    name: "mentionReference",
    group: "inline",
    inline: true,
    selectable: true,
    atom: true,
    addAttributes() {
        return {
            label: { default: null },
            icon: { default: "file" },
            source: { default: "" },
            refType: { default: "file" },
            refId: { default: null },
            refPath: { default: null },
        };
    },
    parseHTML() {
        return [{ tag: 'span[data-type="mention-reference"]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return [
            "span",
            mergeAttributes({ "data-type": "mention-reference" }, HTMLAttributes),
        ];
    },
    renderText({ node }) {
        return `@${node.attrs.label}`;
    },
    addNodeView() {
        return ReactNodeViewRenderer(MentionReferenceComponent);
    },
});
//# sourceMappingURL=MentionReference.js.map