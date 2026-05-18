export const coreChatScripts = {
    "search-chats": (args) => import("./search-chats.js").then((m) => m.default(args)),
    "open-chat": (args) => import("./open-chat.js").then((m) => m.default(args)),
};
//# sourceMappingURL=index.js.map