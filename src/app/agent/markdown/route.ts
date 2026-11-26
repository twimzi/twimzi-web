import { siteConfig } from "@/config/site";

export function GET() {
  const markdown = `# ${siteConfig.name}

> ${siteConfig.tagline}

${siteConfig.description}

## Explore Twimzi

- [Business directory](/businesses)
- [Products](/products)
- [Services](/services)
- [Offers](/offers)
- [Community](/community)
- [Business news](/news)
- [Blogs and guides](/blog)
- [About](/about)
- [Free business listing in India](/free-business-listing-india)

Twimzi helps people discover Indian businesses and helps businesses build an online presence. Browse the linked public pages for current listings and content.

Canonical website: ${siteConfig.url}
`;

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
