import Link from "next/link";
import IntegrationTestButton from "./integration-test-button";

export const dynamic = "force-dynamic";

type Integration = {
  name: string;
  description: string;
  variables: string[];
  setup: string[];
  href: string;
};

const integrations: Integration[] = [
  {
    name: "Google Analytics 4",
    description: "Website users, sessions, acquisition channels, landing pages, engagement and key events.",
    variables: ["GOOGLE_SERVICE_ACCOUNT_JSON", "GA4_PROPERTY_ID"],
    setup: [
      "Create a Google Cloud service account and enable the Google Analytics Data API.",
      "Add its service-account email to the GA4 property with Viewer access.",
      "Set the GA4 numeric Property ID in the hosting environment.",
    ],
    href: "https://analytics.google.com/",
  },
  {
    name: "Google Search Console",
    description: "Search clicks, impressions, CTR, average position, queries, pages and indexing diagnostics.",
    variables: ["GOOGLE_SERVICE_ACCOUNT_JSON", "GSC_SITE_URL"],
    setup: [
      "Add the same service-account email as a user of the verified sc-domain:twimzi.com property.",
      "Enable the Google Search Console API in the Google Cloud project.",
      "Set GSC_SITE_URL to sc-domain:twimzi.com.",
    ],
    href: "https://search.google.com/search-console",
  },
  {
    name: "Bing Webmaster Tools",
    description: "Bing search performance, query and page reports, crawl information and sitemap status.",
    variables: ["BING_WEBMASTER_API_KEY"],
    setup: [
      "Verify twimzi.com in Bing Webmaster Tools and submit the XML sitemap.",
      "Generate an API key in Bing Webmaster Tools settings.",
      "Store the API key only in the hosting environment; never in browser code.",
    ],
    href: "https://www.bing.com/webmasters/",
  },
];

function isConfigured(name: string) {
  return Boolean(process.env[name]?.trim());
}

export default function AdminIntegrationsPage() {
  const serviceAccountReady = isConfigured("GOOGLE_SERVICE_ACCOUNT_JSON");
  const gaReady = serviceAccountReady && isConfigured("GA4_PROPERTY_ID");
  const gscReady = serviceAccountReady && isConfigured("GSC_SITE_URL");
  const bingReady = isConfigured("BING_WEBMASTER_API_KEY");

  const configured = [gaReady, gscReady, bingReady].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary)]">
            Data connections
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--color-text)]">
            Analytics &amp; Search Intelligence
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            Connect first-party Google and Bing reporting to the Twimzi Super Admin.
            Credentials are read only on the server and are never displayed here.
          </p>
        </div>
        <Link
          href="/admin/analytics"
          className="inline-flex w-fit items-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)]"
        >
          Open Twimzi event analytics
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-sm text-[var(--color-text-muted)]">External integrations configured</p>
          <p className="mt-2 text-3xl font-bold text-[var(--color-text)]">{configured} / 3</p>
        </article>
        <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-sm text-[var(--color-text-muted)]">Google service account</p>
          <p className={`mt-2 text-lg font-bold ${serviceAccountReady ? "text-emerald-700" : "text-amber-700"}`}>
            {serviceAccountReady ? "Credential detected" : "Setup required"}
          </p>
        </article>
        <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-sm text-[var(--color-text-muted)]">Bing API access</p>
          <p className={`mt-2 text-lg font-bold ${bingReady ? "text-emerald-700" : "text-amber-700"}`}>
            {bingReady ? "Key detected" : "Setup required"}
          </p>
        </article>
      </section>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-950">
        <p className="font-bold">Security and connection model</p>
        <p className="mt-1">
          Add credentials as server-side environment variables in Hostinger. Do not paste
          private keys into this page, GitHub source files, public Supabase settings or
          NEXT_PUBLIC variables. Google service-account access must be explicitly granted
          to both the GA4 property and Search Console property.
        </p>
      </div>

      <section className="grid gap-5 xl:grid-cols-3">
        {integrations.map((item) => {
          const ready = item.name === "Google Analytics 4"
            ? gaReady
            : item.name === "Google Search Console"
              ? gscReady
              : bingReady;
          return (
            <article key={item.name} className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text)]">{item.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{item.description}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
                  {ready ? "Credentials detected" : "Not configured"}
                </span>
              </div>

              <div className="mt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Required server variables</h3>
                <ul className="mt-2 space-y-2">
                  {item.variables.map((variable) => (
                    <li key={variable} className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">{variable}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 flex-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Setup checklist</h3>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-5 text-[var(--color-text-secondary)]">
                  {item.setup.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </div>

              <Link
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex w-fit items-center rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)]"
              >
                Open {item.name}
              </Link>
              <IntegrationTestButton
                provider={item.name === "Google Analytics 4" ? "ga4" : item.name === "Google Search Console" ? "gsc" : "bing"}
                configured={ready}
              />
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
        <h2 className="font-bold text-[var(--color-text)]">What will appear after credentials are added</h2>
        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Traffic overview", "Users, sessions, acquisition channels and engagement trends."],
            ["Search performance", "Google and Bing clicks, impressions, CTR and query rankings."],
            ["Landing page intelligence", "Top entry pages, organic conversions and pages losing visibility."],
            ["Indexing & crawl health", "Indexed URL checks, sitemap state and actionable crawl diagnostics."],
          ].map(([title, description]) => (
            <div key={title} className="rounded-xl bg-slate-50 p-4">
              <p className="font-semibold text-[var(--color-text)]">{title}</p>
              <p className="mt-1 leading-5 text-[var(--color-text-muted)]">{description}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-[var(--color-text-muted)]">
          This screen currently reports credential presence only. Live reports and connection
          tests will become available after the server credentials and property identifiers
          are configured; no external metrics are fabricated or shown as connected.
        </p>
      </section>
    </div>
  );
}
