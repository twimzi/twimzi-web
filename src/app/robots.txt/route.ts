import { siteConfig } from "@/config/site";

const privatePaths = [
  "/admin/",
  "/api/",
  "/auth/",
  "/businesses/dashboard/",
  "/add-business",
  "/messages/",
  "/login",
  "/register",
  "/forgot-password",
  "/update-password",
];

export function GET() {
  const blocked = privatePaths.map((path) => `Disallow: ${path}`).join("\n");
  const body = [
    "User-agent: *",
    "Allow: /",
    blocked,
    "",
    "User-agent: GPTBot",
    "Allow: /",
    blocked,
    "",
    "User-agent: OAI-SearchBot",
    "Allow: /",
    blocked,
    "",
    "User-agent: ClaudeBot",
    "Allow: /",
    blocked,
    "",
    "User-agent: PerplexityBot",
    "Allow: /",
    blocked,
    "",
    "User-agent: Google-Extended",
    "Allow: /",
    blocked,
    "",
    "Content-Signal: search=yes, ai-train=no",
    `Sitemap: ${siteConfig.url}/sitemap.xml`,
    `Host: ${siteConfig.url}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
