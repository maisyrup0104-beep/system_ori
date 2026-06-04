-- Batch 12: Client Workspace System

-- Extend clients table with workspace fields
alter table clients
  add column if not exists project_status text not null default 'Discovery',
  add column if not exists selected_concept text,
  add column if not exists selected_concept_reason text,
  add column if not exists selected_concept_date date;

-- Discovery data (one row per client)
create table if not exists client_discovery (
  id                     uuid primary key default gen_random_uuid(),
  client_id              uuid not null references clients(id) on delete cascade,
  owner_name             text,
  contact_person         text,
  phone                  text,
  email                  text,
  website                text,
  facebook               text,
  instagram              text,
  target_service         text,
  target_patient         text,
  desired_patient_type   text,
  most_profitable_service text,
  q_biggest_focus        text,
  q_most_revenue         text,
  q_differentiation      text,
  q_patient_questions    text,
  q_concerns_booking     text,
  q_biggest_competitors  text,
  q_patient_type_wanted  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint client_discovery_client_id_unique unique (client_id)
);

-- Opportunity analysis (one row per client)
create table if not exists client_opportunity_analysis (
  id                   uuid primary key default gen_random_uuid(),
  client_id            uuid not null references clients(id) on delete cascade,
  trust_gap            text,
  authority_gap        text,
  premium_gap          text,
  differentiation_gap  text,
  additional_notes     text,
  opportunities        text,
  observations         text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint client_opportunity_analysis_client_id_unique unique (client_id)
);

-- Production workspace (one row per client)
create table if not exists client_production_workspace (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid not null references clients(id) on delete cascade,
  creative_brief     text,
  storyboard         text,
  scene_notes        text,
  wardrobe_notes     text,
  location_notes     text,
  props_notes        text,
  production_status  text not null default 'Not Started',
  draft_links        text[] not null default '{}',
  production_notes   text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint client_production_workspace_client_id_unique unique (client_id)
);

-- Delivery workspace (one row per client)
create table if not exists client_delivery_workspace (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references clients(id) on delete cascade,
  deliverables        text,
  delivery_date       date,
  delivery_notes      text,
  client_confirmation text,
  delivery_status     text not null default 'Pending',
  final_asset_links   text[] not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint client_delivery_workspace_client_id_unique unique (client_id)
);

-- Testimonial workspace (one row per client)
create table if not exists client_testimonial_workspace (
  id                    uuid primary key default gen_random_uuid(),
  client_id             uuid not null references clients(id) on delete cascade,
  testimonial_status    text not null default 'Not Requested',
  feedback              text,
  permission_showcase   boolean not null default false,
  case_study_permission boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint client_testimonial_workspace_client_id_unique unique (client_id)
);

-- Asset links (many rows per client)
create table if not exists client_assets (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  asset_type text not null,
  label      text,
  url        text not null,
  notes      text,
  created_at timestamptz not null default now()
);

-- Validation signals — feeds PMF Intelligence (many rows per client)
create table if not exists client_validation_signals (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  signal       text not null,
  signal_type  text not null default 'Observation',
  segment      text,
  created_at   timestamptz not null default now()
);

-- Workspace timeline — project history (many rows per client)
create table if not exists client_workspace_timeline (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  event_type  text not null,
  description text not null,
  created_at  timestamptz not null default now()
);
