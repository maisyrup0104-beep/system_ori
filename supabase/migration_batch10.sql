-- ORI Sprint OS — Batch 10: Adaptive Future Narrative Engine

create table if not exists future_narrative_forecasts (
  id              uuid primary key default gen_random_uuid(),
  forecast_date   date,
  pillar          text not null,
  narrative_stack text,
  narrative_arc   text[],
  allocation_pct  numeric(5, 2),
  reason          text,
  source_state    jsonb,
  source_pmf_asset text,
  generated_at    timestamptz not null default now(),
  status          text not null default 'Active',
  is_priority     boolean not null default false
);
