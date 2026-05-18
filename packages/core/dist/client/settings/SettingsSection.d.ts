import type { ReactNode } from "react";
interface SettingsSectionProps {
    id?: string;
    icon: ReactNode;
    title: string;
    subtitle?: string;
    badge?: string;
    required?: boolean;
    connected?: boolean;
    open?: boolean;
    onToggle?: () => void;
    children: ReactNode;
}
/**
 * Collapsible settings section card with icon, title, status dot, and optional badge.
 * Controlled via `open` / `onToggle` for accordion behaviour.
 */
export declare function SettingsSection({ id, icon, title, subtitle, badge, required, connected, open, onToggle, children, }: SettingsSectionProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=SettingsSection.d.ts.map