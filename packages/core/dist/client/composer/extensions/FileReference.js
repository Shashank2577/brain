import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { IconFile, IconFolder } from "@tabler/icons-react";
const FileReferenceComponent = ({ node }) => {
    const isFolder = node.attrs.path?.endsWith("/");
    const cleanPath = isFolder ? node.attrs.path.slice(0, -1) : node.attrs.path;
    const displayName = cleanPath.split("/").pop() || cleanPath;
    return (_jsx(NodeViewWrapper, { as: "span", className: "inline", children: _jsxs("span", { className: "inline-flex items-center gap-1 rounded-md border border-input bg-muted/50 px-1.5 py-0.5 text-xs font-medium text-foreground align-middle mx-0.5 max-w-[200px] select-none", title: node.attrs.path, children: [isFolder ? (_jsx(IconFolder, { size: 14, className: "shrink-0 text-muted-foreground" })) : (_jsx(IconFile, { size: 14, className: "shrink-0 text-muted-foreground" })), _jsx("span", { className: "truncate", children: displayName })] }) }));
};
export const FileReference = Node.create({
    name: "fileReference",
    group: "inline",
    inline: true,
    selectable: true,
    atom: true,
    addAttributes() {
        return {
            path: { default: null },
            source: { default: "codebase" },
        };
    },
    parseHTML() {
        return [{ tag: 'span[data-type="file-reference"]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return [
            "span",
            mergeAttributes({ "data-type": "file-reference" }, HTMLAttributes),
        ];
    },
    addNodeView() {
        return ReactNodeViewRenderer(FileReferenceComponent);
    },
});
//# sourceMappingURL=FileReference.js.map