import { Container } from "@/components/ui/container";
export function PageHero({eyebrow,title,description}:{eyebrow:string;title:string;description:string}){return <section className="bg-[var(--color-secondary)] py-16 sm:py-20"><Container><div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[.16em] text-[var(--color-primary)]">{eyebrow}</p><h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1><p className="mt-5 text-lg leading-8 text-[var(--color-text-secondary)]">{description}</p></div></Container></section>}

