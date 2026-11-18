export type SeoKeywordTarget = {
  keyword: string;
  cluster: string;
  intent: string;
  priority: "high" | "medium" | "low";
  slug: string;
  targetSlug: string;
  product?: string;
  role?: "manufacturers" | "suppliers" | "wholesalers";
};

const slugify = (value: string) =>
  value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const targets: SeoKeywordTarget[] = [];
const seen = new Set<string>();
const add = (keyword: string, cluster: string, intent: string, priority: "high" | "medium" | "low", targetSlug: string, product?: string, role?: SeoKeywordTarget["role"]) => {
  const normalized = keyword.trim().toLowerCase();
  if (seen.has(normalized) || targets.length >= 500) return;
  seen.add(normalized);
  targets.push({ keyword, cluster, intent, priority, slug: slugify(keyword), targetSlug, ...(product ? { product } : {}), ...(role ? { role } : {}) });
};

const core: Array<[string, string, string, "high" | "medium" | "low", string]> = [
  ["business directory India","Business discovery","Commercial","high","business-directory-india"],
  ["online business directory India","Business discovery","Commercial","high","business-directory-india"],
  ["local business directory India","Business discovery","Commercial","high","business-directory-india"],
  ["business listing website India","Business discovery","Commercial","high","business-directory-india"],
  ["free business listing India","Business acquisition","Transactional","high","free-business-listing-india"],
  ["free company listing India","Business acquisition","Transactional","high","free-business-listing-india"],
  ["B2B marketplace India","B2B discovery","Commercial","high","b2b-marketplace-india"],
  ["Indian B2B marketplace","B2B discovery","Commercial","medium","b2b-marketplace-india"],
  ["find manufacturers in India","Supplier discovery","Transactional","high","manufacturers-in-india"],
  ["find wholesale suppliers in India","Supplier discovery","Transactional","high","wholesale-suppliers-in-india"],
  ["supplier directory India","Supplier discovery","Commercial","high","suppliers-in-india"],
  ["wholesaler directory India","Supplier discovery","Commercial","medium","wholesalers-in-india"],
  ["trader directory India","Supplier discovery","Commercial","medium","traders-in-india"],
  ["distributor directory India","Supplier discovery","Commercial","medium","distributors-in-india"],
  ["service provider directory India","Services discovery","Commercial","high","service-providers-in-india"],
  ["professional services directory India","Services discovery","Commercial","medium","professional-services-in-india"],
  ["local services directory India","Services discovery","Commercial","high","local-services-in-india"],
  ["business search India","Business discovery","Commercial","high","business-directory-india"],
  ["search companies in India","Business discovery","Commercial","medium","business-directory-india"],
  ["find local businesses online India","Business discovery","Commercial","high","business-directory-india"],
  ["company database India","Business discovery","Commercial","medium","business-directory-india"],
  ["verified business directory India","Business discovery","Commercial","medium","business-directory-india"],
  ["MSME business directory India","Business discovery","Commercial","high","business-directory-india"],
  ["small business directory India","Business discovery","Commercial","high","business-directory-india"],
  ["startup directory India","Business discovery","Commercial","medium","business-directory-india"],
];
for (const [keyword, cluster, intent, priority, target] of core) add(keyword, cluster, intent, priority, target);

const modifiers = ["best","top","online","near me","in India","for buyers","for businesses","for small businesses","to find suppliers","to promote a business"];
const bases = ["business directory","B2B supplier directory","manufacturer directory","wholesale marketplace","local business search","company listing site","Indian supplier marketplace","business discovery platform"];
for (const base of bases) for (const modifier of modifiers) {
  const keyword = ["best","top","online"].includes(modifier) ? `${modifier} ${base}` : `${base} ${modifier}`;
  add(keyword, "Business discovery", "Commercial", "medium", "business-directory-india");
}

const products = [
  "agricultural machinery","rotavator","rotavator blades","power weeder","cultivator",
  "tractor implements","agricultural equipment","seed drill","sprayer machine",
  "harvesting machine","thresher machine","rice mill machinery","flour mill machinery",
  "packaging machine","food processing machinery","industrial machinery",
  "hydraulic machinery","CNC machine","lathe machine","welding machine",
  "industrial fasteners","stainless steel fasteners","industrial screws","nuts and bolts",
  "industrial rubber products","rubber conveyor belt","PVC pipes","HDPE pipes",
  "LED lights","LED panel lights","solar panels","solar inverters",
  "solar mounting structures","packaging material","electrical control panels","electric motors",
  "water pumps","submersible pumps","air compressors","industrial valves",
  "steel fabrication","stainless steel products","aluminium profiles",
  "corrugated boxes","plastic moulding","plastic granules","cotton fabric",
  "knitted fabric","denim fabric","home textiles","bedsheets","towels",
  "readymade garments","T-shirt manufacturing","leather goods","footwear manufacturing",
  "cosmetics manufacturing","herbal cosmetics","soap manufacturing","detergent manufacturing",
  "pharmaceutical packaging","laboratory equipment","medical disposables",
  "automotive components","tractor spare parts","bearing suppliers","gear manufacturers",
  "sheet metal components","forging manufacturers","casting manufacturers","foundry products",
  "industrial chemicals","paint manufacturers","adhesive manufacturers","furniture manufacturers",
  "woodworking machinery","construction machinery","building materials","ceramic tiles",
  "sanitaryware","wire and cable","battery manufacturers","EV components",
  "fire safety equipment","material handling equipment","air coolers"
];

const existingSlugs: Record<string, string> = {
  "agricultural machinery|manufacturers":"agricultural-machinery-manufacturers-in-india",
  "industrial fasteners|manufacturers":"industrial-fastener-manufacturers-in-india",
  "solar panels|manufacturers":"solar-panel-manufacturers-in-india",
  "packaging machine|manufacturers":"packaging-machine-manufacturers-in-india",
  "LED lights|wholesalers":"led-light-wholesalers-in-india",
  "hydraulic machinery|suppliers":"hydraulic-machinery-suppliers-in-india",
  "cotton fabric|wholesalers":"cotton-fabric-wholesalers-in-india",
  "industrial rubber products|suppliers":"industrial-rubber-products-suppliers-in-india"
};

const roleSpecs = [
  { suffix:"manufacturers in India", role:"manufacturers" as const, types:["Manufacturer"], intent:"Commercial" },
  { suffix:"suppliers in India", role:"suppliers" as const, types:["Manufacturer","Trader","Wholesaler","Distributor"], intent:"Commercial" },
  { suffix:"wholesalers in India", role:"wholesalers" as const, types:["Wholesaler","Trader","Distributor"], intent:"Commercial" },
];
for (const product of products) for (const spec of roleSpecs) {
  if (targets.length >= 500) break;
  const keyword = `${product} ${spec.suffix}`;
  const target = existingSlugs[`${product}|${spec.role}`] ?? slugify(keyword);
  add(keyword, "Industry and product", spec.intent, "high", target, product, spec.role);
}
for (const product of products) for (const suffix of ["dealers in India","distributors in India","exporters in India"]) {
  if (targets.length >= 500) break;
  const keyword = `${product} ${suffix}`;
  const target = slugify(`${product} suppliers in India`);
  add(keyword, "Industry and product", "Commercial", "medium", target, product, "suppliers");
}

export const seoKeywordTargets = targets;
