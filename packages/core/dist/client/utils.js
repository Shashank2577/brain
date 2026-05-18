import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
/** Merge class names with clsx + tailwind-merge. */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
//# sourceMappingURL=utils.js.map