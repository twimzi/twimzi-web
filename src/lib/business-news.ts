export type BusinessNewsCategory = "Trade & Exports" | "Manufacturing" | "Markets & Policy";

export type BusinessNewsItem = {
  slug: string;
  title: string;
  category: BusinessNewsCategory;
  publishedAt: string;
  source: string;
  sourceUrl: string;
  summary: string;
  whyItMatters: string;
  keyPoints: string[];
  readingTime: number;
};

export const businessNews: BusinessNewsItem[] = [
  {
    slug: "india-indonesia-review-trade-investment-cooperation-november-2026",
    title: "India and Indonesia review trade cooperation as bilateral trade reaches $24.78 billion",
    category: "Trade & Exports",
    publishedAt: "2026-11-19",
    source: "Press Information Bureau, Government of India",
    sourceUrl: "https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=2338780&lang=1&reg=1",
    summary: "India and Indonesia reviewed trade and investment cooperation at their second Working Group meeting in New Delhi. The Government said bilateral trade stood at USD 24.78 billion in FY 2025–26, with discussions covering market access, standards, customs cooperation, logistics and opportunities across machinery, automobiles, agriculture, pharmaceuticals, electronics and renewable energy.",
    whyItMatters: "Indian manufacturers, traders and exporters can watch for practical market-access developments in Indonesia. The sectors discussed include machinery, auto components, agricultural products, electronics and energy-related products. The meeting itself is not a new export permission or tariff change; businesses should verify product-specific rules before shipping.",
    keyPoints: [
      "Bilateral trade was reported at USD 24.78 billion in FY 2025–26.",
      "India identified opportunities including machinery, automobiles and components, dairy, rice, spices, electronics, solar and energy-related products.",
      "The discussions also covered certification, customs cooperation, port and air connectivity, and resolving exporter issues."
    ],
    readingTime: 3
  },
  {
    slug: "export-promotion-mission-guidelines-amended-four-interventions-november-2026",
    title: "Export Promotion Mission guidelines amended across four support interventions",
    category: "Trade & Exports",
    publishedAt: "2026-11-18",
    source: "Press Information Bureau, Government of India",
    sourceUrl: "https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=2337815&lang=1&reg=1",
    summary: "The Department of Commerce amended guidelines for four interventions under the Niryat Disha sub-scheme of the Export Promotion Mission on 17 November 2026. The interventions cover Market Access Support (MAS), Trade Regulations, Accreditation & Compliance Enablement (TRACE), and Logistics Interventions for Freight and Transport (LIFT).",
    whyItMatters: "These interventions are relevant to exporters exploring trade fairs, buyer-seller meets, compliance and logistics support. The PIB release says the maximum eligible export turnover for airfare reimbursement linked to specified market-access activities has been raised from ₹75 lakh in the preceding year to ₹50 crore. Exporters should read the complete revised guidelines and eligibility conditions before applying.",
    keyPoints: [
      "Four intervention areas were amended: MAS, TRACE, LIFT and Trade Regulations.",
      "Market Access Support includes buyer-seller meets, reverse buyer-seller meets, trade fairs, exhibitions and trade delegations.",
      "The stated export-turnover ceiling for airfare reimbursement eligibility was increased from ₹75 lakh to ₹50 crore."
    ],
    readingTime: 3
  },
  {
    slug: "indias-electronics-exports-reach-31-97-billion-april-september-2026",
    title: "India’s electronics exports rise 44% to USD 31.97 billion in April–September",
    category: "Manufacturing",
    publishedAt: "2026-11-17",
    source: "Press Information Bureau, Government of India",
    sourceUrl: "https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=2337395&lang=1&reg=3",
    summary: "India’s electronic goods exports reached USD 31.97 billion in April–September FY 2026–27, up 44% from USD 22.20 billion in the same period a year earlier. Smartphone exports grew 35.8% to USD 18.17 billion, while non-smartphone electronics exports rose 56.5% to USD 13.79 billion.",
    whyItMatters: "The figures point to a broader electronics export basket, not only smartphones. Suppliers and manufacturers in components, printed circuit boards, communication equipment and storage products may find this trend useful when assessing supply-chain opportunities. The figures are national sector data, not a guarantee of demand for any individual supplier.",
    keyPoints: [
      "Total electronic goods exports increased from USD 22.20 billion to USD 31.97 billion.",
      "Smartphone exports reached USD 18.17 billion, up 35.8%.",
      "Non-smartphone electronics exports reached USD 13.79 billion, up 56.5%."
    ],
    readingTime: 3
  },
  {
    slug: "india-total-exports-grow-16-66-percent-april-october-2026",
    title: "India’s total exports estimated at USD 568.84 billion for April–October 2026–27",
    category: "Trade & Exports",
    publishedAt: "2026-11-14",
    source: "Department of Commerce, Ministry of Commerce & Industry",
    sourceUrl: "https://www.commerce.gov.in/files/2026-11/PIB%20Release-October%202026%20%281%29.pdf",
    summary: "The Department of Commerce estimated India’s combined merchandise and services exports at USD 568.84 billion for April–October 2026–27, compared with USD 487.59 billion in the corresponding period a year earlier, an increase of 16.66%. Merchandise exports were estimated at USD 309.06 billion, up 21.96%.",
    whyItMatters: "Exporters can use the figures as a high-level view of trade momentum and sector performance. The same release identifies engineering goods, electronic goods, chemicals and gems and jewellery among the contributors to October merchandise export growth. These are aggregate estimates and should not be treated as a forecast for a specific product or destination.",
    keyPoints: [
      "Combined exports were estimated at USD 568.84 billion, up 16.66% year on year.",
      "Merchandise exports were estimated at USD 309.06 billion, up 21.96%.",
      "October 2026 engineering goods exports were reported at USD 12.74 billion, up 36.01% year on year."
    ],
    readingTime: 3
  }
];

export const businessNewsCategories = ["All", "Trade & Exports", "Manufacturing", "Markets & Policy"] as const;

export function getBusinessNews(slug: string) {
  return businessNews.find((item) => item.slug === slug) ?? null;
}

export function formatNewsDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(value + "T12:00:00+05:30"));
}
