drop policy if exists "Public can read published business news" on public.business_news;
create policy "Public can read published business news"
on public.business_news for select to anon, authenticated
using (status in ('published','scheduled') and published_at is not null and published_at <= now());
