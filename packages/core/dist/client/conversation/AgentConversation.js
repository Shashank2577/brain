import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { IconAlertTriangle, IconArrowDown, IconCheck, IconChevronDown, IconCircleX, IconClock, IconExternalLink, IconLoader2, IconTool, } from "@tabler/icons-react";
import { cn } from "../utils.js";
import { useNearBottomAutoscroll } from "./use-near-bottom-autoscroll.js";
export function AgentConversation({ messages, loading = false, error, streaming = false, className, timelineClassName, emptyTitle = "No messages yet", emptyDescription, composer, }) {
    const followKey = `${messages.length}:${messages[messages.length - 1]?.text?.length ?? 0}`;
    const { scrollRef, showScrollToBottom, scrollToBottom } = useNearBottomAutoscroll({
        followKey,
        streaming,
    });
    return (_jsxs("section", { className: cn("agent-conversation", className), children: [error && (_jsxs("div", { className: "agent-conversation__error", role: "alert", children: [_jsx(IconAlertTriangle, { size: 15, strokeWidth: 1.8 }), _jsx("span", { children: error })] })), _jsx("div", { ref: scrollRef, className: cn("agent-conversation__timeline", timelineClassName), children: loading && messages.length === 0 ? (_jsx(ConversationEmpty, { icon: _jsx(IconLoader2, { size: 17, className: "agent-conversation-spin" }), title: "Loading session..." })) : messages.length === 0 ? (_jsx(ConversationEmpty, { icon: _jsx(IconClock, { size: 18 }), title: emptyTitle, description: emptyDescription })) : (messages.map((message) => (_jsx(AgentConversationMessageView, { message: message }, message.id)))) }), showScrollToBottom && (_jsx("button", { type: "button", className: "agent-conversation__scroll-bottom", onClick: scrollToBottom, "aria-label": "Scroll to bottom", children: _jsx(IconArrowDown, { size: 15, strokeWidth: 1.9 }) })), composer] }));
}
function ConversationEmpty({ icon, title, description, }) {
    return (_jsxs("div", { className: "agent-conversation__empty", children: [icon, _jsx("p", { children: title }), description && _jsx("span", { children: description })] }));
}
export function AgentConversationMessageView({ message, }) {
    const parts = message.parts ?? legacyPartsForMessage(message);
    return (_jsxs("article", { className: cn("agent-conversation-message", `agent-conversation-message--${message.role}`, message.pending && "agent-conversation-message--pending"), children: [message.attachments && message.attachments.length > 0 && (_jsx("div", { className: "agent-conversation-message__attachments", children: message.attachments.map((attachment, i) => (_jsx(ConversationAttachmentChip, { attachment: attachment }, `${attachment.name}-${i}`))) })), _jsx("div", { className: "agent-conversation-message__body", children: parts.map((part) => (_jsx(ConversationMessagePartView, { part: part }, part.id))) })] }));
}
function legacyPartsForMessage(message) {
    return [
        ...(message.text
            ? [
                {
                    id: `${message.id}-text`,
                    type: "text",
                    text: message.text,
                },
            ]
            : []),
        ...(message.tools ?? []).map((tool) => ({
            id: `${message.id}-tool-${tool.id}`,
            type: "tool",
            tool,
        })),
        ...(message.notices ?? []).map((notice) => ({
            id: `${message.id}-notice-${notice.id}`,
            type: "notice",
            notice,
        })),
        ...(message.artifacts ?? []).map((artifact) => ({
            id: `${message.id}-artifact-${artifact.id}`,
            type: "artifact",
            artifact,
        })),
    ];
}
function ConversationMessagePartView({ part, }) {
    return (_jsx("div", { className: cn("agent-conversation-message__part", `agent-conversation-message__part--${part.type}`), children: part.type === "text" ? (_jsx(ConversationMarkdown, { text: part.text })) : part.type === "tool" ? (_jsx(ConversationToolCall, { tool: part.tool })) : part.type === "notice" ? (_jsx(ConversationNotice, { notice: part.notice })) : (_jsx(ConversationArtifact, { artifact: part.artifact })) }));
}
let _highlighterLoader = null;
function loadConversationHighlighter() {
    if (!_highlighterLoader) {
        _highlighterLoader = (async () => {
            const [{ createHighlighterCore }, { createOnigurumaEngine }] = await Promise.all([
                import("shiki/core"),
                import("shiki/engine/oniguruma"),
            ]);
            return createHighlighterCore({
                themes: [
                    import("shiki/themes/github-light-default.mjs"),
                    import("shiki/themes/github-dark-default.mjs"),
                ],
                langs: [
                    import("shiki/langs/javascript.mjs"),
                    import("shiki/langs/typescript.mjs"),
                    import("shiki/langs/jsx.mjs"),
                    import("shiki/langs/tsx.mjs"),
                    import("shiki/langs/json.mjs"),
                    import("shiki/langs/css.mjs"),
                    import("shiki/langs/html.mjs"),
                    import("shiki/langs/markdown.mjs"),
                    import("shiki/langs/bash.mjs"),
                    import("shiki/langs/shellscript.mjs"),
                    import("shiki/langs/python.mjs"),
                    import("shiki/langs/yaml.mjs"),
                    import("shiki/langs/sql.mjs"),
                ],
                engine: createOnigurumaEngine(import("shiki/wasm")),
            });
        })().catch((err) => {
            _highlighterLoader = null;
            throw err;
        });
    }
    return _highlighterLoader;
}
const LANG_ALIASES = {
    js: "javascript",
    ts: "typescript",
    sh: "bash",
    shell: "bash",
    zsh: "bash",
    py: "python",
    yml: "yaml",
    md: "markdown",
    bq: "sql",
    bigquery: "sql",
};
function HighlightedCodeBlock({ code, lang }) {
    const [html, setHtml] = useState(null);
    useEffect(() => {
        let cancelled = false;
        loadConversationHighlighter()
            .then((highlighter) => {
            const requested = (lang || "text").toLowerCase();
            const resolved = LANG_ALIASES[requested] ?? requested;
            const loaded = highlighter.getLoadedLanguages();
            const finalLang = loaded.includes(resolved) ? resolved : "text";
            return highlighter.codeToHtml(code, {
                lang: finalLang,
                themes: {
                    light: "github-light-default",
                    dark: "github-dark-default",
                },
                defaultColor: false,
            });
        })
            .then((out) => {
            if (!cancelled)
                setHtml(out);
        })
            .catch(() => {
            if (!cancelled)
                setHtml(null);
        });
        return () => {
            cancelled = true;
        };
    }, [code, lang]);
    if (html) {
        return (_jsx("div", { className: "agent-conversation-shiki", dangerouslySetInnerHTML: { __html: html } }));
    }
    return (_jsx("pre", { children: _jsx("code", { className: lang ? `language-${lang}` : undefined, children: code }) }));
}
function ConversationMarkdown({ text }) {
    return (_jsx("div", { className: "agent-conversation-markdown", children: _jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], urlTransform: (url) => {
                if (url.startsWith("file://"))
                    return url;
                return defaultUrlTransform(url);
            }, components: {
                a({ children, href }) {
                    return (_jsx("a", { href: href, target: "_blank", rel: "noreferrer", onClick: (event) => openMarkdownLink(event, href), children: children }));
                },
                pre(props) {
                    const { children, ...rest } = props;
                    if (React.isValidElement(children)) {
                        const childProps = children.props;
                        const langMatch = (childProps.className ?? "").match(/\blanguage-([\w+-]+)\b/);
                        if (langMatch) {
                            const code = extractCodeText(childProps.children).replace(/\n$/, "");
                            return _jsx(HighlightedCodeBlock, { code: code, lang: langMatch[1] });
                        }
                    }
                    return _jsx("pre", { ...rest, children: children });
                },
            }, children: text }) }));
}
function extractCodeText(node) {
    if (typeof node === "string")
        return node;
    if (typeof node === "number")
        return String(node);
    if (Array.isArray(node))
        return node.map(extractCodeText).join("");
    if (React.isValidElement(node)) {
        return extractCodeText(node.props.children);
    }
    return "";
}
function openMarkdownLink(event, href) {
    if (!href)
        return;
    let url;
    try {
        url = new URL(href, window.location.href);
    }
    catch {
        return;
    }
    if (!["http:", "https:", "mailto:", "tel:"].includes(url.protocol))
        return;
    event.preventDefault();
    window.open(url.href, "_blank", "noopener,noreferrer");
}
function ConversationToolCall({ tool }) {
    const hasDetails = Boolean(tool.input || tool.result);
    const icon = tool.state === "running" || tool.state === "activity" ? (_jsx(IconLoader2, { size: 14, className: "agent-conversation-spin" })) : tool.state === "errored" ? (_jsx(IconCircleX, { size: 14 })) : (_jsx(IconCheck, { size: 14 }));
    const content = (_jsxs(_Fragment, { children: [_jsx("span", { className: "agent-conversation-tool__icon", children: icon }), _jsx("span", { className: "agent-conversation-tool__name", children: tool.name }), tool.summary && (_jsx("span", { className: "agent-conversation-tool__summary", children: tool.summary }))] }));
    if (!hasDetails) {
        return _jsx("div", { className: "agent-conversation-tool", children: content });
    }
    return (_jsxs("details", { className: "agent-conversation-tool", children: [_jsxs("summary", { children: [content, _jsx(IconChevronDown, { size: 13, className: "agent-conversation-tool__chevron" })] }), _jsxs("div", { className: "agent-conversation-tool__details", children: [tool.input && (_jsxs("pre", { children: [_jsx("strong", { children: "input" }), tool.input] })), tool.result && (_jsxs("pre", { children: [_jsx("strong", { children: "result" }), tool.result] }))] })] }));
}
function ConversationNotice({ notice }) {
    return (_jsxs("div", { className: cn("agent-conversation-notice", `agent-conversation-notice--${notice.tone}`), children: [_jsx(IconAlertTriangle, { size: 15 }), _jsxs("div", { children: [notice.title && _jsx("strong", { children: notice.title }), _jsx("span", { children: notice.text })] }), notice.action] }));
}
function ConversationArtifact({ artifact, }) {
    return (_jsxs("div", { className: "agent-conversation-artifact", children: [_jsx(IconTool, { size: 14 }), artifact.path ? (_jsx("code", { children: artifact.path })) : (_jsx("span", { children: artifact.label })), artifact.url && (_jsxs("a", { href: artifact.url, target: "_blank", rel: "noreferrer", children: [_jsx(IconExternalLink, { size: 13 }), "Open"] }))] }));
}
function ConversationAttachmentChip({ attachment, }) {
    if (attachment.dataUrl) {
        return (_jsxs("div", { className: "agent-conversation-attachment agent-conversation-attachment--image", children: [_jsx("img", { src: attachment.dataUrl, alt: attachment.name, className: "agent-conversation-attachment__image" }), _jsx("span", { className: "agent-conversation-attachment__name", children: attachment.name })] }));
    }
    return (_jsxs("div", { className: "agent-conversation-attachment agent-conversation-attachment--file", children: [_jsx("span", { className: "agent-conversation-attachment__name", children: attachment.name }), attachment.size !== undefined && (_jsx("span", { className: "agent-conversation-attachment__size", children: formatBytes(attachment.size) }))] }));
}
function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
//# sourceMappingURL=AgentConversation.js.map