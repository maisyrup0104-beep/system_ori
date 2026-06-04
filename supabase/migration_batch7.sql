-- ORI Sprint OS — Batch 7: PMF Intelligence Engine

-- ── Segments ────────────────────────────────────────────────────────────────
create table if not exists pmf_segments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Target Customers ─────────────────────────────────────────────────────────
create table if not exists pmf_target_customers (
  id uuid primary key default gen_random_uuid(),
  segment_id uuid not null references pmf_segments(id) on delete cascade,
  sub_segment text,
  primary_buyer text,
  decision_maker text,
  budget_approver text,
  primary_pain text,
  desired_outcome text,
  current_alternatives text[],
  success_metrics text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Root Problems ────────────────────────────────────────────────────────────
create table if not exists pmf_root_problems (
  id uuid primary key default gen_random_uuid(),
  segment_id uuid not null references pmf_segments(id) on delete cascade,
  problem text not null,
  importance integer not null default 5,
  satisfaction integer not null default 5,
  opportunity numeric(4,2) generated always as (importance + importance * (1 - satisfaction / 10.0)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Underserved Needs ────────────────────────────────────────────────────────
create table if not exists pmf_underserved_needs (
  id uuid primary key default gen_random_uuid(),
  segment_id uuid not null references pmf_segments(id) on delete cascade,
  need text not null,
  related_root_problem_id uuid references pmf_root_problems(id) on delete set null,
  priority text not null default 'Medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Requirements ─────────────────────────────────────────────────────────────
create table if not exists pmf_requirements (
  id uuid primary key default gen_random_uuid(),
  segment_id uuid not null references pmf_segments(id) on delete cascade,
  requirement text not null,
  description text,
  priority text not null default 'Medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Solution Clusters ────────────────────────────────────────────────────────
create table if not exists pmf_solution_clusters (
  id uuid primary key default gen_random_uuid(),
  segment_id uuid not null references pmf_segments(id) on delete cascade,
  cluster_name text not null,
  description text,
  related_requirements text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Value Propositions ───────────────────────────────────────────────────────
create table if not exists pmf_value_propositions (
  id uuid primary key default gen_random_uuid(),
  segment_id uuid not null references pmf_segments(id) on delete cascade,
  current_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Deliverables ─────────────────────────────────────────────────────────────
create table if not exists pmf_deliverables (
  id uuid primary key default gen_random_uuid(),
  segment_id uuid not null references pmf_segments(id) on delete cascade,
  deliverable text not null,
  category text,
  purpose text,
  related_requirement_id uuid references pmf_requirements(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Concept Features ─────────────────────────────────────────────────────────
create table if not exists pmf_concept_features (
  id uuid primary key default gen_random_uuid(),
  segment_id uuid not null references pmf_segments(id) on delete cascade,
  title text not null,
  hypothesis text,
  root_problem_id uuid references pmf_root_problems(id) on delete set null,
  status text not null default 'Idea',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Seed ─────────────────────────────────────────────────────────────────────

-- Segment
insert into pmf_segments (id, name, status)
values ('00000000-0000-0000-0000-000000000001', 'Growing Med Spa', 'Active')
on conflict (id) do nothing;

-- Target Customer
insert into pmf_target_customers (
  segment_id, sub_segment, primary_buyer, decision_maker, budget_approver,
  primary_pain, desired_outcome, current_alternatives, success_metrics
) values (
  '00000000-0000-0000-0000-000000000001',
  null,
  'Owner', 'Owner', 'Owner',
  'Difficulty building trust, premium perception, and differentiation before consultation.',
  'More qualified bookings without competing on price.',
  ARRAY['Social Media', 'Ads', 'Influencers', 'Promotions', 'Agencies'],
  ARRAY['More consultations', 'Higher trust', 'Higher perceived value', 'Higher willingness to pay']
)
on conflict do nothing;

-- Root Problems
insert into pmf_root_problems (id, segment_id, problem, importance, satisfaction) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Reduce perceived risk before consultation', 9, 3),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Increase perceived value before purchase', 9, 3),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Become memorable before contact', 8, 4),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Increase confidence through demonstrated expertise', 9, 4),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Help patients commit confidently', 8, 3),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Increase trust through visible evidence', 9, 3)
on conflict (id) do nothing;

-- Underserved Needs
insert into pmf_underserved_needs (segment_id, need, related_root_problem_id, priority) values
  ('00000000-0000-0000-0000-000000000001', 'Help patients feel safe choosing a clinic', '10000000-0000-0000-0000-000000000001', 'High'),
  ('00000000-0000-0000-0000-000000000001', 'Help patients understand value beyond price', '10000000-0000-0000-0000-000000000002', 'High'),
  ('00000000-0000-0000-0000-000000000001', 'Help patients understand what makes them different', '10000000-0000-0000-0000-000000000003', 'High'),
  ('00000000-0000-0000-0000-000000000001', 'Help patients recognize expertise', '10000000-0000-0000-0000-000000000004', 'High')
on conflict do nothing;

-- Requirements
insert into pmf_requirements (id, segment_id, requirement, description, priority) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Decision Confidence', 'Help patients feel confident enough to book without hesitation.', 'High'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Value Communication', 'Communicate worth beyond price points.', 'High'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Differentiation', 'Stand out clearly from competitors in the same market.', 'High'),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Expertise Communication', 'Demonstrate clinical expertise in a visible and credible way.', 'High')
on conflict (id) do nothing;

-- Solution Clusters
insert into pmf_solution_clusters (segment_id, cluster_name, description, related_requirements) values
  ('00000000-0000-0000-0000-000000000001', 'Trust Building', 'Content and assets that reduce patient fear and increase psychological safety.', ARRAY['Decision Confidence', 'Value Communication']),
  ('00000000-0000-0000-0000-000000000001', 'Authority', 'Systems that position the clinic as the most credible option in the market.', ARRAY['Expertise Communication', 'Differentiation']),
  ('00000000-0000-0000-0000-000000000001', 'Premium Perception', 'Assets and experiences that signal high-value before any transaction.', ARRAY['Value Communication']),
  ('00000000-0000-0000-0000-000000000001', 'Differentiation', 'Messaging and content that highlights what makes the clinic uniquely right for the patient.', ARRAY['Differentiation']),
  ('00000000-0000-0000-0000-000000000001', 'Education', 'Content that helps patients understand their options and why this clinic is the answer.', ARRAY['Decision Confidence', 'Expertise Communication']),
  ('00000000-0000-0000-0000-000000000001', 'Social Validation', 'Proof systems using real patient voices and outcomes.', ARRAY['Decision Confidence', 'Trust Building'])
on conflict do nothing;

-- Value Proposition
insert into pmf_value_propositions (segment_id, current_version) values
  (
    '00000000-0000-0000-0000-000000000001',
    'ORI helps growing med spas increase patient decision confidence before consultation through trust, expertise, and premium positioning without relying on generic promotional content.'
  )
on conflict do nothing;

-- Deliverables
insert into pmf_deliverables (segment_id, deliverable, category, purpose, related_requirement_id) values
  ('00000000-0000-0000-0000-000000000001', 'Trust Film', 'Film', 'Build emotional safety and trust before first contact.', '20000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'Premium Positioning Film', 'Film', 'Signal high value and justify premium pricing before consultation.', '20000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000001', 'Clinic Philosophy Film', 'Film', 'Communicate core values and differentiation.', '20000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000001', 'Authority Series', 'Series', 'Demonstrate clinical expertise across multiple touchpoints.', '20000000-0000-0000-0000-000000000004'),
  ('00000000-0000-0000-0000-000000000001', 'Patient Story', 'Story', 'Provide social proof through real patient experiences.', '20000000-0000-0000-0000-000000000001')
on conflict do nothing;

-- Concept Features
insert into pmf_concept_features (segment_id, title, hypothesis, root_problem_id, status) values
  ('00000000-0000-0000-0000-000000000001', 'The Trust Gap', 'Growing med spas struggle because patients do not feel confident enough before consultation.', '10000000-0000-0000-0000-000000000001', 'Idea'),
  ('00000000-0000-0000-0000-000000000001', 'Why Premium Wins', 'Growing med spas struggle to justify premium pricing.', '10000000-0000-0000-0000-000000000002', 'Idea'),
  ('00000000-0000-0000-0000-000000000001', 'The Clinic Nobody Remembers', 'Growing med spas struggle because they look similar to competitors.', '10000000-0000-0000-0000-000000000003', 'Idea'),
  ('00000000-0000-0000-0000-000000000001', 'Before Trust Comes Expertise', 'Patients want confidence in expertise before consultation.', '10000000-0000-0000-0000-000000000004', 'Idea'),
  ('00000000-0000-0000-0000-000000000001', 'The Decision Moment', 'Many patients hesitate because they cannot confidently decide.', '10000000-0000-0000-0000-000000000005', 'Idea')
on conflict do nothing;
