import { NextResponse } from "next/server";
import { createSign } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Provider = "ga4" | "gsc" | "bing";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function requireSuperAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: jsonError("Please sign in.", 401) };
  const { data: isAdmin, error: adminError } = await supabase.rpc("is_super_admin");
  if (adminError || isAdmin !== true) return { error: jsonError("Super Admin access required.", 403) };
  return { error: null };
}

function serviceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Google service account credentials are not configured in the hosting environment.");
  let parsed: { client_email?: string; private_key?: string; token_uri?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON must contain valid service-account JSON.");
  }
  if (!parsed.client_email || !parsed.private_key) throw new Error("Google service-account JSON is missing client_email or private_key.");
  return { email: parsed.client_email, key: parsed.private_key.replace(/\\n/g, "\n"), tokenUri: parsed.token_uri || "https://oauth2.googleapis.com/token" };
}

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\\+/g, "-").replace(/\\//g, "_");
}

async function googleAccessToken(scope: string) {
  const account = serviceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(JSON.stringify({ iss: account.email, scope, aud: account.tokenUri, iat: now, exp: now + 3600 }));
  const unsigned = header + "." + claim;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = unsigned + "." + base64url(signer.sign(account.key));
  const response = await fetch(account.tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) throw new Error("Google OAuth failed. Check the service account key and API access.");
  return String(payload.access_token);
}

async function testGoogle(provider: "ga4" | "gsc") {
  const scope = provider === "ga4"
    ? "https://www.googleapis.com/auth/analytics.readonly"
    : "https://www.googleapis.com/auth/webmasters.readonly";
  const token = await googleAccessToken(scope);
  const headers = { Authorization: "Bearer " + token, "Content-Type": "application/json" };

  if (provider === "ga4") {
    const property = process.env.GA4_PROPERTY_ID;
    if (!property || !/^\\d+$/.test(property)) throw new Error("GA4_PROPERTY_ID is missing or is not a numeric GA4 property ID.");
    const response = await fetch("https://analyticsdata.googleapis.com/v1beta/properties/" + property + ":runReport", {
      method: "POST", headers, body: JSON.stringify({ dateRanges: [{ startDate: "7daysAgo", endDate: "today" }], metrics: [{ name: "sessions" }] }),
      signal: AbortSignal.timeout(15000), cache: "no-store",
    });
    if (!response.ok) throw new Error("GA4 API rejected the request. Check the property ID, API enablement and service-account Viewer access.");
    const data = await response.json();
    return { ok: true, message: "Google Analytics Data API responded successfully.", sampleSessions: Number(data.rows?.[0]?.metricValues?.[0]?.value ?? 0) };
  }

  const site = process.env.GSC_SITE_URL;
  if (!site) throw new Error("GSC_SITE_URL is not configured (for example, sc-domain:twimzi.com).");
  const response = await fetch("https://searchconsole.googleapis.com/webmasters/v3/sites/" + encodeURIComponent(site) + "/searchAnalytics/query", {
    method: "POST", headers, body: JSON.stringify({ startDate: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10), endDate: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10), dimensions: ["query"], rowLimit: 1 }),
    signal: AbortSignal.timeout(15000), cache: "no-store",
  });
  if (!response.ok) throw new Error("Search Console API rejected the request. Check the verified property, API enablement and service-account permissions.");
  const data = await response.json();
  return { ok: true, message: "Google Search Console API responded successfully.", sampleRows: Array.isArray(data.rows) ? data.rows.length : 0 };
}

async function testBing() {
  const key = process.env.BING_WEBMASTER_API_KEY;
  if (!key) throw new Error("BING_WEBMASTER_API_KEY is not configured in the hosting environment.");
  const response = await fetch("https://ssl.bing.com/webmaster/api.svc/json/GetUserSites?apikey=" + encodeURIComponent(key), {
    signal: AbortSignal.timeout(15000), cache: "no-store",
  });
  if (!response.ok) throw new Error("Bing Webmaster API rejected the key. Check that the site is verified and the key is active.");
  const data = await response.json();
  const sites = Array.isArray(data?.d) ? data.d : [];
  const twimzi = sites.some((site: { Url?: string }) => String(site.Url || "").includes("twimzi.com"));
  return { ok: true, message: "Bing Webmaster API responded successfully.", twimziSiteFound: twimzi, sitesVisible: sites.length };
}

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;
  return NextResponse.json({
    providers: {
      ga4: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() && process.env.GA4_PROPERTY_ID?.trim()),
      gsc: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() && process.env.GSC_SITE_URL?.trim()),
      bing: Boolean(process.env.BING_WEBMASTER_API_KEY?.trim()),
    },
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;
  let body: { provider?: Provider };
  try { body = await request.json(); } catch { return jsonError("Invalid request body."); }
  const provider = body.provider;
  if (provider !== "ga4" && provider !== "gsc" && provider !== "bing") return jsonError("Unsupported integration provider.");
  try {
    const result = provider === "bing" ? await testBing() : await testGoogle(provider);
    return NextResponse.json({ ...result, provider, testedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection test failed.";
    return jsonError(message, 502);
  }
}
