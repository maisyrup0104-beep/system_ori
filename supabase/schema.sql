-- ORI Sprint OS — Database Schema

create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  revenue_goal numeric(12, 2) not null default 0,
  current_revenue numeric(12, 2) not null default 0,
  days_remaining integer not null default 18,
  current_focus text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_type text,
  event_subtype text,
  segment text,
  visibility_target text,
  strength integer,
  notes text,
  proof_url text,
  created_at timestamptz not null default now()
);

create table if not exists personal_states (
  id uuid primary key default gen_random_uuid(),
  authority integer,
  trust integer,
  momentum integer,
  authenticity integer,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists ori_states (
  id uuid primary key default gen_random_uuid(),
  capability integer,
  credibility integer,
  proof integer,
  relevance integer,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  segment text,
  stage text,
  contact_name text,
  contact_method text,
  contact_value text,
  facebook_link text,
  instagram_link text,
  website text,
  phone text,
  notes text,
  last_contact_date date,
  next_followup_date date,
  created_at timestamptz not null default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  segment text,
  client_type text not null default 'Paid Client',
  client_status text not null default 'Active',
  package_name text,
  price numeric(12, 2),
  actual_revenue numeric(12, 2) not null default 0,
  payment_status text,
  revenue_notes text,
  delivery_status text,
  start_date date,
  delivery_date date,
  delivered_date date,
  testimonial_status text not null default 'Not Requested',
  drive_link text,
  photos_link text,
  videos_link text,
  brand_ref_link text,
  asset_checklist jsonb not null default '{}',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists client_activities (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  type text not null,
  content text,
  created_at timestamptz not null default now()
);

create table if not exists lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  type text not null,
  content text,
  created_at timestamptz not null default now()
);

create table if not exists production_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  stage text,
  delivery_date date,
  delivered_date date,
  asset_links text[],
  notes text,
  created_at timestamptz not null default now()
);

-- Seed a default settings row so the app always has data to read
insert into settings (revenue_goal, current_revenue, days_remaining, current_focus)
values (40000, 0, 18, 'Book first discovery call')
on conflict do nothing;
