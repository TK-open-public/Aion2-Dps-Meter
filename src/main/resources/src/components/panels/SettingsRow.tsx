import type { PropsWithChildren, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface Props {
  title: string;
  description?: ReactNode;
  className?: string;
  align?: "center" | "start";
  rightClassName?: string;
}

export function SettingsRow({
  title,
  description,
  children,
  className,
  align = "center",
  rightClassName,
}: PropsWithChildren<Props>) {
  return (
    <div
      className={cn(
        "flex gap-3 items-center",
        align === "center" ? "items-center" : "items-start",
        className,
      )}>
      <div className="min-w-0 flex-1">
        <div className="text-xs opacity-70">{title}</div>
        {description ? <div className="text-xs opacity-40 mt-1">{description}</div> : null}
      </div>
      <div className={cn("shrink-0", rightClassName)}>{children}</div>
    </div>
  );
}
