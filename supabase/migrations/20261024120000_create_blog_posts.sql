create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 5 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt text not null check (char_length(trim(excerpt)) between 20 and 500),
  content text not null check (char_length(trim(content)) >= 50),
  featured_image_url text,
  meta_title text,
  meta_description text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  author_id uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_published_at_idx
  on public.blog_posts (published_at desc)
  where status = 'published';

alter table public.blog_posts enable row level security;

drop policy if exists "Public can read published blog posts" on public.blog_posts;
create policy "Public can read published blog posts"
  on public.blog_posts for select to anon, authenticated
  using (status = 'published');

drop policy if exists "Super admins can read all blog posts" on public.blog_posts;
create policy "Super admins can read all blog posts"
  on public.blog_posts for select to authenticated
  using ((select public.is_super_admin()) is true);

drop policy if exists "Super admins can insert blog posts" on public.blog_posts;
create policy "Super admins can insert blog posts"
  on public.blog_posts for insert to authenticated
  with check ((select public.is_super_admin()) is true and (author_id is null or author_id = (select auth.uid())));

drop policy if exists "Super admins can update blog posts" on public.blog_posts;
create policy "Super admins can update blog posts"
  on public.blog_posts for update to authenticated
  using ((select public.is_super_admin()) is true)
  with check ((select public.is_super_admin()) is true);

drop policy if exists "Super admins can delete blog posts" on public.blog_posts;
create policy "Super admins can delete blog posts"
  on public.blog_posts for delete to authenticated
  using ((select public.is_super_admin()) is true);

create or replace function public.set_blog_posts_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_blog_posts_updated_at on public.blog_posts;
create trigger set_blog_posts_updated_at
before update on public.blog_posts
for each row execute function public.set_blog_posts_updated_at();

grant select on public.blog_posts to anon, authenticated;
grant insert, update, delete on public.blog_posts to authenticated;
