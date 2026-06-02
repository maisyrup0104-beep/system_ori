-- Batch 5 Migration — Clients + Production OS
-- Run in Supabase SQL Editor on an existing database.

-- Clients: fulfillment fields
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS client_type       text NOT NULL DEFAULT 'Paid Client',
  ADD COLUMN IF NOT EXISTS client_status     text NOT NULL DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS start_date        date,
  ADD COLUMN IF NOT EXISTS delivery_date     date,
  ADD COLUMN IF NOT EXISTS delivered_date    date,
  ADD COLUMN IF NOT EXISTS testimonial_status text NOT NULL DEFAULT 'Not Requested',
  ADD COLUMN IF NOT EXISTS drive_link        text,
  ADD COLUMN IF NOT EXISTS photos_link       text,
  ADD COLUMN IF NOT EXISTS videos_link       text,
  ADD COLUMN IF NOT EXISTS brand_ref_link    text,
  ADD COLUMN IF NOT EXISTS asset_checklist   jsonb NOT NULL DEFAULT '{}';

-- Production items: delivery date
ALTER TABLE production_items
  ADD COLUMN IF NOT EXISTS delivery_date  date,
  ADD COLUMN IF NOT EXISTS delivered_date date;

-- Client activity timeline
CREATE TABLE IF NOT EXISTS client_activities (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  uuid        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type       text        NOT NULL,   -- 'note' | 'stage_change' | 'delivery' | 'review' | 'feedback' | 'request'
  content    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_activities_client_id_idx ON client_activities(client_id);
