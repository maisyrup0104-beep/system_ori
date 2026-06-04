-- ORI Sprint OS — Batch 8: Content Opportunities Engine

-- ── Narrative Stacks ──────────────────────────────────────────────────────────
create table if not exists content_narrative_stacks (
  id uuid primary key default gen_random_uuid(),
  pillar text not null,
  narrative text not null,
  created_at timestamptz not null default now()
);

-- ── Supporting Moments ────────────────────────────────────────────────────────
create table if not exists content_supporting_moments (
  id uuid primary key default gen_random_uuid(),
  moment text not null unique,
  created_at timestamptz not null default now()
);

-- ── Story Templates ───────────────────────────────────────────────────────────
create table if not exists content_story_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  steps text[] not null,
  created_at timestamptz not null default now()
);

-- ── Content Queue (saved opportunities) ──────────────────────────────────────
create table if not exists content_queue (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'Both',
  visibility text,
  priority text not null default 'Medium',
  primary_pillar text not null,
  narrative_stack text,
  supporting_moments text[],
  story_template_name text,
  story_template_steps text[],
  source_type text,
  source_events text[],
  source_pmf_assets text[],
  reason text,
  status text not null default 'Queued',
  created_at timestamptz not null default now()
);

-- ── Seed: Narrative Stacks ────────────────────────────────────────────────────
insert into content_narrative_stacks (pillar, narrative) values
  ('Real Validation',       'Documentary'),
  ('Real Validation',       'Validation'),
  ('Real Validation',       'Field Notes'),
  ('Real Validation',       'Authority Builder'),
  ('Building Journey',      'Builder'),
  ('Building Journey',      'Progress Arc'),
  ('Building Journey',      'Experiment'),
  ('Building Journey',      'Behind The Scenes'),
  ('PMF Discovery',         'Problem Discovery'),
  ('PMF Discovery',         'Need Discovery'),
  ('PMF Discovery',         'Market Gap'),
  ('PMF Discovery',         'Validation Trail'),
  ('PMF Discovery',         'Pattern Recognition'),
  ('Founder Insight',       'Realization'),
  ('Founder Insight',       'Framework'),
  ('Founder Insight',       'Mental Model'),
  ('Founder Insight',       'Contrarian View'),
  ('Founder Insight',       'Observation'),
  ('Market Evidence',       'Evidence Review'),
  ('Market Evidence',       'Validation'),
  ('Market Evidence',       'Signal Collection'),
  ('Market Evidence',       'Pattern Analysis'),
  ('Market Evidence',       'Interpretation'),
  ('Industry Observation',  'Field Notes'),
  ('Industry Observation',  'Observation'),
  ('Industry Observation',  'Pattern Analysis'),
  ('Industry Observation',  'Trend Watch'),
  ('Concept Building',      'Hypothesis'),
  ('Concept Building',      'Experiment'),
  ('Concept Building',      'Testing'),
  ('Concept Building',      'Iteration'),
  ('Authority',             'Field Notes'),
  ('Authority',             'Observation'),
  ('Authority',             'Authority Builder'),
  ('Authority',             'Framework'),
  ('Trust',                 'Documentary'),
  ('Trust',                 'Validation'),
  ('Trust',                 'Field Notes'),
  ('Trust',                 'Evidence Review')
on conflict do nothing;

-- ── Seed: Supporting Moments ──────────────────────────────────────────────────
insert into content_supporting_moments (moment) values
  ('Preparation'), ('Travel'), ('Workspace'), ('Planning'),
  ('Challenge'), ('Progress'), ('Conversation'), ('Visit'),
  ('Discovery'), ('Observation'), ('Insight'), ('Reflection'),
  ('Question'), ('Conclusion'), ('First Impression'), ('Objection'),
  ('Learning'), ('Next Step'), ('Validation'), ('Experiment'),
  ('Pattern'), ('Evidence'), ('Interpretation')
on conflict (moment) do nothing;

-- ── Seed: Story Templates ─────────────────────────────────────────────────────
insert into content_story_templates (name, steps) values
  ('Template A', ARRAY['Preparation',  'Conversation', 'Insight',        'Reflection']),
  ('Template B', ARRAY['Question',     'Research',     'Discovery',      'Implication']),
  ('Template C', ARRAY['Visit',        'Observation',  'Pattern',        'Question']),
  ('Template D', ARRAY['Goal',         'Work',         'Obstacle',       'Progress']),
  ('Template E', ARRAY['Assumption',   'Conversation', 'Validation',     'Conclusion']),
  ('Template F', ARRAY['Problem',      'Discovery',    'Insight',        'Next Step']),
  ('Template G', ARRAY['Observation',  'Evidence',     'Interpretation', 'Question'])
on conflict (name) do nothing;
