export const TOOLS_ORDER_CHANGE_EVENT = "extensions-order-change";
const TOOLS_ORDER_KEY = "extensions-order";
export function getToolsOrder() {
    if (typeof window === "undefined")
        return [];
    try {
        const raw = window.localStorage.getItem(TOOLS_ORDER_KEY);
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed)
            ? parsed.filter((id) => typeof id === "string")
            : [];
    }
    catch {
        return [];
    }
}
export function setToolsOrder(order) {
    if (typeof window === "undefined")
        return;
    try {
        window.localStorage.setItem(TOOLS_ORDER_KEY, JSON.stringify(order));
        window.dispatchEvent(new CustomEvent(TOOLS_ORDER_CHANGE_EVENT, { detail: order }));
    }
    catch {
        // localStorage unavailable / quota — ignore, order is best-effort
    }
}
export function applyToolsOrder(items, savedOrder) {
    if (savedOrder.length === 0)
        return items;
    const idToItem = new Map(items.map((item) => [item.id, item]));
    const ordered = [];
    for (const id of savedOrder) {
        const item = idToItem.get(id);
        if (item) {
            ordered.push(item);
            idToItem.delete(id);
        }
    }
    for (const item of idToItem.values()) {
        ordered.push(item);
    }
    return ordered;
}
//# sourceMappingURL=extension-order.js.map