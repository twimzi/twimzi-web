import { seoKeywordTargets } from "./keyword-targets";

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
  includeTermGroups?: string[][];
  requestedSlug?: string;
  city?: string;
  state?: string;
};

const curatedSeoDirectoryPages: SeoDirectoryPage[] = [
  {
    slug: "manufacturers-in-india",
    keyword: "manufacturers in India",
    title: "Manufacturers in India | Find Indian Manufacturers",
    description: "Explore manufacturer business profiles in India. Discover Indian companies, review their business details and connect directly through Twimzi.",
    heading: "Find manufacturers in India",
    intro: "Explore public manufacturer profiles from across India on Twimzi. This directory helps buyers, distributors and businesses discover manufacturing companies, understand what they make and reach out using the contact options on each business profile.",
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
    businessTypes: ["Manufacturer", "Trader", "Wholesaler", "Distributor"],
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
    slug: "distributors-in-india",
    keyword: "distributors in India",
    title: "Distributors in India | Find Product Distributors",
    description: "Explore Indian distributor profiles, product categories and business contact details. Find distribution partners through Twimzi.",
    heading: "Find distributors in India",
    intro: "Discover public profiles of businesses involved in product distribution across India. Review their listed business details and product focus to identify potential channel partners, stockists and regional distributors.",
    detail: "Before appointing or buying from a distributor, confirm territory coverage, brand authorisation, product range, stockholding capacity, sales support, service obligations, credit terms and logistics. Request current references and written terms. A directory profile is a starting point for discovery, not a certification or endorsement.",
    businessTypes: ["Distributor"],
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
    slug: "manufacturers-in-ludhiana",
    keyword: "manufacturers in Ludhiana",
    title: "Manufacturers in Ludhiana | Local Manufacturing Directory",
    description: "Discover manufacturing businesses in Ludhiana, Punjab. Explore public company profiles, products and contact information on Twimzi.",
    heading: "Find manufacturers in Ludhiana",
    intro: "Explore public profiles of manufacturers based in Ludhiana, Punjab. Use business descriptions and contact details to identify companies relevant to your sourcing, industrial and procurement needs.",
    detail: "Ludhiana has businesses across engineering, textiles, cycle parts, machinery and other manufacturing segments. Confirm each company's actual product range, factory or office address, capacity, quality systems, certifications, minimum order quantity and delivery terms directly before making a procurement decision.",
    businessTypes: ["Manufacturer"],
    city: "Ludhiana",
  },
  {
    slug: "professionals-in-ludhiana",
    keyword: "professionals in Ludhiana",
    title: "Professionals in Ludhiana | Find Local Experts",
    description: "Find professional businesses and experts in Ludhiana, Punjab. Explore public profiles and contact details on Twimzi.",
    heading: "Discover professionals in Ludhiana",
    intro: "Browse public profiles of professional service businesses in Ludhiana. Review the services, location and contact information each provider shares before deciding whom to approach.",
    detail: "For legal, accounting, medical, financial or other specialist work, verify the provider's qualifications, registrations, relevant experience, service scope and fees. Discuss confidentiality, timelines and written engagement terms before sharing sensitive documents or making payments.",
    businessTypes: ["Professional"],
    city: "Ludhiana",
  },
  {
    slug: "shops-in-ludhiana",
    keyword: "shops in Ludhiana",
    title: "Shops in Ludhiana | Find Local Stores & Retailers",
    description: "Explore shops and retail businesses in Ludhiana, Punjab. Discover store profiles, product categories and contact details on Twimzi.",
    heading: "Find shops in Ludhiana",
    intro: "Discover public profiles of shops and retailers in Ludhiana. Explore the business information and product categories available on each profile, then contact the store to confirm availability and timings.",
    detail: "Before visiting or ordering, confirm the shop's current address, opening hours, product availability, price, delivery options and return policy directly with the business. Listings and business details may change over time.",
    businessTypes: ["Shop", "Retailer", "Retail Store", "Store"],
    city: "Ludhiana",
  },
  {
    slug: "home-services-in-ludhiana",
    keyword: "home services in Ludhiana",
    title: "Home Services in Ludhiana | Find Local Service Providers",
    description: "Find home service providers in Ludhiana, Punjab. Explore public profiles for repairs, maintenance and household services on Twimzi.",
    heading: "Find home services in Ludhiana",
    intro: "Explore service-provider profiles in Ludhiana for household repairs, maintenance and other home services. Review the provider's listed service details and contact them to confirm coverage and availability.",
    detail: "Before booking, confirm the exact work, visit charges, labour and material costs, service area, estimated completion time, warranty on repairs and payment terms. For electrical, gas, structural or other safety-critical work, verify the provider's relevant training and qualifications.",
    businessTypes: ["Service Provider", "Home Service"],
    includeTerms: ["home", "plumb", "electric", "clean", "repair", "pest", "carpenter", "appliance", "maintenance"],
    city: "Ludhiana",
  },
  {
    slug: "businesses-in-amritsar",
    keyword: "businesses in Amritsar",
    title: "Businesses in Amritsar | Local Business Directory",
    description: "Discover businesses in Amritsar, Punjab. Explore local company profiles, products, services and contact information on Twimzi.",
    heading: "Discover businesses in Amritsar",
    intro: "Browse public business profiles from Amritsar, Punjab. Explore local companies across business types and categories, review the details they publish and contact businesses directly.",
    detail: "Use each profile to understand the business's stated products or services and location. Confirm current operating hours, availability, pricing, credentials and service coverage directly with the business before visiting or placing an order.",
    city: "Amritsar",
  },
  {
    slug: "services-in-punjab",
    keyword: "services in Punjab",
    title: "Service Providers in Punjab | Find Local Services",
    description: "Explore professional and local service providers across Punjab. Compare public business profiles and connect through Twimzi.",
    heading: "Find service providers across Punjab",
    intro: "Discover public profiles of service businesses and professionals operating in Punjab. Explore the locations and service descriptions shared by providers to find options relevant to your requirements.",
    detail: "Service availability can vary by city and provider. Confirm the service area, scope, qualifications, estimated fees, schedule, cancellation terms and after-service support directly before engaging a provider.",
    businessTypes: ["Service Provider", "Home Service", "Professional"],
    state: "Punjab",
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
  {
    slug: "solar-panel-manufacturers-in-india",
    keyword: "solar panel manufacturers in India",
    title: "Solar Panel Manufacturers in India | Twimzi",
    description: "Discover Indian solar panel and photovoltaic equipment manufacturers. Review public business profiles and contact companies through Twimzi.",
    heading: "Find solar panel manufacturers in India",
    intro: "Explore public manufacturer profiles relevant to solar panels, photovoltaic modules and solar equipment. Use company descriptions and contact details to identify businesses for further product and supplier evaluation.",
    detail: "Compare module technology, rated output, efficiency, certifications, warranty terms, degradation guarantees, testing documentation and after-sales support. Verify current product specifications and applicable approvals directly with the manufacturer before procurement.",
    businessTypes: ["Manufacturer"],
    includeTerms: ["solar", "photovoltaic", "pv module", "solar panel"],
  },
  {
    slug: "packaging-machine-manufacturers-in-india",
    keyword: "packaging machine manufacturers in India",
    title: "Packaging Machine Manufacturers in India | Twimzi",
    description: "Find Indian packaging machinery manufacturers. Explore business profiles for packaging, filling, sealing and processing equipment.",
    heading: "Packaging machine manufacturers in India",
    intro: "Discover manufacturer profiles relevant to packaging machinery and industrial packaging equipment. Review listed capabilities and contact companies to discuss machinery for your production requirements.",
    detail: "Specify the material, pack size, line speed, automation level, power requirements, changeover needs, installation, operator training, spare parts and service response. Request a product demonstration and written technical proposal before selecting equipment.",
    businessTypes: ["Manufacturer"],
    includeTerms: ["packaging machine", "packing machine", "filling machine", "sealing machine", "packaging equipment"],
  },
  {
    slug: "led-light-wholesalers-in-india",
    keyword: "LED light wholesalers in India",
    title: "LED Light Wholesalers in India | Twimzi",
    description: "Explore Indian wholesalers and suppliers of LED lights and lighting products. Compare business profiles and contact sellers on Twimzi.",
    heading: "Find LED light wholesalers in India",
    intro: "Browse public profiles of businesses associated with wholesale LED lighting and related products. Review product information and contact suppliers to confirm available models and bulk-order terms.",
    detail: "Check wattage, lumen output, colour temperature, beam angle, driver quality, rated life, warranty, safety certifications, packaging and replacement terms. Ask for samples and a formal bulk quotation before placing an order.",
    businessTypes: ["Wholesaler", "Trader", "Distributor"],
    includeTerms: ["led light", "led lighting", "led bulb", "lighting products"],
  },
  {
    slug: "hydraulic-machinery-suppliers-in-india",
    keyword: "hydraulic machinery suppliers in India",
    title: "Hydraulic Machinery Suppliers in India | Twimzi",
    description: "Discover Indian suppliers of hydraulic machinery, equipment and components. Explore business profiles and contact suppliers on Twimzi.",
    heading: "Hydraulic machinery suppliers in India",
    intro: "Explore business profiles relevant to hydraulic machinery, equipment and components. Use the supplier's listed capabilities and contact details to assess whether they serve your application.",
    detail: "Confirm operating pressure, flow rate, load capacity, fluid compatibility, duty cycle, component standards, maintenance requirements and spare-parts support. Share the application details with suppliers and request technical documentation before ordering.",
    businessTypes: ["Manufacturer", "Trader", "Wholesaler", "Distributor"],
    includeTerms: ["hydraulic", "hydraulics", "hydraulic machinery", "hydraulic equipment"],
  },
  {
    slug: "cotton-fabric-wholesalers-in-india",
    keyword: "cotton fabric wholesalers in India",
    title: "Cotton Fabric Wholesalers in India | Twimzi",
    description: "Find Indian cotton fabric wholesalers and textile suppliers. Explore business profiles and contact businesses for bulk sourcing.",
    heading: "Cotton fabric wholesalers in India",
    intro: "Discover public business profiles associated with cotton fabrics, textiles and wholesale fabric supply. Review the business details and contact suppliers to discuss fabric requirements and bulk availability.",
    detail: "Specify fibre composition, weave, GSM, width, colour, finish, shrinkage, colourfastness, certifications, minimum order quantity and lead time. Request swatches or samples and approve written specifications before bulk purchase.",
    businessTypes: ["Wholesaler", "Trader", "Distributor", "Manufacturer"],
    includeTerms: ["cotton", "fabric", "textile", "woven", "knit"],
  },
  {
    slug: "industrial-rubber-products-suppliers-in-india",
    keyword: "industrial rubber products suppliers in India",
    title: "Industrial Rubber Products Suppliers in India | Twimzi",
    description: "Explore Indian suppliers and manufacturers of industrial rubber products and components. Review business profiles on Twimzi.",
    heading: "Industrial rubber products suppliers in India",
    intro: "Browse public business profiles relevant to industrial rubber products and components. Contact listed businesses to confirm product range, material suitability and supply capability for your application.",
    detail: "Provide the operating environment, temperature range, pressure, chemical exposure, hardness, dimensions, tolerances and applicable standards. Request material data, test certificates and samples where the application is safety- or performance-critical.",
    businessTypes: ["Manufacturer", "Trader", "Wholesaler", "Distributor"],
    includeTerms: ["rubber", "rubber products", "gasket", "hose", "seal", "moulded"],
  },
];

const existingDirectorySlugs = new Set(curatedSeoDirectoryPages.map((page) => page.slug));

const productTermSynonyms: Record<string, string[]> = {
  agricultural: ["agricultural", "agriculture", "farm"],
  machinery: ["machinery", "machine", "equipment"],
  blades: ["blade", "blades", "disc", "discs"],
  lights: ["light", "lighting"],
  panels: ["panel", "module"],
  fasteners: ["fastener", "nut", "bolt", "screw"],
  screws: ["screw"], nuts: ["nut"], bolts: ["bolt"],
  pipes: ["pipe"], pumps: ["pump"], motors: ["motor"],
  compressors: ["compressor"], valves: ["valve"],
  boxes: ["box", "boxes"], granules: ["granule"],
  textiles: ["textile"], bedsheets: ["bedsheet", "bed sheet"],
  towels: ["towel"], garments: ["garment"], cosmetics: ["cosmetic"],
  disposables: ["disposable"], components: ["component"],
  parts: ["part", "parts", "spare", "spares"],
  bearings: ["bearing"], profiles: ["profile"], tiles: ["tile"],
  chemicals: ["chemical"], adhesives: ["adhesive"], batteries: ["battery"],
  coolers: ["cooler"], implements: ["implement", "implements"],
  sprayer: ["sprayer", "spray"], harvesting: ["harvesting", "harvester"],
  packaging: ["packaging", "packing"], moulding: ["moulding", "molding"],
  aluminium: ["aluminium", "aluminum"], knitted: ["knit", "knitted"],
  readymade: ["readymade", "ready-made"], footwear: ["footwear", "shoe"],
  woodworking: ["woodworking", "wood"], sanitaryware: ["sanitaryware"],
};

function getProductTermGroups(product: string): string[][] {
  const stopWords = new Set(["and", "of", "the", "for"]);
  return product.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word && !stopWords.has(word))
    .map((word) => productTermSynonyms[word] ?? [word]);
}

