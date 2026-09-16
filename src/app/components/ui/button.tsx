import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost";
  children: ReactNode;
};

const styles = {
  primary:
    "bg-[var(--color-primary)] text-white hover:bg-[#1265D8] shadow-sm hover:shadow-md",
  secondary:
    "bg-[var(--color-secondary)] text-[var(--color-text)] hover:bg-[var(--color-primary-light)]",
  accent:
    "bg-[var(--color-accent)] text-white hover:bg-[#7205C9] shadow-sm hover:shadow-md",
  outline:
    "border border-[var(--color-border)] bg-white text-[var(--color-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",
  ghost:
    "text-[var(--color-text)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]",
};

export function Button({
  variant = "primary",
  children,
  className = "",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center rounded-[var(--radius-lg)] px-5 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

