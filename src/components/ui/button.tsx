import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "outline"
  | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const styles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white shadow-[var(--shadow-primary)] hover:bg-[var(--color-primary-dark)] hover:shadow-[var(--shadow-primary)]",

  secondary:
    "bg-[var(--color-secondary)] text-[var(--color-text)] hover:bg-[var(--color-secondary-dark)]",

  accent:
    "bg-[var(--color-accent)] text-white shadow-[var(--shadow-accent)] hover:bg-[var(--color-accent-dark)] hover:shadow-[var(--shadow-accent)]",

  outline:
    "border border-[var(--color-border)] bg-white text-[var(--color-text)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]",

  ghost:
    "text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary-dark)]",
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
      className={`inline-flex min-h-11 items-center justify-center rounded-[var(--radius-lg)] px-5 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary)]/15 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}