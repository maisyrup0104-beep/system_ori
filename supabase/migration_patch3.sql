-- Patch 3: Pipeline Table View Refactor
-- Adds sort_order (manual row ordering), client_id (link to workspace),
-- and source (acquisition channel) to the leads table.

alter table leads
  add column if not exists sort_order  integer,
  add column if not exists client_id   uuid references clients(id) on delete set null,
  add column if not exists source      text;

-- Seed sort_order for existing leads (oldest = row #1)
with ranked as (
  select id, row_number() over (order by created_at asc) as rn
  from leads
)
update leads
set sort_order = ranked.rn
from ranked
where leads.id = ranked.id
  and leads.sort_order is null;
