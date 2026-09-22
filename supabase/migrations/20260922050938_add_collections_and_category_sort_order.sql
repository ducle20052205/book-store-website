-- ============================================================================
-- 20260922050938_add_collections_and_category_sort_order.sql
--
-- Mục 4.1 spec brand-update: thêm categories.sort_order (thứ tự hiển thị
-- trong mega-menu) và 2 bảng mới cho tủ sách tuyển chọn: collections,
-- collection_books. RLS bật trên cả 2 bảng: đọc công khai, ghi chỉ admin
-- (cùng pattern is_admin() đang dùng cho categories/books).
-- ============================================================================

begin;

-- Thứ tự hiển thị danh mục trong mega-menu
alter table public.categories
  add column if not exists sort_order int not null default 0;

-- Tủ sách tuyển chọn
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  cover_image_url text,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Tối đa 1 tủ sách được chọn làm hero
create unique index collections_one_featured
  on public.collections (is_featured) where is_featured;

create table public.collection_books (
  collection_id uuid not null references public.collections(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  position int not null default 0,
  curator_note text not null,
  primary key (collection_id, book_id)
);

create index collection_books_book_id_idx on public.collection_books (book_id);

alter table public.collections enable row level security;
alter table public.collection_books enable row level security;

create policy "collections_select_public"
  on public.collections for select to anon, authenticated using (true);
create policy "collections_admin_insert"
  on public.collections for insert to authenticated with check (public.is_admin());
create policy "collections_admin_update"
  on public.collections for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "collections_admin_delete"
  on public.collections for delete to authenticated using (public.is_admin());

create policy "collection_books_select_public"
  on public.collection_books for select to anon, authenticated using (true);
create policy "collection_books_admin_insert"
  on public.collection_books for insert to authenticated with check (public.is_admin());
create policy "collection_books_admin_update"
  on public.collection_books for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "collection_books_admin_delete"
  on public.collection_books for delete to authenticated using (public.is_admin());

commit;
