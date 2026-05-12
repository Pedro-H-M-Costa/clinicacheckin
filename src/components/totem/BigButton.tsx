import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BigButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  variant?: "primary" | "secondary";
}

export function BigButton({
  icon,
  title,
  subtitle,
  variant = "primary",
  className,
  ...props
}: BigButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "group flex w-full items-center gap-8 rounded-3xl px-10 py-10 text-left transition-all duration-200 active:scale-[0.98]",
        variant === "primary" &&
          "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-touch)] hover:brightness-110",
        variant === "secondary" &&
          "border-2 border-border bg-card text-foreground shadow-[var(--shadow-card)] hover:border-primary",
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            "flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl",
            variant === "primary" ? "bg-white/20" : "bg-secondary text-primary"
          )}
        >
          {icon}
        </div>
      )}
      <div className="flex-1">
        <p className="text-4xl font-bold leading-tight">{title}</p>
        {subtitle && (
          <p
            className={cn(
              "mt-2 text-2xl",
              variant === "primary" ? "text-primary-foreground/85" : "text-muted-foreground"
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
    </button>
  );
}
