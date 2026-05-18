import { jsx as _jsx } from "react/jsx-runtime";
import { IconGripVertical } from "@tabler/icons-react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "../../lib/utils.js";
const ResizablePanelGroup = ({ className, ...props }) => (_jsx(ResizablePrimitive.Group, { className: cn("flex h-full w-full aria-[orientation=vertical]:flex-col", className), ...props }));
const ResizablePanel = ResizablePrimitive.Panel;
const ResizableHandle = ({ withHandle, className, ...props }) => (_jsx(ResizablePrimitive.Separator, { className: cn("relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 aria-[orientation=vertical]:h-px aria-[orientation=vertical]:w-full aria-[orientation=vertical]:after:left-0 aria-[orientation=vertical]:after:h-1 aria-[orientation=vertical]:after:w-full aria-[orientation=vertical]:after:-translate-y-1/2 aria-[orientation=vertical]:after:translate-x-0 [&[aria-orientation=vertical]>div]:rotate-90", className), ...props, children: withHandle && (_jsx("div", { className: "z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border", children: _jsx(IconGripVertical, { className: "h-2.5 w-2.5" }) })) }));
export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
//# sourceMappingURL=resizable.js.map