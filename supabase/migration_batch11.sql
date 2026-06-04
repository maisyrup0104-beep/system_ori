-- ORI Sprint OS — Batch 11: Narrative Day Blueprint Engine

-- ── Narrative Blueprint Library ───────────────────────────────────────────────
create table if not exists narrative_blueprints (
  id                    uuid primary key default gen_random_uuid(),
  primary_pillar        text not null,
  narrative_stack       text,
  blueprint_name        text not null,
  life_moments          text[] not null default '{}',
  work_moments          text[] not null default '{}',
  reflection_moments    text[] not null default '{}',
  recommended_locations text[] not null default '{}',
  recommended_props     text[] not null default '{}',
  recommended_wardrobe  text[] not null default '{}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ── Add blueprint fields to content_queue ─────────────────────────────────────
alter table content_queue
  add column if not exists blueprint_name        text,
  add column if not exists blueprint_life_moments      text[],
  add column if not exists blueprint_work_moments      text[],
  add column if not exists blueprint_reflection_moments text[],
  add column if not exists blueprint_locations         text[],
  add column if not exists blueprint_props             text[],
  add column if not exists blueprint_wardrobe          text[];

-- ── Seed: Real Validation blueprints ─────────────────────────────────────────
insert into narrative_blueprints (primary_pillar, narrative_stack, blueprint_name, life_moments, work_moments, reflection_moments, recommended_locations, recommended_props, recommended_wardrobe) values

('Real Validation', 'Field Notes', 'Field Visit',
  ARRAY['Preparing For Visit', 'Travel'],
  ARRAY['Conversation', 'Observation', 'Insight'],
  ARRAY['Reflection'],
  ARRAY['Home', 'Street', 'Cafe', 'Clinic Exterior', 'Clinic Lobby', 'Workspace'],
  ARRAY['Laptop', 'Phone', 'Coffee', 'Notebook', 'Bag'],
  ARRAY['Black Polo', 'Casual Button Down', 'Business Casual']),

('Real Validation', 'Validation', 'Coffee Shop Validation',
  ARRAY['Question', 'Research', 'Coffee'],
  ARRAY['Coffee Shop Work', 'Conversation', 'Validation'],
  ARRAY['Conclusion'],
  ARRAY['Home', 'Cafe', 'Street'],
  ARRAY['Coffee', 'Laptop', 'Notebook', 'Phone'],
  ARRAY['Smart Casual', 'Casual']),

('Real Validation', 'Validation', 'Objection Discovery',
  ARRAY['Goal'],
  ARRAY['Conversation', 'Unexpected Objection', 'Analysis'],
  ARRAY['Reflection'],
  ARRAY['Home', 'Office', 'Cafe', 'Street'],
  ARRAY['Notebook', 'Phone', 'Coffee'],
  ARRAY['Business Casual', 'Smart Casual']),

('Real Validation', 'Documentary', 'PMF Discovery',
  ARRAY['Assumption'],
  ARRAY['Conversation', 'Discovery'],
  ARRAY['Reflection', 'Question'],
  ARRAY['Home', 'Cafe', 'Client Location'],
  ARRAY['Notebook', 'Laptop', 'Phone'],
  ARRAY['Smart Casual']),

('Real Validation', 'Validation', 'Validation Trail',
  ARRAY['Hypothesis'],
  ARRAY['Conversation', 'Pattern', 'Validation'],
  ARRAY['Conclusion'],
  ARRAY['Home', 'Multiple Locations', 'Cafe'],
  ARRAY['Notebook', 'Phone', 'Coffee'],
  ARRAY['Smart Casual', 'Casual']),

('Real Validation', 'Field Notes', 'Walking Notes',
  ARRAY['Morning Walk', 'Question'],
  ARRAY['Conversation', 'Voice Notes'],
  ARRAY['Insight', 'Reflection'],
  ARRAY['Street', 'Park', 'Neighborhood', 'Cafe'],
  ARRAY['Phone', 'Earphones', 'Water Bottle'],
  ARRAY['Casual', 'Comfortable', 'Active Wear']),

('Real Validation', 'Field Notes', 'Market Reality',
  ARRAY['Expectation', 'Visit', 'Observation'],
  ARRAY['Reality', 'Lesson'],
  ARRAY['Reflection'],
  ARRAY['Home', 'Target Market Location', 'Street', 'Business District'],
  ARRAY['Camera', 'Notebook', 'Phone', 'Coffee'],
  ARRAY['Smart Casual', 'Business Casual']),

('Real Validation', 'Documentary', 'Research Day',
  ARRAY['Question', 'Research'],
  ARRAY['Discovery', 'Insight'],
  ARRAY['Night Reflection'],
  ARRAY['Home', 'Cafe', 'Library'],
  ARRAY['Laptop', 'Coffee', 'Notebook', 'Books'],
  ARRAY['Comfortable', 'Casual']);

-- ── Seed: Building Journey blueprints ────────────────────────────────────────
insert into narrative_blueprints (primary_pillar, narrative_stack, blueprint_name, life_moments, work_moments, reflection_moments, recommended_locations, recommended_props, recommended_wardrobe) values

('Building Journey', 'Builder', 'Builder Day',
  ARRAY['Planning', 'Workspace Setup'],
  ARRAY['Deep Work', 'Progress'],
  ARRAY['Tomorrow Plan'],
  ARRAY['Workspace', 'Home', 'Cafe'],
  ARRAY['Laptop', 'Coffee', 'Notebook', 'Headphones'],
  ARRAY['Comfortable', 'Casual', 'Smart Casual']),

('Building Journey', 'Builder', 'Outreach Sprint',
  ARRAY['Target Selection', 'Outreach Preparation'],
  ARRAY['Outreach', 'Replies', 'Learning', 'Adjustment'],
  ARRAY['Reflection'],
  ARRAY['Workspace', 'Home'],
  ARRAY['Laptop', 'Phone', 'Coffee', 'Notebook'],
  ARRAY['Smart Casual', 'Casual']),

('Building Journey', 'Experiment', 'Demo Creation',
  ARRAY['Concept', 'Storyboard'],
  ARRAY['Building', 'Challenge', 'Progress'],
  ARRAY['Reflection'],
  ARRAY['Workspace', 'Home Studio'],
  ARRAY['Laptop', 'Camera', 'Whiteboard', 'Markers', 'Phone'],
  ARRAY['Smart Casual', 'Casual']),

('Building Journey', 'Behind The Scenes', 'Behind The Scenes',
  ARRAY['Workspace', 'Tools'],
  ARRAY['Experiment', 'Mistake', 'Fix', 'Progress'],
  ARRAY[]::text[],
  ARRAY['Workspace', 'Studio', 'Home'],
  ARRAY['Equipment', 'Laptop', 'Phone', 'Coffee'],
  ARRAY['Casual', 'Work Outfit', 'Comfortable']),

('Building Journey', 'Progress Arc', 'Problem Solving',
  ARRAY['Goal', 'Obstacle'],
  ARRAY['Research', 'Attempt', 'Breakthrough'],
  ARRAY['Reflection'],
  ARRAY['Workspace', 'Cafe', 'Home'],
  ARRAY['Laptop', 'Whiteboard', 'Notebook', 'Coffee'],
  ARRAY['Comfortable', 'Casual']),

('Building Journey', 'Builder', 'Cafe Workday',
  ARRAY['Getting Ready', 'Travel', 'Cafe Arrival'],
  ARRAY['Work Session', 'Progress'],
  ARRAY['Night Reflection'],
  ARRAY['Home', 'Street', 'Cafe'],
  ARRAY['Laptop', 'Coffee', 'Notebook', 'Phone', 'Bag'],
  ARRAY['Smart Casual', 'Casual']),

('Building Journey', 'Progress Arc', 'Sprint Day',
  ARRAY['Morning Goal', 'Execution'],
  ARRAY['Checkpoint', 'Adjustment', 'Win'],
  ARRAY['Reflection'],
  ARRAY['Workspace', 'Home'],
  ARRAY['Laptop', 'Timer', 'Coffee', 'Notebook'],
  ARRAY['Casual', 'Comfortable']);

-- ── Seed: PMF Discovery blueprints ───────────────────────────────────────────
insert into narrative_blueprints (primary_pillar, narrative_stack, blueprint_name, life_moments, work_moments, reflection_moments, recommended_locations, recommended_props, recommended_wardrobe) values

('PMF Discovery', 'Problem Discovery', 'Problem Hunt',
  ARRAY['Question', 'Research Start'],
  ARRAY['Research', 'Conversation', 'Discovery', 'Pattern'],
  ARRAY['Conclusion'],
  ARRAY['Home', 'Cafe', 'Client Location'],
  ARRAY['Notebook', 'Phone', 'Laptop', 'Coffee'],
  ARRAY['Smart Casual', 'Casual']),

('PMF Discovery', 'Market Gap', 'Industry Deep Dive',
  ARRAY['Topic Selection', 'Research'],
  ARRAY['Observation', 'Framework', 'Insight'],
  ARRAY['Reflection'],
  ARRAY['Home', 'Cafe', 'Library'],
  ARRAY['Laptop', 'Books', 'Notebook', 'Coffee'],
  ARRAY['Casual', 'Comfortable']),

('PMF Discovery', 'Validation Trail', 'Assumption Test',
  ARRAY['Assumption Framing'],
  ARRAY['Conversation', 'Evidence', 'Result', 'Learning'],
  ARRAY['Next Question'],
  ARRAY['Home', 'Cafe', 'Client Location'],
  ARRAY['Notebook', 'Phone', 'Laptop', 'Coffee'],
  ARRAY['Business Casual', 'Smart Casual']),

('PMF Discovery', 'Need Discovery', 'Segment Exploration',
  ARRAY['Target Segment Research'],
  ARRAY['Observation', 'Discovery', 'Opportunity'],
  ARRAY['Reflection'],
  ARRAY['Target Market', 'Street', 'Cafe'],
  ARRAY['Camera', 'Notebook', 'Phone'],
  ARRAY['Smart Casual', 'Casual']),

('PMF Discovery', 'Market Gap', 'Market Gap',
  ARRAY['Question', 'Competitor Review'],
  ARRAY['Gap Analysis', 'Hypothesis', 'Insight'],
  ARRAY['Conclusion'],
  ARRAY['Home', 'Cafe'],
  ARRAY['Laptop', 'Notebook', 'Coffee', 'Phone'],
  ARRAY['Casual', 'Smart Casual']);

-- ── Seed: Founder Insight blueprints ─────────────────────────────────────────
insert into narrative_blueprints (primary_pillar, narrative_stack, blueprint_name, life_moments, work_moments, reflection_moments, recommended_locations, recommended_props, recommended_wardrobe) values

('Founder Insight', 'Realization', 'Realization',
  ARRAY['Event', 'Thought'],
  ARRAY['Realization', 'Framework', 'Application'],
  ARRAY['Reflection'],
  ARRAY['Home', 'Cafe', 'Street'],
  ARRAY['Journal', 'Coffee', 'Phone', 'Pen'],
  ARRAY['Casual', 'Comfortable']),

('Founder Insight', 'Contrarian View', 'Contrarian Take',
  ARRAY['Common Belief', 'Observation'],
  ARRAY['Disagreement', 'Reasoning', 'Conclusion'],
  ARRAY[]::text[],
  ARRAY['Home', 'Cafe', 'Workspace'],
  ARRAY['Laptop', 'Coffee', 'Journal', 'Pen'],
  ARRAY['Smart Casual', 'Casual']),

('Founder Insight', 'Mental Model', 'Mental Model',
  ARRAY['Situation', 'Pattern Recognition'],
  ARRAY['Framework Development', 'Application', 'Lesson'],
  ARRAY[]::text[],
  ARRAY['Home', 'Workspace'],
  ARRAY['Whiteboard', 'Markers', 'Notebook', 'Coffee'],
  ARRAY['Casual', 'Comfortable']),

('Founder Insight', 'Realization', 'Hard Lesson',
  ARRAY['Mistake', 'Impact Realization'],
  ARRAY['Reflection', 'Adjustment'],
  ARRAY['Future Action'],
  ARRAY['Home', 'Workspace'],
  ARRAY['Journal', 'Coffee', 'Laptop'],
  ARRAY['Casual', 'Comfortable']);

-- ── Seed: Market Evidence blueprints ─────────────────────────────────────────
insert into narrative_blueprints (primary_pillar, narrative_stack, blueprint_name, life_moments, work_moments, reflection_moments, recommended_locations, recommended_props, recommended_wardrobe) values

('Market Evidence', 'Signal Collection', 'Signal Collection',
  ARRAY['Observation Start'],
  ARRAY['Evidence Gathering', 'Pattern Recognition', 'Interpretation'],
  ARRAY['Conclusion'],
  ARRAY['Market Location', 'Street', 'Cafe', 'Business District'],
  ARRAY['Camera', 'Notebook', 'Phone'],
  ARRAY['Smart Casual', 'Business Casual']),

('Market Evidence', 'Validation', 'Validation Review',
  ARRAY['Assumption Review'],
  ARRAY['Evidence Check', 'Validation', 'Learning'],
  ARRAY['Decision'],
  ARRAY['Home', 'Cafe', 'Workspace'],
  ARRAY['Laptop', 'Notebook', 'Coffee'],
  ARRAY['Smart Casual', 'Casual']),

('Market Evidence', 'Pattern Analysis', 'Market Pattern',
  ARRAY['Initial Observation'],
  ARRAY['Pattern Collection', 'Analysis', 'Insight'],
  ARRAY['Implication'],
  ARRAY['Home', 'Market Location', 'Cafe'],
  ARRAY['Camera', 'Notebook', 'Laptop', 'Coffee'],
  ARRAY['Smart Casual', 'Casual']);

-- ── Seed: Industry Observation blueprints ────────────────────────────────────
insert into narrative_blueprints (primary_pillar, narrative_stack, blueprint_name, life_moments, work_moments, reflection_moments, recommended_locations, recommended_props, recommended_wardrobe) values

('Industry Observation', 'Trend Watch', 'Trend Watch',
  ARRAY['Industry Event', 'Initial Observation'],
  ARRAY['Pattern Identification', 'Insight'],
  ARRAY['Question'],
  ARRAY['Event Location', 'Street', 'Cafe', 'Business District'],
  ARRAY['Camera', 'Notebook', 'Phone'],
  ARRAY['Business Casual', 'Smart Casual']),

('Industry Observation', 'Observation', 'Competitor Analysis',
  ARRAY['Target Selection', 'Observation Visit'],
  ARRAY['Difference Analysis', 'Learning'],
  ARRAY['Application'],
  ARRAY['Competitor Location', 'Home', 'Cafe', 'Street'],
  ARRAY['Camera', 'Phone', 'Notebook', 'Coffee'],
  ARRAY['Smart Casual', 'Casual']),

('Industry Observation', 'Field Notes', 'Field Notes',
  ARRAY['Visit', 'Initial Observation'],
  ARRAY['Interesting Detail', 'Insight Documentation'],
  ARRAY['Reflection'],
  ARRAY['Target Market', 'Street', 'Business District'],
  ARRAY['Camera', 'Notebook', 'Phone'],
  ARRAY['Smart Casual', 'Casual']);

-- ── Seed: Concept Building blueprints ────────────────────────────────────────
insert into narrative_blueprints (primary_pillar, narrative_stack, blueprint_name, life_moments, work_moments, reflection_moments, recommended_locations, recommended_props, recommended_wardrobe) values

('Concept Building', 'Hypothesis', 'Concept Feature',
  ARRAY['Problem Identification', 'Idea Formation'],
  ARRAY['Storyboard', 'Experiment'],
  ARRAY['Reflection'],
  ARRAY['Workspace', 'Home Studio', 'Cafe'],
  ARRAY['Laptop', 'Whiteboard', 'Markers', 'Phone'],
  ARRAY['Smart Casual', 'Casual']),

('Concept Building', 'Iteration', 'Creative Exploration',
  ARRAY['Inspiration', 'Concept Sketching'],
  ARRAY['Draft Creation', 'Iteration', 'Improvement'],
  ARRAY[]::text[],
  ARRAY['Home', 'Cafe', 'Gallery', 'Studio'],
  ARRAY['Sketchbook', 'Laptop', 'Pen', 'Coffee'],
  ARRAY['Casual', 'Creative', 'Comfortable']),

('Concept Building', 'Testing', 'Testing Day',
  ARRAY['Hypothesis Setup', 'Build Preparation'],
  ARRAY['Build', 'Test', 'Result Documentation'],
  ARRAY['Next Step'],
  ARRAY['Workspace', 'Client Location', 'Studio'],
  ARRAY['Laptop', 'Equipment', 'Notebook', 'Phone', 'Camera'],
  ARRAY['Smart Casual', 'Casual']);
