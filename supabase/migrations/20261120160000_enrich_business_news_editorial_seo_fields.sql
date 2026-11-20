alter table public.business_news
  add column if not exists primary_keyword text,
  add column if not exists secondary_keywords text[] not null default '{}',
  add column if not exists key_takeaways jsonb not null default '[]'::jsonb,
  add column if not exists business_impact text,
  add column if not exists action_points jsonb not null default '[]'::jsonb,
  add column if not exists key_figures jsonb not null default '[]'::jsonb,
  add column if not exists faq jsonb not null default '[]'::jsonb,
  add column if not exists related_links jsonb not null default '[]'::jsonb,
  add column if not exists editorial_updated_at timestamptz;

comment on column public.business_news.primary_keyword is 'Primary search intent phrase; editorial guidance, not keyword stuffing.';
comment on column public.business_news.key_takeaways is 'Structured factual takeaways for readers and answer engines.';
comment on column public.business_news.business_impact is 'Evidence-based explanation of who is affected and how.';
comment on column public.business_news.action_points is 'Practical next steps with eligibility caveats.';
comment on column public.business_news.key_figures is 'Verified figures with labels, values, units and context.';
comment on column public.business_news.faq is 'Specific factual questions and concise source-supported answers.';
