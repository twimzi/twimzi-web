import { createClient } from "npm:@supabase/supabase-js@2.117.1";

type JsonRecord = Record<string, unknown>;
type Counts = { seen: number; inserted: number; duplicate: number; rejected: number };

const MAX_BODY_BYTES = 2 * 1024 * 1024;
const MAX_ROBOTS_BYTES = 256 * 1024;
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
function normalizePhoneKey(value: unknown): string | null {
  const digits = normalizeText(value, 40)?.replace(/[^0-9]/g, "") ?? "";
  if (!digits) return null;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(-10);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(-10);
  return digits;
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
    p[0] === 100 && p[1] >= 64 && p[1] <= 127 ||
    p[0] === 169 && p[1] === 254 ||
    p[0] === 172 && p[1] >= 16 && p[1] <= 31 ||
    p[0] === 192 && (p[1] === 0 || p[1] === 168) ||
    p[0] === 192 && p[1] === 0 && p[2] === 2 ||
    p[0] === 198 && (p[1] === 18 || p[1] === 19 || p[1] === 51 && p[2] === 100) ||
    p[0] === 203 && p[1] === 0 && p[2] === 113;
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
async function readTextLimited(response: Response, maxBytes: number) {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error("robots.txt exceeds the permitted size.");
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

async function assertRobotsAllows(url: URL) {
  const robotsUrl = new URL("/robots.txt", url.origin);
  const response = await fetch(robotsUrl, {
    method: "GET", redirect: "error", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "User-Agent": USER_AGENT, "Accept": "text/plain" },
  });
  if (response.status === 404) return;
  if (!response.ok) throw new Error("Could not verify robots.txt permission (HTTP " + response.status + "); refusing collection.");
  const declared = Number(response.headers.get("content-length") ?? "0");
  if (declared > MAX_ROBOTS_BYTES) throw new Error("robots.txt exceeds the permitted size.");
  const text = await readTextLimited(response, MAX_ROBOTS_BYTES);
  const groups: Array<{ agents: string[]; rules: Array<{ rule: string; allow: boolean }> }> = [];
  let current: { agents: string[]; rules: Array<{ rule: string; allow: boolean }> } | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.split("#", 1)[0].trim();
    if (!line) continue;
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (key === "user-agent") {
      if (!current || current.rules.length) { current = { agents: [], rules: [] }; groups.push(current); }
      current.agents.push(value.toLowerCase());
    } else if ((key === "disallow" || key === "allow") && current && value) {
      current.rules.push({ rule: value, allow: key === "allow" });
    }
  }
  const botGroup = groups.filter(g => g.agents.some(a => a !== "*" && "twimzileadresearchbot".includes(a)));
  const selected = botGroup.length ? botGroup : groups.filter(g => g.agents.includes("*"));
  const path = url.pathname + url.search;
  const rules = selected.flatMap(g => g.rules).filter(r => {
    if (r.rule === "*") return true;
    const pattern = r.rule.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\$$/, "$");
    try { return new RegExp("^" + pattern).test(path); } catch { return true; }
  });
  const blocked = rules.filter(r => !r.allow).sort((a,b) => b.rule.length - a.rule.length)[0];
  const allowed = rules.filter(r => r.allow).sort((a,b) => b.rule.length - a.rule.length)[0];
  if (blocked && (!allowed || blocked.rule.length > allowed.rule.length)) {
    throw new Error("robots.txt disallows this source path for TwimziLeadResearchBot.");
  }
}

