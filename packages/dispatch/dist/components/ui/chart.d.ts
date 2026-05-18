import * as React from "react";
import * as RechartsPrimitive from "recharts";
declare const THEMES: {
    readonly light: "";
    readonly dark: ".dark";
};
export type ChartConfig = {
    [k in string]: {
        label?: React.ReactNode;
        icon?: React.ComponentType;
    } & ({
        color?: string;
        theme?: never;
    } | {
        color?: never;
        theme: Record<keyof typeof THEMES, string>;
    });
};
declare const ChartContainer: React.ForwardRefExoticComponent<Omit<React.ClassAttributes<HTMLDivElement> & React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const ChartStyle: ({ id, config }: {
    id: string;
    config: ChartConfig;
}) => import("react/jsx-runtime").JSX.Element;
declare const ChartTooltip: typeof RechartsPrimitive.Tooltip;
declare const ChartTooltipContent: React.ForwardRefExoticComponent<Omit<Omit<RechartsPrimitive.DefaultTooltipContentProps<string | number, string>, "payload" | "label" | "active" | "viewBox" | "coordinate" | "accessibilityLayer"> & {
    active?: boolean;
    allowEscapeViewBox?: import("recharts/types/util/types").AllowInDimension;
    animationDuration?: import("recharts/types/util/types").AnimationDuration;
    animationEasing?: import("recharts/types/util/types").AnimationTiming;
    axisId?: RechartsPrimitive.AxisId;
    content?: import("recharts/types/component/Tooltip").ContentType<string | number, string>;
    contentStyle?: React.CSSProperties;
    cursor?: import("recharts/types/component/Cursor").CursorDefinition;
    defaultIndex?: number | RechartsPrimitive.TooltipIndex;
    filterNull?: boolean;
    formatter?: (value: string | number, name: string, item: import("recharts/types/state/tooltipSlice").TooltipPayloadEntry, index: number, payload: RechartsPrimitive.TooltipPayload) => React.ReactNode | [React.ReactNode, React.ReactNode];
    includeHidden?: boolean | undefined;
    isAnimationActive?: boolean | "auto";
    itemSorter?: RechartsPrimitive.TooltipItemSorter;
    itemStyle?: React.CSSProperties;
    labelFormatter?: (label: any, payload: RechartsPrimitive.TooltipPayload) => React.ReactNode;
    labelStyle?: React.CSSProperties;
    offset?: number | RechartsPrimitive.Coordinate;
    payloadUniqBy?: import("recharts/types/util/payload/getUniqPayload").UniqueOption<import("recharts/types/state/tooltipSlice").TooltipPayloadEntry>;
    portal?: HTMLElement | null;
    position?: Partial<RechartsPrimitive.Coordinate>;
    reverseDirection?: import("recharts/types/util/types").AllowInDimension;
    separator?: string;
    shared?: boolean;
    trigger?: import("recharts/types/chart/types").TooltipTrigger;
    useTranslate3d?: boolean;
    wrapperStyle?: React.CSSProperties;
} & React.ClassAttributes<HTMLDivElement> & React.HTMLAttributes<HTMLDivElement> & {
    active?: boolean;
    payload?: ReadonlyArray<RechartsPrimitive.TooltipPayloadEntry<string | number, string>>;
    label?: React.ReactNode;
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
}, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const ChartLegend: React.MemoExoticComponent<(outsideProps: RechartsPrimitive.LegendProps) => React.ReactPortal | null>;
declare const ChartLegendContent: React.ForwardRefExoticComponent<Omit<React.ClassAttributes<HTMLDivElement> & React.HTMLAttributes<HTMLDivElement> & {
    payload?: Array<{
        value: string;
        color?: string;
        dataKey?: string | number;
        type?: string;
    }>;
    verticalAlign?: "top" | "bottom";
} & {
    hideIcon?: boolean;
    nameKey?: string;
}, "ref"> & React.RefAttributes<HTMLDivElement>>;
export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle, };
//# sourceMappingURL=chart.d.ts.map