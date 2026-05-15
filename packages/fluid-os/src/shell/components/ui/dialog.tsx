import type { ReactNode } from "react";
import { IconX } from "@tabler/icons-react";
import { cn } from "../../lib/cn";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "default" | "lg";
}

export function Dialog({ open, onClose, title, description, children, footer, size = "default" }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm">
      <div
        className={cn(
          "bg-card text-card-foreground border border-border rounded-lg shadow-xl w-full max-h-[90vh] flex flex-col",
          size === "lg" ? "max-w-3xl" : "max-w-md",
        )}
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold leading-none">{title}</h2>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
            <IconX size={18} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-border flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
