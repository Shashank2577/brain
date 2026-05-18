import { jsx as _jsx } from "react/jsx-runtime";
import { IconLoader2 } from "@tabler/icons-react";
import { cn } from "../../lib/utils.js";
export function Spinner({ className, ...props }) {
    return (_jsx(IconLoader2, { role: "status", "aria-label": "Loading", className: cn("size-4 animate-spin", className), ...props }));
}
//# sourceMappingURL=spinner.js.map