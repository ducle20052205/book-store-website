-- ============================================================================
-- 0001_init_schema.sql
--
-- Schema khoi tao cho book-store-website:
--   profiles, categories, books, cart_items, orders, order_items, events
--
-- Bao gom: bang, index cho cac cot khoa ngoai, Row Level Security (RLS) +
-- policies theo dung yeu cau, va trigger tu tao profile khi co user moi
-- dang ky qua Supabase Auth.
-- ============================================================================

begin;

-- can cho gen_random_uuid()
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABLES
-- ----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text default 'customer' check (role in ('customer', 'admin')),
  phone text,
  address text,
  created_at timestamptz default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  parent_id uuid references public.categories (id),
  description text,
  created_at timestamptz default now()
);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  author text not null,
  translator text,
  publisher text,
  description text,
  table_of_contents text,
  price numeric not null,
  discount_price numeric,
  isbn text,
  page_count int,
  dimensions text,
  publish_date date,
  cover_image_url text,
  stock_quantity int default 0,
  category_id uuid references public.categories (id),
  created_at timestamptz default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  book_id uuid references public.books (id) on delete cascade,
  quantity int default 1 check (quantity > 0),
  created_at timestamptz default now(),
  unique (user_id, book_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id),
  status text default 'pending' check (status in ('pending', 'processing', 'shipped', 'completed', 'cancelled')),
  total_amount numeric not null,
  shipping_address text,
  created_at timestamptz default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete cascade,
  book_id uuid references public.books (id),
  quantity int not null,
  price_at_purchase numeric not null
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id),
  session_id text,
  event_type text not null check (event_type in ('page_view', 'add_to_cart', 'checkout_started', 'order_placed')),
  metadata jsonb,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- 2. INDEXES
-- Postgres khong tu tao index cho cot khoa ngoai (FK), nen them thu cong
-- cho cac cot chac chan se duoc loc/join thuong xuyen.
-- ----------------------------------------------------------------------------

create index categories_parent_id_idx on public.categories (parent_id);
create index books_category_id_idx on public.books (category_id);
create index orders_user_id_idx on public.orders (user_id);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_book_id_idx on public.order_items (book_id);
create index events_user_id_idx on public.events (user_id);
create index events_event_type_idx on public.events (event_type);

-- ----------------------------------------------------------------------------
-- 3. HELPER FUNCTION: kiem tra role admin
--
-- security definer + search_path rong de: (a) khong bi loi dung boi viec
-- tao object trung ten trong schema khac (search-path hijacking), va
-- (b) tranh loi "infinite recursion detected in policy for relation
-- profiles" khi chinh policy cua bang profiles can doc lai profiles.role.
-- ----------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.books enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.events enable row level security;

-- profiles: user xem/sua row cua chinh minh; admin xem duoc tat ca.
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- categories: doc cong khai (ke ca chua dang nhap); ghi chi admin.
create policy "categories_select_public"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "categories_admin_insert"
  on public.categories for insert
  to authenticated
  with check (public.is_admin());

create policy "categories_admin_update"
  on public.categories for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "categories_admin_delete"
  on public.categories for delete
  to authenticated
  using (public.is_admin());

-- books: doc cong khai (ke ca chua dang nhap); ghi chi admin.
create policy "books_select_public"
  on public.books for select
  to anon, authenticated
  using (true);

create policy "books_admin_insert"
  on public.books for insert
  to authenticated
  with check (public.is_admin());

create policy "books_admin_update"
  on public.books for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "books_admin_delete"
  on public.books for delete
  to authenticated
  using (public.is_admin());

-- cart_items: chi chu so huu (user_id = auth.uid()) duoc SELECT/INSERT/UPDATE/DELETE.
create policy "cart_items_owner_all"
  on public.cart_items for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- orders: user chi SELECT don cua chinh minh; admin SELECT + UPDATE tat ca.
create policy "orders_select_own_or_admin"
  on public.orders for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

create policy "orders_admin_update"
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- order_items: user chi SELECT item thuoc don cua minh; admin SELECT + UPDATE tat ca.
create policy "order_items_select_own_or_admin"
  on public.order_items for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );

create policy "order_items_admin_update"
  on public.order_items for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- events: insert cong khai ke ca anonymous; chi admin moi SELECT duoc.
create policy "events_insert_public"
  on public.events for insert
  to anon, authenticated
  with check (true);

create policy "events_admin_select"
  on public.events for select
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. Chan tu nang quyen tren profiles
--
-- RLS chi kiem soat duoc ROW nao duoc sua (auth.uid() = id), khong kiem
-- soat duoc COT nao bi doi trong row do. Neu khong co trigger nay, bat ky
-- user nao cung co the tu UPDATE profiles SET role = 'admin' cho chinh
-- minh va vo hieu hoa toan bo phan quyen admin/customer trong file nay.
-- ----------------------------------------------------------------------------

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row
  execute function public.protect_profile_role();

-- ----------------------------------------------------------------------------
-- 6. TRIGGER: tu tao profile khi co user moi trong auth.users
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'customer');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

commit;
