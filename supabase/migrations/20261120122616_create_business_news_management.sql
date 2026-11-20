create table if not exists public.business_news (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 10 and 220),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category text not null check (category in ('Trade & Exports','Manufacturing','Markets & Policy')),
  summary text not null check (char_length(btrim(summary)) between 30 and 700),
  content text not null check (char_length(btrim(content)) >= 80),
  source_name text not null check (char_length(btrim(source_name)) between 2 and 180),
  source_url text not null check (source_url ~ '^https://'),
  featured_image_url text,
  meta_title text,
  meta_description text,
  status text not null default 'draft' check (status in ('draft','published','scheduled')),
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_news_published_date_check check (status <> 'published' or published_at is not null)
);
create index if not exists business_news_publication_idx on public.business_news (published_at desc) where status = 'published';
create index if not exists business_news_category_idx on public.business_news (category, published_at desc);
alter table public.business_news enable row level security;
revoke all on table public.business_news from anon, authenticated;
grant select on table public.business_news to anon, authenticated;
grant insert, update, delete on table public.business_news to authenticated;
create policy "Public can read published business news" on public.business_news for select to anon, authenticated using (status in ('published','scheduled') and published_at is not null and published_at <= now());
create policy "Super admins can read all business news" on public.business_news for select to authenticated using ((select public.is_super_admin()) is true);
create policy "Super admins can create business news" on public.business_news for insert to authenticated with check ((select public.is_super_admin()) is true and (created_by is null or created_by = (select auth.uid())));
create policy "Super admins can update business news" on public.business_news for update to authenticated using ((select public.is_super_admin()) is true) with check ((select public.is_super_admin()) is true);
create policy "Super admins can delete business news" on public.business_news for delete to authenticated using ((select public.is_super_admin()) is true);

