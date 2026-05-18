export declare const TOOLS_ORDER_CHANGE_EVENT = "extensions-order-change";
export declare function getToolsOrder(): string[];
export declare function setToolsOrder(order: string[]): void;
export declare function applyToolsOrder<T extends {
    id: string;
}>(items: T[], savedOrder: string[]): T[];
//# sourceMappingURL=extension-order.d.ts.map