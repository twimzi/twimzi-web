alter table public.business_news add column if not exists reading_time_minutes integer not null default 1 check (reading_time_minutes between 1 and 60);
update public.business_news
set reading_time_minutes = greatest(1, least(60, ceil(array_length(regexp_split_to_array(btrim(content), E'\\s+'), 1) / 200.0)::integer));