const generatedProductPages: SeoDirectoryPage[] = Array.from(
  new Map(
    seoKeywordTargets
      .filter((target) => target.cluster === "Industry and product" && target.product && target.role)
      .map((target) => {
        const role = target.role!;
        const roleLabel = role === "manufacturers" ? "manufacturers" : role === "wholesalers" ? "wholesalers" : "suppliers";
        const businessTypes = role === "manufacturers"
          ? ["Manufacturer"]
          : role === "wholesalers"
            ? ["Wholesaler", "Trader", "Distributor"]
            : ["Manufacturer", "Trader", "Wholesaler", "Distributor"];
        const heading = `Find ${target.product} ${roleLabel} in India`;
        const page: SeoDirectoryPage = {
          slug: target.targetSlug,
          keyword: target.keyword,
          title: `${heading} | Twimzi`,
          description: `Explore Indian ${target.product} ${roleLabel}. Review relevant public business profiles, locations and contact details on Twimzi.`,
          heading,
          intro: `Discover public profiles of Indian businesses associated with ${target.product} ${roleLabel}. Review the business information and product focus each company shares, then contact suitable businesses to confirm their current capabilities and availability.`,
          detail: role === "manufacturers"
            ? `When evaluating a ${target.product} manufacturer, confirm exact specifications, materials, quality checks, production capacity, minimum order quantity, lead time, warranty and after-sales support. Request technical documents and a written quotation before placing an order.`
            : `When sourcing ${target.product}, confirm exact specifications, brand or manufacturer, available stock, minimum order quantity, price validity, dispatch timelines, freight, taxes, return terms and payment conditions. Verify the supplier's business details independently before placing an order.`,
          businessTypes,
          includeTermGroups: getProductTermGroups(target.product!),
        };
        return [target.targetSlug, page] as const;
      }),
  ).values(),
).filter((page) => !existingDirectorySlugs.has(page.slug));

