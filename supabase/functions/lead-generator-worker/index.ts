import { createClient } from "npm:@supabase/supabase-js@2.117.1";

type JsonRecord = Record<string, unknown>;
type Counts = { seen: number; inserted: number; duplicate: number; rejected: number };

const MAX_BODY_BYTES = 2 * 1024 * 1024;
const MAX_RECORDS = 100;
const FETCH_TIMEOUT_MS = 12_000;
const USER_AGENT = "TwimziLeadResearchBot/1.0 (+https://www.twimzi.com/contact)";
const ALLOWED_FIELDS = new Set([
  "business_name", "category", "business_email", "business_phone", "website",
  "address", "city", "district", "state", "professional_contact_name",
  "professional_designation", "professional_work_email",
]);

function json(body: JsonRecord, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
function envKey() {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      if (parsed.default) return parsed.default;
    } catch { /* legacy key fallback */ }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}
function getPath(value: unknown, path: string): unknown {
  if (!path) return value;
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
    return (current as JsonRecord)[key];
  }, value);
}
function normalizeText(value: unknown, max = 300): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const result = String(value).replace(/\s+/g, " ").trim().slice(0, max);
  return result || null;
}
function normalizeEmail(value: unknown): string | null {
  const email = normalizeText(value, 254)?.toLowerCase();
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
function normalizePhone(value: unknown): string | null {
  const phone = normalizeText(value, 40);
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, "");
  return digits.length >= 7 && digits.length <= 15 ? phone : null;
}
function safeUrl(value: string): URL {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password || url.port && url.port !== "443") {
    throw new Error("Source URL must be HTTPS on the standard port and contain no credentials.");
  }
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") ||
      host.endsWith(".internal") || /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
      host.includes(":") || !host.includes(".")) {
    throw new Error("Private, local and IP-literal hosts are not permitted.");
  }
  return url;
}
function validateMapping(config: unknown) {
  if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error("Source JSON mapping is missing.");
  const c = config as JsonRecord;
  const itemsPath = typeof c.items_path === "string" ? c.items_path : "";
  const fields = c.fields;
  if (!itemsPath || itemsPath.split(".").length > 6 || !fields || typeof fields !== "object" || Array.isArray(fields)) {
    throw new Error("Mapping requires items_path and a fields object.");
  }
  const mapped: Record<string, string> = {};
  for (const [field, path] of Object.entries(fields as JsonRecord)) {
    if (!ALLOWED_FIELDS.has(field) || typeof path !== "string" || !path || path.split(".").length > 6) continue;
    mapped[field] = path;
  }
  if (!mapped.business_name) throw new Error("Mapping must include business_name.");
  return { itemsPath, fields: mapped };
}
function mapRecord(record: unknown, mapping: ReturnType<typeof validateMapping>, permitted: string[]) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return null;
  const result: JsonRecord = {};
  for (const [field, path] of Object.entries(mapping.fields)) {
    if (!permitted.includes(field)) continue;
    const raw = getPath(record, path);
    if (field === "business_email" || field === "professional_work_email") result[field] = normalizeEmail(raw);
    else if (field === "business_phone") result[field] = normalizePhone(raw);
    else result[field] = normalizeText(raw, field === "address" ? 500 : 200);
  }
  return result.business_name ? result : null;
}
function isPrivateIpv4(ip: string) {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  return p[0] === 10 || p[0] === 127 || p[0] === 0 || p[0] >= 224 ||
    p[0] === 169 && p[1] === 254 || p[0] === 172 && p[1] >= 16 && p[1] <= 31 ||
    p[0] === 192 && p[1] === 168;
}
async function assertPublicDns(host: string) {
  const results = await Promise.allSettled([Deno.resolveDns(host, "A"), Deno.resolveDns(host, "AAAA")]);
  const ips = results.flatMap(result => result.status === "fulfilled" ? result.value : []);
  if (!ips.length) throw new Error("Could not verify the source host's public DNS address.");
  if (ips.some(ip => ip.includes(":") || isPrivateIpv4(ip))) {
    throw new Error("Source host resolves to a private or reserved network address.");
  }
}
async function readBounded(response: Response) {
  const declared = Number(response.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) throw new Error("Source response exceeds the 2 MB limit.");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Source returned an empty response.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) throw new Error("Source response exceeds the 2 MB limit.");
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}
async function fetchJson(url: URL) {
  await assertPublicDns(url.hostname);
  const response = await fetch(url, {
    method: "GET",
    redirect: "error",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "Accept": "application/json", "User-Agent": USER_AGENT },
  });
  if (!response.ok) throw new Error("Source returned HTTP " + response.status + ".");
  const type = (response.headers.get("content-type") ?? "").toLowerCase();
  if (!type.includes("application/json") && !type.includes("+json")) throw new Error("Source did not return JSON.");
  return { status: response.status, body: await readBounded(response) };
}
function normalizeName(value: unknown) {
  return (normalizeText(value, 200) ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function websiteHost(value: unknown) {
  const raw = normalizeText(value, 500);
  if (!raw) return null;
  try { return new URL(raw.startsWith("http") ? raw : "https://" + raw).hostname.toLowerCase().replace(/^www\./, ""); }
  catch { return null; }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "POST required." }, 405);
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = envKey();
  const expectedBearer = serviceKey ? "Bearer " + serviceKey : "";
  if (!expectedBearer || request.headers.get("authorization") !== expectedBearer) {
    return json({ error: "Unauthorized." }, 401);
  }
  if (!supabaseUrl || !serviceKey) return json({ error: "Worker is not configured." }, 503);

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: candidates, error: queueError } = await admin.from("lead_generator_jobs")
    .select("id,source_id,region_state,districts,categories")
    .eq("status", "queued").not("source_id", "is", null)
    .order("created_at", { ascending: true }).limit(1);
  if (queueError) return json({ error: "Could not read job queue." }, 500);
  const candidate = candidates?.[0];
  if (!candidate) return json({ message: "No queued source-specific jobs." });

  const { data: claimed, error: claimError } = await admin.from("lead_generator_jobs")
    .update({ status: "running", started_at: new Date().toISOString(), last_error: null })
    .eq("id", candidate.id).eq("status", "queued").select("id,source_id,region_state,districts,categories").maybeSingle();
  if (claimError || !claimed) return json({ message: "Another worker claimed the next job. Retry shortly." }, 409);

  let sourceId = claimed.source_id as string;
  let logId: string | null = null;
  const counts: Counts = { seen: 0, inserted: 0, duplicate: 0, rejected: 0 };
  try {
    const { data: source, error: sourceError } = await admin.from("lead_generator_sources")
      .select("id,name,source_url,permission_status,enabled,allowed_states,allowed_categories,permitted_fields,crawl_interval_hours,max_requests_per_hour,feed_format,feed_config,last_checked_at,terms_url")
      .eq("id", sourceId).maybeSingle();
    if (sourceError || !source) throw new Error("Approved source was not found.");
    if (source.permission_status !== "approved" || source.enabled !== true) throw new Error("Source is not approved and enabled.");
    if (!source.allowed_states.includes(claimed.region_state)) throw new Error("Job region is outside source approval.");
    if (source.allowed_categories.length && claimed.categories.some((c: string) => !source.allowed_categories.includes(c))) throw new Error("Job categories exceed source approval.");
    if (source.feed_format !== "json") throw new Error("Only explicitly mapped JSON feeds are supported in v1.");

    const minIntervalMs = Math.max(60_000, 3_600_000 / Math.max(1, source.max_requests_per_hour));
    const sourceUrl = safeUrl(source.source_url);
    const cutoff = new Date(Date.now() - minIntervalMs).toISOString();
    const reservedAt = new Date().toISOString();
    const { data: reservation, error: reservationError } = await admin.from("lead_generator_sources")
      .update({ last_checked_at: reservedAt, last_status: "fetch_started" })
      .eq("id", source.id).or("last_checked_at.is.null,last_checked_at.lt." + cutoff)
      .select("id").maybeSingle();
    if (reservationError || !reservation) throw new Error("Source request rate limit is active. Retry after the source cooldown.");
    const mapping = validateMapping(source.feed_config);
    const permitted = (source.permitted_fields ?? []).filter((field: string) => ALLOWED_FIELDS.has(field));
    if (!permitted.includes("business_name")) throw new Error("business_name is not permitted for this source.");

    const { data: log, error: logError } = await admin.from("lead_generator_fetch_log")
      .insert({ source_id: source.id, job_id: claimed.id, outcome: "started" }).select("id").single();
    if (logError) throw new Error("Could not create source audit record.");
    logId = log.id;

    const { status, body } = await fetchJson(sourceUrl);
    await admin.from("lead_generator_sources").update({ last_status: "HTTP " + status }).eq("id", source.id);
    const payload = JSON.parse(body) as unknown;
    const items = getPath(payload, mapping.itemsPath);
    if (!Array.isArray(items)) throw new Error("Configured items_path did not resolve to an array.");
    const records = items.slice(0, MAX_RECORDS);
    for (const raw of records) {
      counts.seen++;
      const mapped = mapRecord(raw, mapping, permitted);
      if (!mapped) { counts.rejected++; continue; }
      const name = String(mapped.business_name);
      const city = normalizeText(mapped.city, 120);
      const state = normalizeText(mapped.state, 120) ?? claimed.region_state;
      const category = normalizeText(mapped.category, 120);
      if (state.toLowerCase() !== String(claimed.region_state).toLowerCase()) { counts.rejected++; continue; }
      if (claimed.districts?.length && mapped.district && !claimed.districts.some((d: string) => d.toLowerCase() === String(mapped.district).toLowerCase())) { counts.rejected++; continue; }
      if (claimed.categories?.length && (!category || !claimed.categories.includes(category))) { counts.rejected++; continue; }
      const domain = websiteHost(mapped.website);
      const normalized = normalizeName(name);
      let duplicateQuery = admin.from("admin_contact_bank").select("id").eq("contact_type", "business").limit(1);
      if (domain) duplicateQuery = duplicateQuery.eq("website_domain", domain).ilike("full_name", name);
      else if (city) duplicateQuery = duplicateQuery.ilike("full_name", name).ilike("city", city).ilike("state", state);
      else { counts.rejected++; continue; }
      const { data: duplicates, error: duplicateError } = await duplicateQuery;
      if (duplicateError) throw new Error("Could not perform duplicate check.");
      if (duplicates?.length) { counts.duplicate++; continue; }

      const row: JsonRecord = {
        full_name: name, company_name: name, contact_type: "business",
        source: source.name, source_type: "lead_generator", source_url: source.source_url,
        source_collected_at: new Date().toISOString(), source_last_checked_at: new Date().toISOString(),
        email_kind: mapped.professional_work_email ? "professional_work" : "business",
        review_status: "pending", verification_status: "unverified",
        collection_basis: "Source permission reviewed by Twimzi Super Admin; source terms: " + (source.terms_url ?? "recorded in source registry"),
        email_marketing_consent: false, whatsapp_marketing_consent: false, do_not_contact: false,
      };
      if (mapped.business_email) row.email = mapped.business_email;
      else if (mapped.professional_work_email) row.email = mapped.professional_work_email;
      if (mapped.business_phone) row.phone = mapped.business_phone;
      if (mapped.address) row.business_address = mapped.address;
      if (city) row.city = city;
      if (mapped.district) row.district = mapped.district;
      row.state = state;
      if (mapped.website) row.website = mapped.website;
      if (domain) row.website_domain = domain;
      if (category) row.business_category = category;
      if (mapped.professional_contact_name) row.professional_contact_name = mapped.professional_contact_name;
      if (mapped.professional_designation) row.professional_contact_designation = mapped.professional_designation;
      const { error: insertError } = await admin.from("admin_contact_bank").insert(row);
      if (insertError) {
        if (insertError.code === "23505") counts.duplicate++;
        else throw new Error("Could not save a collected business record.");
      } else counts.inserted++;
    }
    const finalStatus = items.length > MAX_RECORDS ? "completed" : "completed";
    await admin.from("lead_generator_jobs").update({
      status: finalStatus, processed_count: counts.seen, inserted_count: counts.inserted,
      duplicate_count: counts.duplicate, rejected_count: counts.rejected, finished_at: new Date().toISOString(),
    }).eq("id", claimed.id);
    await admin.from("lead_generator_fetch_log").update({
      outcome: "completed", http_status: 200, records_seen: counts.seen, records_inserted: counts.inserted,
      records_duplicate: counts.duplicate, records_rejected: counts.rejected,
    }).eq("id", logId);
    return json({ job_id: claimed.id, status: "completed", counts });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Worker failed.";
    await admin.from("lead_generator_jobs").update({
      status: "failed", last_error: message, processed_count: counts.seen,
      inserted_count: counts.inserted, duplicate_count: counts.duplicate,
      rejected_count: counts.rejected, finished_at: new Date().toISOString(),
    }).eq("id", claimed.id);
    if (logId) await admin.from("lead_generator_fetch_log").update({ outcome: "failed", records_seen: counts.seen,
      records_inserted: counts.inserted, records_duplicate: counts.duplicate,
      records_rejected: counts.rejected, error_message: message }).eq("id", logId);
    return json({ job_id: claimed.id, error: message, counts }, 422);
  }
});
