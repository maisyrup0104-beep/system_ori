-- ORI Sprint OS — Patch 1: Content Calendar scheduling fields

alter table content_queue
  add column if not exists scheduled_date date,
  add column if not exists scheduled_time time;