insert into public.business_news (title,slug,category,summary,content,source_name,source_url,status,published_at,meta_title,meta_description) values
('India and Indonesia review trade cooperation as bilateral trade reaches $24.78 billion','india-indonesia-review-trade-investment-cooperation-november-2026','Trade & Exports','India and Indonesia reviewed trade and investment cooperation at their second Working Group meeting in New Delhi. The Government said bilateral trade stood at USD 24.78 billion in FY 2025–26, with discussions covering market access, standards, customs cooperation, logistics and opportunities across machinery, automobiles, agriculture, pharmaceuticals, electronics and renewable energy.','## What happened

India and Indonesia held their second Working Group meeting on trade and investment cooperation in New Delhi. The Government of India reported bilateral trade of USD 24.78 billion in FY 2025–26.

## Areas discussed

The discussions covered market access, standards, customs cooperation, logistics and ways to address issues faced by businesses. Areas identified for trade opportunities included machinery, automobiles and components, agricultural products, pharmaceuticals, electronics and renewable energy.

## Why this matters for Indian businesses

Manufacturers, traders and exporters can monitor future market-access and standards developments in Indonesia. The meeting announcement does not itself create a new export permission, tariff concession or product approval. Exporters should verify applicable Indonesian import rules, standards, certification and customs documentation before shipping.','Press Information Bureau, Government of India','https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=2338780&lang=1&reg=1','published','2026-11-19 10:00:00+05:30','India–Indonesia Trade Cooperation: $24.78 Billion Bilateral Trade | Twimzi','India and Indonesia review trade cooperation, market access, standards and logistics as bilateral trade reaches USD 24.78 billion.'),
('Export Promotion Mission guidelines amended across four support interventions','export-promotion-mission-guidelines-amended-four-interventions-november-2026','Trade & Exports','The Department of Commerce amended guidelines for four interventions under the Niryat Disha sub-scheme of the Export Promotion Mission on 17 November 2026. The interventions cover Market Access Support, Trade Regulations, Accreditation & Compliance Enablement, and Logistics Interventions for Freight and Transport.','## What changed

The Department of Commerce announced amendments to guidelines for four interventions under the Niryat Disha sub-scheme of the Export Promotion Mission on 17 November 2026.

The interventions cover Market Access Support (MAS), Trade Regulations, Accreditation & Compliance Enablement (TRACE), and Logistics Interventions for Freight and Transport (LIFT).

## Why this matters for exporters

Market Access Support includes buyer-seller meets, reverse buyer-seller meets, trade fairs, exhibitions and trade delegations. The PIB release states that the maximum eligible export turnover for airfare reimbursement linked to specified market-access activities has been raised from ₹75 lakh in the preceding year to ₹50 crore.

Eligibility depends on the published guidelines, activity type and required documentation. Read the complete revised guidelines and confirm applicable conditions before incurring costs.','Press Information Bureau, Government of India','https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=2337815&lang=1&reg=1','published','2026-11-18 10:00:00+05:30','Export Promotion Mission: Revised Guidelines for Four Interventions | Twimzi','Government amends four Export Promotion Mission interventions covering market access, trade regulations, compliance and logistics.'),
('India’s electronics exports rise 44% to USD 31.97 billion in April–September','indias-electronics-exports-reach-31-97-billion-april-september-2026','Manufacturing','India’s electronic goods exports reached USD 31.97 billion in April–September FY 2026–27, up 44% from USD 22.20 billion in the same period a year earlier. Smartphone exports grew 35.8% to USD 18.17 billion, while non-smartphone electronics exports rose 56.5% to USD 13.79 billion.','## The latest export figures

India’s electronic goods exports reached USD 31.97 billion in April–September FY 2026–27, compared with USD 22.20 billion in the corresponding period a year earlier.

## Smartphone and other electronics

Smartphone exports were reported at USD 18.17 billion, an increase of 35.8%. Non-smartphone electronics exports reached USD 13.79 billion, up 56.5%.

## Why this matters to manufacturers

The figures indicate growth across a wider electronics export basket, not only smartphones. Component makers and electronics suppliers can use this trend as one input when assessing supply-chain opportunities. National export growth does not guarantee demand for an individual product or supplier.','Press Information Bureau, Government of India','https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=2337395&lang=1&reg=3','published','2026-11-17 10:00:00+05:30','India Electronics Exports Rise 44% to $31.97 Billion | Twimzi','India electronic goods exports reached USD 31.97 billion in April–September FY 2026–27, led by smartphones and other electronics.'),
('India’s total exports estimated at USD 568.84 billion for April–October 2026–27','india-total-exports-grow-16-66-percent-april-october-2026','Trade & Exports','The Department of Commerce estimated India’s combined merchandise and services exports at USD 568.84 billion for April–October 2026–27, compared with USD 487.59 billion in the corresponding period a year earlier, an increase of 16.66%. Merchandise exports were estimated at USD 309.06 billion, up 21.96%.','## India’s export performance

The Department of Commerce estimated India’s combined merchandise and services exports at USD 568.84 billion for April–October 2026–27, compared with USD 487.59 billion in the same period a year earlier.

## Merchandise exports

Merchandise exports were estimated at USD 309.06 billion, up 21.96% year on year. The October 2026 release reported engineering goods exports of USD 12.74 billion, an increase of 36.01% compared with October 2025.

## Business takeaway

These aggregate estimates provide a high-level view of trade momentum, not a forecast for a specific company, product or destination. Exporters should combine national figures with product-level demand, buyer feedback, pricing and compliance checks.','Department of Commerce, Ministry of Commerce & Industry','https://www.commerce.gov.in/files/2026-11/PIB%20Release-October%202026%20%281%29.pdf','published','2026-11-14 10:00:00+05:30','India Exports Reach $568.84 Billion in April–October 2026–27 | Twimzi','India’s combined merchandise and services exports estimated at USD 568.84 billion for April–October 2026–27, up 16.66%.')
on conflict (slug) do nothing;
