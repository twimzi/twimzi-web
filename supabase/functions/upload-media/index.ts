import { AwsClient } from "npm:aws4fetch@1.0.19";
import { createClient } from "npm:@supabase/supabase-js@2.117.1";

const ALLOWED_ORIGINS = new Set([
  "https://www.twimzi.com",
  "https://twimzi.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);
const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

function getOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return "https://www.twimzi.com";
  return ALLOWED_ORIGINS.has(origin) ? origin : null;
}

function json(body: Record<string, unknown>, status: number, origin: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function envKey(kind: "publishable" | "secret", legacy: string) {
  const raw = Deno.env.get(kind === "publishable" ? "SUPABASE_PUBLISHABLE_KEYS" : "SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      if (parsed.default) return parsed.default;
    } catch {
      // Fall back to legacy environment variable names.
    }
  }
  return Deno.env.get(legacy) ?? "";
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 80) || "image";
}

function matchesSignature(bytes: Uint8Array, mimeType: string) {
  const starts = (...values: number[]) => values.every((value, index) => bytes[index] === value);
  switch (mimeType) {
    case "image/jpeg":
      return starts(0xff, 0xd8, 0xff);
    case "image/png":
      return starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    case "image/gif":
      return new TextDecoder().decode(bytes.slice(0, 6)) === "GIF87a" ||
        new TextDecoder().decode(bytes.slice(0, 6)) === "GIF89a";
    case "image/webp":
      return new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
        new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
    case "image/avif": {
      const boxType = new TextDecoder().decode(bytes.slice(4, 12));
      return boxType.startsWith("ftypavif") || boxType.startsWith("ftypavis");
    }
    default:
      return false;
  }
}

function extensionFromMime(mimeType: string) {
  return MIME_EXTENSIONS[mimeType];
}

