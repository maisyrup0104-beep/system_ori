-- ORI Sprint OS — Batch 9: Content Queue V2

-- Upgrade content_queue with missing production workflow columns

alter table content_queue
  add column if not exists title                   text,
  add column if not exists notes                   text,
  add column if not exists source_concept_features text[],
  add column if not exists posted_at               timestamptz,
  add column if not exists updated_at              timestamptz not null default now();
