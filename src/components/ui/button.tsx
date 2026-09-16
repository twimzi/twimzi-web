import type { ButtonHTMLAttributes, ReactNode } from "react";
type Props=ButtonHTMLAttributes<HTMLButtonElement>&{variant?:"primary"|"secondary"|"accent"|"outline"|"ghost";children:ReactNode};
const styles={primary:"bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]",secondary:"bg-[var(--color-secondary)] text-[var(--color-text)] hover:bg-[var(--color-border)]",accent:"bg-[var(--color-accent)] text-white hover:opacity-90",outline:"border border-[var(--color-border)] bg-white hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",ghost:"hover:bg-[var(--color-secondary)]"};
export function Button({variant="primary",children,className="",type="button",...props}:Props){return <button type={type} className={`inline-flex min-h-11 items-center justify-center rounded-[var(--radius-lg)] px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 ${styles[variant]} ${className}`} {...props}>{children}</button>}