const generatedDirectoryPages: SeoDirectoryPage[] = [
  {
    slug: "business-directory-india",
    keyword: "business directory India",
    title: "Business Directory India | Find Companies & Local Businesses | Twimzi",
    description: "Explore public business profiles across India. Discover manufacturers, suppliers, traders, retailers and service providers on Twimzi.",
    heading: "Find businesses across India",
    intro: "Search public business profiles across India and review each company's stated products, services, location and contact options. Use the profiles to shortlist businesses relevant to your requirements.",
    detail: "Compare the actual products or services, operating location, business description and available contact details. Confirm current availability, specifications, qualifications, commercial terms and delivery or service coverage directly with each business before making a decision.",
    businessTypes: ["Manufacturer", "Trader", "Wholesaler", "Distributor", "Service Provider", "Professional", "Shop", "Retailer", "Retail Store", "Store"],
  },
  {
    slug: "b2b-marketplace-india",
    keyword: "B2B marketplace India",
    title: "B2B Marketplace India | Discover Suppliers & Manufacturers | Twimzi",
    description: "Explore Indian manufacturers, wholesalers, traders and distributors. Review public business profiles and connect with potential business partners on Twimzi.",
    heading: "Discover B2B businesses in India",
    intro: "Use Twimzi to discover public business profiles relevant to sourcing, wholesale trade and business partnerships. Review each profile to understand its stated product focus, location and contact details.",
    detail: "Before entering a B2B relationship, confirm product specifications, minimum order quantities, production or stock capacity, authorisations, quality documentation, payment terms, logistics and after-sales responsibilities. A directory profile is a discovery starting point, not a certification or endorsement.",
    businessTypes: ["Manufacturer", "Trader", "Wholesaler", "Distributor"],
  },
  {
    slug: "suppliers-in-india",
    keyword: "supplier directory India",
    title: "Suppliers in India | Find Manufacturers, Traders & Wholesalers | Twimzi",
    description: "Explore public profiles of Indian manufacturers, wholesalers, traders and distributors. Discover suppliers and review their business details on Twimzi.",
    heading: "Find suppliers in India",
    intro: "Find businesses that describe themselves as manufacturers, wholesalers, traders or distributors. Use the available profiles to identify potential suppliers and contact them to confirm their product range and supply capability.",
    detail: "Ask for product specifications, current price validity, minimum order quantity, stock or production capacity, delivery timelines, tax details and written terms. Verify company registrations and references independently before placing an order.",
    businessTypes: ["Manufacturer", "Trader", "Wholesaler", "Distributor"],
  },
  {
    slug: "wholesalers-in-india",
    keyword: "wholesaler directory India",
    title: "Wholesalers in India | Find Bulk Suppliers & Distributors | Twimzi",
    description: "Discover Indian wholesalers, traders and distributors. Review public profiles and contact businesses for bulk sourcing through Twimzi.",
    heading: "Find wholesalers in India",
    intro: "Explore public business profiles for wholesale and distribution businesses in India. Review their stated product categories, locations and contact options to shortlist possible bulk suppliers.",
    detail: "Confirm minimum order quantities, stock availability, product authenticity, price validity, dispatch schedules, freight, tax invoices, returns and payment terms directly with each business.",
    businessTypes: ["Wholesaler", "Trader", "Distributor"],
  },
  {
    slug: "professional-services-in-india",
    keyword: "professional services directory India",
    title: "Professional Services in India | Find Local Experts | Twimzi",
    description: "Explore public profiles of professional service businesses in India. Review services, locations and contact details on Twimzi.",
    heading: "Find professional services in India",
    intro: "Discover professional businesses and service providers through their public Twimzi profiles. Review the scope and location information each provider shares before contacting them.",
    detail: "For regulated or specialist services, independently verify qualifications, registrations, licences, relevant experience, fees, confidentiality practices and written engagement terms before sharing sensitive information or making payments.",
    businessTypes: ["Professional"],
  },
  {
    slug: "local-services-in-india",
    keyword: "local services directory India",
    title: "Local Services in India | Find Service Providers | Twimzi",
    description: "Explore public profiles of local service businesses across India. Discover service descriptions and contact details on Twimzi.",
    heading: "Find local service providers in India",
    intro: "Browse public profiles of businesses offering local and professional services. Check each provider's stated location and service details, then contact them to confirm coverage and availability.",
    detail: "Confirm the exact scope, service area, visit charges, labour and material costs, schedule, warranty, cancellation terms and after-service support. Verify licences and training for safety-critical or regulated work.",
    businessTypes: ["Service Provider", "Home Service", "Professional"],
  },
];