Deno.serve(async (request) => {
  const origin = getOrigin(request);
  if (!origin) return new Response("Origin not allowed.", { status: 403 });

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Vary": "Origin",
      },
    });
  }

  if (request.method !== "POST") return json({ success: false, error: "Only POST is supported." }, 405, origin);

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 11 * 1024 * 1024) {
    return json({ success: false, error: "Upload request is too large." }, 413, origin);
  }

  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ success: false, error: "Authentication required." }, 401, origin);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const publishableKey = envKey("publishable", "SUPABASE_ANON_KEY");
    const secretKey = envKey("secret", "SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !publishableKey || !secretKey) {
      return json({ success: false, error: "Upload service is temporarily unavailable." }, 503, origin);
    }

    const authClient = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser(authorization.slice(7));
    if (authError || !user) return json({ success: false, error: "Your session is invalid or expired." }, 401, origin);

    const form = await request.formData();
    const businessId = String(form.get("business_id") ?? "").trim();
    const kind = String(form.get("kind") ?? "").trim().toLowerCase();
    const productId = String(form.get("product_id") ?? "").trim();
    const altText = String(form.get("alt_text") ?? "").trim().slice(0, 500);
    const file = form.get("file");

    if (!businessId) return json({ success: false, error: "Business ID is required." }, 400, origin);
    if (!["logo", "cover", "gallery", "product"].includes(kind)) return json({ success: false, error: "Invalid media type." }, 400, origin);
    if (kind === "product" && !productId) return json({ success: false, error: "Product ID is required." }, 400, origin);
    if (!(file instanceof File)) return json({ success: false, error: "Image file is required." }, 400, origin);

    const maxBytes = kind === "gallery" || kind === "product" ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size <= 0 || file.size > maxBytes) {
      return json({ success: false, error: "Image exceeds the allowed file size." }, 400, origin);
    }
    if (!Object.hasOwn(MIME_EXTENSIONS, file.type)) {
      return json({ success: false, error: "Use a JPEG, PNG, WebP, GIF, or AVIF image." }, 400, origin);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!matchesSignature(bytes, file.type)) {
      return json({ success: false, error: "The file content does not match its declared image type." }, 400, origin);
    }

    const admin = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: business, error: businessError } = await admin
      .from("businesses")
      .select("id,is_active,deleted_at")
      .eq("id", businessId)
      .eq("owner_profile_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();
    if (businessError) return json({ success: false, error: "Unable to verify business ownership." }, 500, origin);
    if (!business || !business.is_active) return json({ success: false, error: "Business not found or not owned by you." }, 403, origin);

    if (kind === "product") {
      const { data: product, error: productError } = await admin
        .from("products")
        .select("id,business_id,deleted_at")
        .eq("id", productId)
        .eq("business_id", businessId)
        .is("deleted_at", null)
        .maybeSingle();
      if (productError) return json({ success: false, error: "Unable to verify product ownership." }, 500, origin);
      if (!product) return json({ success: false, error: "Product not found or not owned by you." }, 403, origin);
    }

    // Limit both successful and repeated upload attempts indirectly through a
    // per-user successful-upload quota. Database access uses the server secret.
    const now = Date.now();
    const tenMinutesAgo = new Date(now - 10 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const [recent, daily] = await Promise.all([
      admin.from("media").select("id", { count: "exact", head: true })
        .eq("uploaded_by", user.id).gte("created_at", tenMinutesAgo),
      admin.from("media").select("id", { count: "exact", head: true })
        .eq("uploaded_by", user.id).gte("created_at", oneDayAgo),
    ]);
    if (recent.error || daily.error) return json({ success: false, error: "Unable to verify upload limits." }, 503, origin);
    if ((recent.count ?? 0) >= 10 || (daily.count ?? 0) >= 50) {
      return json({ success: false, error: "Upload limit reached. Please try again later." }, 429, origin);
    }

    const fileExtension = extensionFromMime(file.type);
    const cleanName = safeName(file.name.replace(/\.[^.]+$/, ""));
    const objectPath = kind === "product"
      ? ["businesses", businessId, "products", productId, crypto.randomUUID() + "-" + cleanName + "." + fileExtension].join("/")
      : ["businesses", businessId, kind, crypto.randomUUID() + "-" + cleanName + "." + fileExtension].join("/");
    const accountId = Deno.env.get("R2_ACCOUNT_ID")?.trim();
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID")?.trim();
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY")?.trim();
    const bucket = (Deno.env.get("R2_BUCKET_NAME") ?? Deno.env.get("R2_BUCKET"))?.trim();
    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
      return json({ success: false, error: "Upload service is temporarily unavailable." }, 503, origin);
    }

    const r2 = new AwsClient({ service: "s3", region: "auto", accessKeyId, secretAccessKey });
    const encodedKey = objectPath.split("/").map(encodeURIComponent).join("/");
    const uploadUrl = "https://" + accountId + ".r2.cloudflarestorage.com/" + encodeURIComponent(bucket) + "/" + encodedKey;
    let uploaded: Response;
    try {
      uploaded = await r2.fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
        body: bytes,
      });
    } catch {
      return json({ success: false, error: "Image storage is temporarily unavailable." }, 502, origin);
    }
    if (!uploaded.ok) return json({ success: false, error: "Image storage rejected the upload." }, 502, origin);

    const { data: media, error: mediaError } = await admin.from("media").insert({
      uploaded_by: user.id,
      bucket_name: bucket,
      object_path: objectPath,
      file_name: safeName(file.name),
      original_name: file.name.slice(0, 255),
      mime_type: file.type,
      extension: fileExtension,
      file_size: file.size,
      alt_text: altText || null,
      is_public: true,
    }).select("id,object_path,mime_type,file_size,is_public").single();
    if (mediaError) return json({ success: false, error: "Image uploaded but could not be registered." }, 500, origin);

    if (kind === "product") {
      const { error: relationError } = await admin.from("product_media").insert({
        product_id: productId,
        media_id: media.id,
        media_type: "image",
        title: altText || null,
        alt_text: altText || null,
        sort_order: 0,
        is_primary: true,
        is_active: true,
        created_by: user.id,
        updated_by: user.id,
      });
      if (relationError) return json({ success: false, error: "Image uploaded but could not be linked to the product." }, 500, origin);

      const publicBase = (Deno.env.get("R2_PUBLIC_URL") ?? "").trim().replace(/\/$/, "");
      const publicUrl = publicBase ? publicBase + "/" + objectPath : null;
      const { error: updateProductError } = await admin.from("products").update({
        thumbnail_url: publicUrl,
        image_count: 1,
        updated_by: user.id,
      }).eq("id", productId).eq("business_id", businessId);
      if (updateProductError) return json({ success: false, error: "Image uploaded but the product image could not be updated." }, 500, origin);
      return json({ success: true, media: { id: media.id, object_path: media.object_path, mime_type: media.mime_type, file_size: media.file_size, is_public: media.is_public, public_url: publicUrl } }, 200, origin);
    }

    const { error: relationError } = await admin.from("business_media").insert({
      business_id: businessId,
      media_id: media.id,
      display_order: kind === "gallery" ? 0 : -1,
    });
    if (relationError) return json({ success: false, error: "Image uploaded but could not be linked to the business." }, 500, origin);

    if (kind === "logo" || kind === "cover") {
      const payload = kind === "logo"
        ? { logo_media_id: media.id, updated_by: user.id }
        : { cover_media_id: media.id, updated_by: user.id };
      const { error: updateError } = await admin.from("businesses").update(payload)
        .eq("id", businessId).eq("owner_profile_id", user.id);
      if (updateError) return json({ success: false, error: "Image uploaded but the business image could not be updated." }, 500, origin);
    }

    return json({ success: true, media: { id: media.id, object_path: media.object_path, mime_type: media.mime_type, file_size: media.file_size, is_public: media.is_public } }, 200, origin);
  } catch {
    return json({ success: false, error: "Unable to upload image." }, 500, origin);
  }
});
