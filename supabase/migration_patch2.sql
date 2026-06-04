-- ORI Sprint OS — Patch 2: Remove Narrative Forecast Engine
-- Reverses migration_batch10 — the planning layer was removed in favor of simplicity.

drop table if exists future_narrative_forecasts;