async function fetchJson(url: URL) {
  await assertPublicDns(url.hostname);
  await assertRobotsAllows(url);
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


type EnrichmentCounts = { checked:number; enriched:number; email_found:number; phone_found:number; failed:number };
function decodeHtml(value:string) {
  return value.replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,"<").replace(/&gt;/gi,">");
}
function extractWebsiteContacts(html:string) {
  const clean=html.replace(/<(script|style|noscript|svg)[^>]*>[\s\S]*?<\/\1>/gi," ").replace(/<!--[\s\S]*?-->/g," ");
  const emails:string[]=[]; const phones:string[]=[];
  const addEmail=(v:string)=>{const e=normalizeEmail(decodeHtml(v).replace(/^mailto:/i,"").split("?")[0]);if(e&&!/\.(png|jpe?g|gif|svg|webp|css|js)$/i.test(e)&&!emails.includes(e))emails.push(e);};
  const addPhone=(v:string)=>{const p=decodeHtml(v).replace(/^tel:/i,"").split(/[?;]/)[0].trim();const digits=p.replace(/[^0-9]/g,"");if(digits.length>=10&&digits.length<=15&&!phones.includes(p))phones.push(p);};
  for(const m of clean.matchAll(/href\s*=\s*["']mailto:([^"'\s]+)["']/gi))addEmail(m[1]);
  for(const m of clean.matchAll(/href\s*=\s*["']tel:([^"'\s]+)["']/gi))addPhone(m[1]);
  for(const m of clean.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi))addEmail(m[0]);
  const visible=clean.replace(/<[^>]+>/g," ").replace(/\s+/g," ");
  for(const m of visible.matchAll(/(?:\+?\d[\d ().-]{7,}\d)/g))addPhone(m[0]);
  return {emails,phones};
}
function contactPageUrls(home:URL,html:string) {
  const found:string[]=[];
  for(const m of html.matchAll(/<a\b[^>]*href\s*=\s*(["'])(.*?)\1[^>]*>/gi)){
    const href=decodeHtml(m[2]); if(!/(contact|about|reach|support|enquir|connect|company|team)/i.test(href))continue;
    try{const u=new URL(href,home);if(u.protocol==="https:"&&u.hostname.toLowerCase()===home.hostname.toLowerCase()&&!found.includes(u.href))found.push(u.href);}catch{/* malformed link */}
  }
  for(const path of ["/contact","/contact-us","/about","/about-us"]){const u=new URL(path,home.origin).href;if(!found.includes(u))found.push(u);}
  return found.slice(0,1);
}
async function fetchHtmlPage(url:URL) {
  await assertPublicDns(url.hostname); await assertRobotsAllows(url);
  const response=await fetch(url,{method:"GET",redirect:"error",signal:AbortSignal.timeout(FETCH_TIMEOUT_MS),headers:{"Accept":"text/html,application/xhtml+xml;q=0.9","User-Agent":USER_AGENT}});
  if(!response.ok)throw new Error("Website returned HTTP "+response.status+".");
  const type=(response.headers.get("content-type")??"").toLowerCase();
  if(!type.includes("text/html")&&!type.includes("application/xhtml+xml"))throw new Error("Website page is not HTML.");
  return await readBounded(response);
}
async function enrichWebsiteLeads(admin: any) {
  const cutoff=new Date(Date.now()-30*24*60*60*1000).toISOString();
  const {data:rows,error}=await admin.from("admin_contact_bank").select("id,full_name,company_name,email,phone,website,source_last_checked_at,notes")
    .eq("source_type","lead_generator").not("website","is",null)
    .or("source_last_checked_at.is.null,source_last_checked_at.lt."+cutoff)
    .or("email.is.null,email.eq.,phone.is.null,phone.eq.")
    .order("created_at",{ascending:true}).limit(2);
  if(error)throw new Error("Could not load website enrichment queue.");
  const counts:EnrichmentCounts={checked:0,enriched:0,email_found:0,phone_found:0,failed:0};
  const results:Array<JsonRecord>=[];
  for(const row of rows??[]){
    counts.checked++;
    try{
      const raw=String(row.website??"").trim();
      const home=safeUrl(raw.startsWith("https://")?raw:"https://"+raw.replace(/^http:\/\//i,""));
      const html=await fetchHtmlPage(home); const contacts=extractWebsiteContacts(html);
      for(const page of contactPageUrls(home,html)){
        if((!row.email&&!contacts.emails.length)||(!row.phone&&!contacts.phones.length)){
          try{const next=extractWebsiteContacts(await fetchHtmlPage(new URL(page)));contacts.emails.push(...next.emails.filter(x=>!contacts.emails.includes(x)));contacts.phones.push(...next.phones.filter(x=>!contacts.phones.includes(x)));}catch{/* inaccessible subpage */}
        }
        if((row.email||contacts.emails.length)&&(row.phone||contacts.phones.length))break;
      }
      const email=!row.email?contacts.emails[0]??null:null; const phone=!row.phone?contacts.phones[0]??null:null;
      const now=new Date().toISOString();
      const audit="Website enrichment checked "+home.origin+" on "+now+". "+(email?"Published email found. ":"")+(phone?"Published phone found. ":"")+(email||phone?"":"No new contact details found.")+" Details remain unverified; marketing consent not granted.";
      const patch:JsonRecord={source_last_checked_at:now,updated_at:now,notes:([row.notes,audit].filter(Boolean).join("\n")).slice(-4000)};
      if(email){patch.email=email;patch.email_kind="business";counts.email_found++;} if(phone){patch.phone=phone;counts.phone_found++;}
      const {error:updateError}=await admin.from("admin_contact_bank").update(patch).eq("id",row.id);
      if(updateError)throw new Error("Could not save enrichment results.");
      if(email||phone)counts.enriched++;
      results.push({id:row.id,business:row.company_name??row.full_name,email_found:Boolean(email),phone_found:Boolean(phone),status:email||phone?"enriched":"checked_no_new_details"});
    }catch(error){
      counts.failed++; const message=error instanceof Error?error.message.slice(0,250):"Website check failed."; const now=new Date().toISOString();
      await admin.from("admin_contact_bank").update({source_last_checked_at:now,updated_at:now,notes:([row.notes,"Website enrichment failed on "+now+": "+message].filter(Boolean).join("\n")).slice(-4000)}).eq("id",row.id);
      results.push({id:row.id,business:row.company_name??row.full_name,status:"failed",reason:message});
    }
  }
  return {counts,results};
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "POST required." }, 405);
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const invocationJwt = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const serviceKey = envKey();
  if (!supabaseUrl || !serviceKey) return json({ error: "Worker is not configured." }, 503);

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\\s+/i, "") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
  let adminAuthorized = Boolean(invocationJwt && bearer === invocationJwt);
  if (!adminAuthorized && bearer && anonKey) {
    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: "Bearer " + bearer } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await caller.auth.getUser();
    if (!userError && userData.user) {
      const { data: allowed, error: adminError } = await caller.rpc("is_super_admin");
      adminAuthorized = !adminError && allowed === true;
    }
  }
  if (!adminAuthorized) return json({ error: "Unauthorized: a verified Super Admin session is required." }, 401);

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let requestBody: JsonRecord = {};
  try { const parsed = await request.json(); if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) requestBody = parsed as JsonRecord; } catch { return json({ error: "Request body must be valid JSON." }, 400); }
  if (requestBody.action === "enrich_websites") {
    try { const result = await enrichWebsiteLeads(admin); return json({ action: "enrich_websites", ...result }); }
    catch (error) { return json({ error: error instanceof Error ? error.message : "Website enrichment failed." }, 500); }
  }
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

  const sourceId = claimed.source_id as string;
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

    const minIntervalMs = Math.max(
      60_000,
      7_200_000 / Math.max(1, source.max_requests_per_hour),
      Math.max(24, Number(source.crawl_interval_hours) || 168) * 3_600_000,
    );
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
    let stoppedStatus: "paused" | "cancelled" | null = null;
    for (const raw of records) {
      const { data: currentJob, error: statusError } = await admin.from("lead_generator_jobs")
        .select("status").eq("id", claimed.id).maybeSingle();
      if (statusError) throw new Error("Could not verify job state during processing.");
      if (currentJob?.status === "paused" || currentJob?.status === "cancelled") {
        stoppedStatus = currentJob.status;
        break;
      }
      if (currentJob?.status !== "running") throw new Error("Job is no longer running; stopping collection.");
      counts.seen++;
      const mapped = mapRecord(raw, mapping, permitted);
      if (!mapped) { counts.rejected++; continue; }
      const name = String(mapped.business_name);
      const city = normalizeText(mapped.city, 120);
      const state = normalizeText(mapped.state, 120) ?? claimed.region_state;
      const category = normalizeText(mapped.category, 120);
      if (state.toLowerCase() !== String(claimed.region_state).toLowerCase()) { counts.rejected++; continue; }
      if (claimed.districts?.length && (!mapped.district || !claimed.districts.some((d: string) => d.toLowerCase() === String(mapped.district).toLowerCase()))) { counts.rejected++; continue; }
      if (claimed.categories?.length && (!category || !claimed.categories.includes(category))) { counts.rejected++; continue; }
      const emailKey = normalizeEmail(mapped.business_email ?? mapped.professional_work_email);
      if (emailKey) {
        const { data: emailMatches, error: emailMatchError } = await admin.from("admin_contact_bank_review")
          .select("id").eq("normalized_email", emailKey).limit(1);
        if (emailMatchError) throw new Error("Could not check the email against the contact bank.");
        if (emailMatches?.length) { counts.duplicate++; continue; }
      }
      const phoneKey = normalizePhoneKey(mapped.business_phone);
      if (phoneKey) {
        const { data: phoneMatches, error: phoneMatchError } = await admin.from("admin_contact_bank_review")
          .select("id").eq("normalized_phone", phoneKey).limit(1);
        if (phoneMatchError) throw new Error("Could not check the phone number against the contact bank.");
        if (phoneMatches?.length) { counts.duplicate++; continue; }
      }
      const domain = websiteHost(mapped.website);
      let duplicateQuery = admin.from("admin_contact_bank").select("id").eq("contact_type", "business").limit(1);
      if (domain) duplicateQuery = duplicateQuery.eq("website_domain", domain).ilike("full_name", name);
      else if (city) duplicateQuery = duplicateQuery.ilike("full_name", name).ilike("city", city).ilike("state", state);
      else { counts.rejected++; continue; }
      const { data: duplicates, error: duplicateError } = await duplicateQuery;
      if (duplicateError) throw new Error("Could not perform duplicate check.");
      if (duplicates?.length) { counts.duplicate++; continue; }

      const row: JsonRecord = {
        full_name: name, company_name: name, contact_type: "business", country: "India",
        source: source.name, source_type: "lead_generator", source_url: source.source_url,
        source_collected_at: new Date().toISOString(), source_last_checked_at: new Date().toISOString(),
        email_kind: mapped.business_email ? "business" : mapped.professional_work_email ? "professional_work" : "unknown",
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
    const finalStatus = stoppedStatus ?? "completed";
    await admin.from("lead_generator_jobs").update({
      status: finalStatus, processed_count: counts.seen, inserted_count: counts.inserted,
      duplicate_count: counts.duplicate, rejected_count: counts.rejected,
      ...(finalStatus === "completed" ? { finished_at: new Date().toISOString() } : {}),
    }).eq("id", claimed.id).eq("status", stoppedStatus ? finalStatus : "running");
    await admin.from("lead_generator_fetch_log").update({
      outcome: finalStatus, http_status: 200, records_seen: counts.seen, records_inserted: counts.inserted,
      records_duplicate: counts.duplicate, records_rejected: counts.rejected,
    }).eq("id", logId);
    return json({ job_id: claimed.id, status: finalStatus, counts });
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
