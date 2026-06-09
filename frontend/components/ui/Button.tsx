"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "ghost" | "outline" | "destructive" | "subtle";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[color:var(--primary)] text-[color:var(--text-primary)] shadow-[0_0_0_1px_rgba(13,148,136,0.24),0_0_20px_rgba(13,148,136,0.18)] hover:bg-[color:var(--primary-hover)] hover:shadow-[0_0_0_1px_rgba(13,148,136,0.42),0_0_28px_rgba(13,148,136,0.28)]",
  ghost:
    "bg-transparent text-[color:var(--text-primary)] hover:bg-[color:var(--bg-subtle)] hover:text-[color:var(--text-primary)]",
  outline:
    "border border-[color:var(--border)] bg-transparent text-[color:var(--text-primary)] hover:border-[color:var(--border-active)] hover:bg-[color:var(--bg-subtle)]",
  destructive:
    "bg-[color:var(--error)] text-white hover:bg-[#ff8c8c] shadow-[0_0_0_1px_rgba(248,113,113,0.22),0_0_20px_rgba(248,113,113,0.16)]",
  subtle:
    "bg-[color:var(--bg-subtle)] text-[color:var(--text-primary)] hover:bg-[color:var(--bg-elevated)]"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
  icon: "h-10 w-10 p-0"
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  allowWrap?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  loading,
  allowWrap = false,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-xl font-medium transition duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-60",
        "select-none active:scale-[0.99]",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? (
        <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        leftIcon
      )}
      <span className={allowWrap ? "text-center" : "whitespace-nowrap"}>{children}</span>
      {!loading && rightIcon}
    </button>
  );
}
