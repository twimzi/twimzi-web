export const SEO_DIRECTORY_MIN_LISTINGS = 5;

export type SeoDirectoryPage = {
  slug: string;
  keyword: string;
  title: string;
  description: string;
  heading: string;
  intro: string;
  detail: string;
  businessTypes?: string[];
  includeTerms?: string[];
  city?: string;
};

export const seoDirectoryPages: SeoDirectoryPage[] = [
  {
    slug: "manufacturers-in-india",
    keyword: "manufacturers in India",
    title: "Manufacturers in India | Find Indian Manufacturers",
    description: "Explore manufacturer business profiles in India. Discover Indian companies, review their business details and connect directly through Twimzi.",
    heading: "Find manufacturers in India",
    intro: "Explore public manufacturer profiles from across India on Twimzi. This directory is designed to help buyers, distributors and businesses discover manufacturing companies, understand what they make and reach out using the contact options on each business profile.",
    detail: "When evaluating a manufacturer, check the products or capabilities listed on its profile, its operating location, business description and available contact details. For a serious purchase, confirm specifications, minimum order quantity, production capacity, quality requirements, lead time, payment terms and delivery arrangements directly with the company. Twimzi helps people discover businesses; buyers should independently verify commercial, technical and compliance information before placing an order.",
    businessTypes: ["Manufacturer"],
  },
  {
    slug: "wholesale-suppliers-in-india",
    keyword: "wholesale suppliers in India",
    title: "Wholesale Suppliers in India | Twimzi Business Directory",
    description: "Discover Indian wholesale suppliers, manufacturers and traders. Compare public business profiles and contact suppliers directly on Twimzi.",
    heading: "Discover wholesale suppliers in India",
    intro: "Find public profiles of Indian businesses that manufacture, trade or supply products in bulk. Twimzi brings business information into one searchable directory so buyers can explore supplier profiles and identify companies relevant to their sourcing requirements.",
    detail: "Before choosing a wholesale supplier, ask for a current product catalogue, specifications, price validity, minimum order quantity, available stock, dispatch timelines and written commercial terms. Request samples where appropriate and verify GST and other relevant registrations independently. Supplier suitability depends on the product, location, order size and service expectations, so compare the actual details rather than relying on a directory listing alone.",
    businessTypes: ["Manufacturer", "Trader", "Wholesaler"],
  },
  {
    slug: "traders-in-india",
    keyword: "traders in India",
    title: "Traders in India | Find Trading Businesses",
    description: "Browse public profiles of trading businesses in India. Discover product categories, business locations and contact details on Twimzi.",
    heading: "Find trading businesses in India",
    intro: "Explore Indian trading businesses listed on Twimzi. Trading companies can help buyers source products across categories, connect with manufacturers and coordinate supply based on availability and order requirements.",
    detail: "When contacting a trader, clarify whether the business is an authorised distributor, stockist, wholesaler or independent reseller. Confirm product origin, brand authorisation where relevant, stock availability, taxes, freight, return terms and payment milestones. Ask for a formal quotation and verify the business details before making an advance payment.",
    businessTypes: ["Trader", "Wholesaler", "Distributor"],
  },
  {
    slug: "service-providers-in-india",
    keyword: "service providers in India",
    title: "Service Providers in India | Find Business Services",
    description: "Discover service providers and professional businesses in India. Explore profiles, service descriptions and contact information on Twimzi.",
    heading: "Discover service providers in India",
    intro: "Use Twimzi to explore public profiles of service providers and businesses offering professional or local services. Review each profile to understand the provider's stated services, business location and available ways to get in touch.",
    detail: "Before engaging a service provider, discuss the exact scope of work, deliverables, timelines, location coverage, fees, taxes, cancellation terms and support after completion. Check relevant qualifications, licences, references or insurance where the service requires them. Ask for a written estimate so that expectations are clear before work begins.",
    businessTypes: ["Service Provider", "Professional"],
  },
  {
    slug: "agricultural-machinery-manufacturers-in-india",
    keyword: "agricultural machinery manufacturers in India",
    title: "Agricultural Machinery Manufacturers in India | Twimzi",
    description: "Explore Indian manufacturers of agricultural machinery and farm equipment. Review business profiles and contact companies through Twimzi.",
    heading: "Agricultural machinery manufacturers in India",
    intro: "Discover Indian businesses associated with agricultural machinery, farm equipment and related components. Use the available business profiles to identify manufacturers and learn more about their products, location and contact information.",
    detail: "For agricultural equipment, compare machine capacity, compatible tractor horsepower, material and build specifications, safety features, spare-parts availability, warranty coverage and after-sales support. Ask the manufacturer for operating instructions and a written quotation. Confirm whether installation, delivery and service are available in your area.",
    businessTypes: ["Manufacturer"],
    includeTerms: ["agric", "farm", "tractor", "rotavator", "cultivator", "implement", "harvester"],
  },
  {
    slug: "industrial-fastener-manufacturers-in-india",
    keyword: "industrial fastener manufacturers in India",
    title: "Industrial Fastener Manufacturers in India | Twimzi",
    description: "Find Indian manufacturers associated with industrial fasteners, nuts, bolts and engineering components. Explore business profiles on Twimzi.",
    heading: "Industrial fastener manufacturers in India",
    intro: "Explore business profiles relevant to industrial fasteners and engineering components, including nuts, bolts and related manufactured parts. Twimzi helps buyers discover companies and review the business information they publish.",
    detail: "When sourcing fasteners, specify the standard, grade, material, dimensions, thread type, finish, tolerance and intended application. For critical applications, request inspection reports or material test certificates and confirm the manufacturer's quality-control process. Always verify the exact specification and sample approval before bulk procurement.",
    businessTypes: ["Manufacturer"],
    includeTerms: ["fastener", "nut", "bolt", "screw", "engineering", "thread", "die"],
  },
];

export function getSeoDirectoryPage(slug: string) {
  return seoDirectoryPages.find((page) => page.slug === slug) ?? null;
}

export function matchesSeoDirectoryPage(
  business: { business_type?: string | null; business_name?: string | null; description?: string | null; city?: string | null },
  page: SeoDirectoryPage,
) {
  if (page.businessTypes?.length && !page.businessTypes.some(
    (type) => type.toLowerCase() === (business.business_type ?? "").trim().toLowerCase(),
  )) return false;

  if (page.city && (business.city ?? "").trim().toLowerCase() !== page.city.toLowerCase()) return false;

  if (page.includeTerms?.length) {
    const searchable = `${business.business_name ?? ""} ${business.description ?? ""} ${business.business_type ?? ""}`.toLowerCase();
    if (!page.includeTerms.some((term) => searchable.includes(term))) return false;
  }

  return true;
}
