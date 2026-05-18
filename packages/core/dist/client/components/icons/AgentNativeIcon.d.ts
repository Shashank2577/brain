import type { SVGProps } from "react";
interface AgentNativeIconProps extends Omit<SVGProps<SVGSVGElement>, "fill"> {
    /**
     * Pixel size for the icon. Mirrors the Tabler icons API so this can be a
     * drop-in replacement for `<IconMessageDots size={16} />` etc. If you want
     * className-driven sizing instead (e.g. `w-4 h-4`), omit `size` — the SVG
     * will fill its container based on the className.
     */
    size?: number | string;
}
/**
 * Brain icon — used as the app logo throughout the UI.
 */
export declare function AgentNativeIcon({ size, className, ...rest }: AgentNativeIconProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=AgentNativeIcon.d.ts.map