export const seoDirectoryPages: SeoDirectoryPage[] = [
  ...curatedSeoDirectoryPages,
  ...generatedProductPages,
  ...generatedDirectoryPages.filter((page) => !existingDirectorySlugs.has(page.slug)),
];

export function getSeoKeywordTarget(slug: string) {
  return seoKeywordTargets.find((target) => target.slug === slug) ?? null;
}

export function getSeoDirectoryPage(slug: string) {
  const directPage = seoDirectoryPages.find((page) => page.slug === slug);
  if (directPage) return directPage;

  const target = getSeoKeywordTarget(slug);
  if (!target) return null;
  const canonicalPage = seoDirectoryPages.find((page) => page.slug === target.targetSlug);
  return canonicalPage ? { ...canonicalPage, requestedSlug: slug } : null;
}

export function matchesSeoDirectoryPage(
  business: { business_type?: string | null; business_name?: string | null; description?: string | null; city?: string | null; state?: string | null },
  page: SeoDirectoryPage,
) {
  if (page.businessTypes?.length && !page.businessTypes.some(
    (type) => type.toLowerCase() === (business.business_type ?? "").trim().toLowerCase(),
  )) return false;

  if (page.city && (business.city ?? "").trim().toLowerCase() !== page.city.toLowerCase()) return false;
  if (page.state && (business.state ?? "").trim().toLowerCase() !== page.state.toLowerCase()) return false;

  const searchable = `${business.business_name ?? ""} ${business.description ?? ""} ${business.business_type ?? ""}`.toLowerCase();

  if (page.includeTerms?.length && !page.includeTerms.some((term) => searchable.includes(term))) return false;

  if (page.includeTermGroups?.length) {
    const matchesEveryGroup = page.includeTermGroups.every((group) =>
      group.some((term) => searchable.includes(term)),
    );
    if (!matchesEveryGroup) return false;
  }

  return true;
}
