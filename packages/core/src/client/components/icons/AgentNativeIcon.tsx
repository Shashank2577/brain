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
export function AgentNativeIcon({
  size = 24,
  className,
  ...rest
}: AgentNativeIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <path d="M15.5 13a3.5 3.5 0 0 0-3.5 3.5v1a3.5 3.5 0 0 0 7 0v-1.8" />
      <path d="M8.5 13A3.5 3.5 0 0 1 12 16.5v1a3.5 3.5 0 0 1-7 0v-1.8" />
      <path d="M17.5 12a2.5 2.5 0 0 0 0-5A4.9 4.9 0 0 0 12 3a4.9 4.9 0 0 0-5.5 4 2.5 2.5 0 0 0 0 5" />
      <path d="M12 3v9" />
      <path d="M6.5 12c0-1 .5-2 1.5-2.5" />
      <path d="M17.5 12c0-1-.5-2-1.5-2.5" />
    </svg>
  );
}
