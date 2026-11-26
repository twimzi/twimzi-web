import { siteConfig } from "@/config/site";

export function GET() {
  const markdown = `# ${siteConfig.name}

> ${siteConfig.tagline}

${siteConfig.description}

Website: ${siteConfig.url}

## About

Twimzi is an India-focused business discovery and marketplace platform. People can discover businesses, manufacturers, suppliers, products, services and offers. Businesses can create a public profile and reach customers and other businesses.

## Main sections

- [Home](/): Discover businesses and marketplace updates.
- [About Twimzi](/about): Learn about the platform.
- [Explore businesses](/businesses): Browse public business profiles.
- [Products](/products): Discover products listed by businesses.
- [Services](/services): Discover business and professional services.
- [Offers](/offers): Browse public business offers.
- [Community](/community): Explore community posts.
- [Business news](/news): Read business, MSME, policy and market updates.
- [Business guides and blogs](/blog): Read practical business resources.
- [Free business listing in India](/free-business-listing-india): Learn about listing a business.
- [Hindi](/hi): Hindi-language introduction.
- [Punjabi](/pa): Punjabi-language introduction.

## Languages

The platform's primary interface and content are available in English. Hindi and Punjabi landing pages are also available. Individual articles should be read in the language in which they were published.

## Content and attribution

Public pages are provided for discovery, linking, search and summarisation. Attribute Twimzi and link to the original page when referencing its content. Do not imply endorsement or affiliation.

## Crawl guidance

See [robots.txt](/robots.txt) and [XML sitemap](/sitemap.xml) for crawl preferences and public URLs.
`;

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
