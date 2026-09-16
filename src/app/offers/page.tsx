import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";

const offers = [
  "New Customer Offer",
  "Seasonal Business Deal",
  "Local Service Discount",
  "Product Launch Offer",
];

export default function Offers() {
  return (
    <>
      <PageHero
        eyebrow="Offers"
        title="Local offers worth discovering."
        description="See promotions and special offers shared by businesses around your community."
      />

      <Container>
        <div className="grid gap-5 py-14 md:grid-cols-2">
          {offers.map((offer) => (
            <article
              key={offer}
              className="rounded-2xl border border-[var(--color-border)] bg-white p-7"
            >
              <span className="rounded-full bg-[var(--color-accent-light)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
                LIMITED OFFER
              </span>

              <h2 className="mt-5 text-xl font-bold">{offer}</h2>

              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                A sample Twimzi offer card ready to connect with real business
                data.
              </p>

              <button className="mt-5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white">
                View offer
              </button>
            </article>
          ))}
        </div>
      </Container>
    </>
  );
}
