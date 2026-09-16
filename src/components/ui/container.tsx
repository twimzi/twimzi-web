import type { HTMLAttributes, ReactNode } from "react";
export function Container({children,className="",...props}:{children:ReactNode}&HTMLAttributes<HTMLDivElement>){return <div className={`twimzi-container ${className}`} {...props}>{children}</div>}

