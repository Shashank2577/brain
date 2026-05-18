export interface IframeEmbedProps {
    src?: string;
    aspect?: string;
    title?: string;
    height?: number;
}
/**
 * Parses the body of a ```embed fenced block. Accepts simple `key: value`
 * lines, ignoring blanks and unknown keys. No YAML — keeps the surface small.
 */
export declare function parseEmbedBody(body: string): Partial<IframeEmbedProps>;
/**
 * Inline iframe embed for assistant chat. Rendered from a ```embed fenced
 * code block. Same-origin paths only; sandboxed.
 */
export declare function IframeEmbed({ src, aspect, title, height }: IframeEmbedProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=IframeEmbed.d.ts.map