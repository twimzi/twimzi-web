create table if not exists public.blog_post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
create index if not exists blog_post_likes_post_id_idx on public.blog_post_likes(post_id);

create table if not exists public.blog_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  body text not null check (char_length(trim(body)) between 2 and 2000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists blog_post_comments_public_idx
  on public.blog_post_comments(post_id, created_at desc) where status = 'approved';
create index if not exists blog_post_comments_moderation_idx
  on public.blog_post_comments(status, created_at desc);

alter table public.blog_post_likes enable row level security;
alter table public.blog_post_comments enable row level security;

drop policy if exists "Public can count blog likes" on public.blog_post_likes;
create policy "Public can count blog likes" on public.blog_post_likes
  for select to anon, authenticated using (true);
drop policy if exists "Users can like published blog posts" on public.blog_post_likes;
create policy "Users can like published blog posts" on public.blog_post_likes
  for insert to authenticated with check (
    user_id = (select auth.uid()) and exists (
      select 1 from public.blog_posts bp where bp.id = post_id and bp.status = 'published'
    )
  );
drop policy if exists "Users can remove own blog likes" on public.blog_post_likes;
create policy "Users can remove own blog likes" on public.blog_post_likes
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Public can read approved blog comments" on public.blog_post_comments;
create policy "Public can read approved blog comments" on public.blog_post_comments
  for select to anon, authenticated using (status = 'approved');
drop policy if exists "Users can read own blog comments" on public.blog_post_comments;
create policy "Users can read own blog comments" on public.blog_post_comments
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Authenticated users can submit blog comments" on public.blog_post_comments;
create policy "Authenticated users can submit blog comments" on public.blog_post_comments
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and exists (select 1 from public.blog_posts bp where bp.id = post_id and bp.status = 'published')
  );
drop policy if exists "Super admins can moderate blog comments" on public.blog_post_comments;
create policy "Super admins can moderate blog comments" on public.blog_post_comments
  for update to authenticated using ((select public.is_super_admin()) is true)
  with check ((select public.is_super_admin()) is true);
drop policy if exists "Super admins can delete blog comments" on public.blog_post_comments;
create policy "Super admins can delete blog comments" on public.blog_post_comments
  for delete to authenticated using ((select public.is_super_admin()) is true);

grant select on public.blog_post_likes to anon, authenticated;
grant insert, delete on public.blog_post_likes to authenticated;
grant select, insert on public.blog_post_comments to authenticated;
grant select on public.blog_post_comments to anon;
grant update, delete on public.blog_post_comments to authenticated;
