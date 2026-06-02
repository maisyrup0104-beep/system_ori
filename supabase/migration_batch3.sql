-- Batch 3 Migration — Revenue OS
-- Run this in Supabase SQL Editor on an existing database.
-- New databases should use schema.sql instead.

-- Add social/contact fields to leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS facebook_link text,
  ADD COLUMN IF NOT EXISTS instagram_link text,
  ADD COLUMN IF NOT EXISTS website      text,
  ADD COLUMN IF NOT EXISTS phone        text;

-- Add revenue fields to clients
-- 'price' column continues to serve as quoted_price in the UI
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS actual_revenue numeric(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue_notes  text;

-- Lead activity timeline
CREATE TABLE IF NOT EXISTS lead_activities (
  id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id   uuid        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type      text        NOT NULL,  -- 'note' | 'stage_change' | 'followup'
  content   text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_activities_lead_id_idx ON lead_activities(lead_id);
