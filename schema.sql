-- PersonaLens Database Schema Setup
-- Run these statements in your Supabase SQL Editor

-- 1. Create users profile table (referenced by auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;
create policy "Users can view their own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert their own profile" on public.users for insert with check (auth.uid() = id);

-- 2. Create questions bank table
create table public.questions (
  id integer primary key,
  section text not null,
  question text not null,
  type text not null, -- Forced Choice, Open Ended, Ranking, Likert
  options jsonb not null default '[]'::jsonb,
  traits jsonb not null default '[]'::jsonb,
  weight double precision not null default 1.0
);

-- Enable RLS for questions (anyone can read, none can write via client)
alter table public.questions enable row level security;
create policy "Questions are readable by authenticated users" on public.questions for select using (true);
create policy "Questions are readable by anonymous users" on public.questions for select using (true);

-- 3. Create assessments session table
create table public.assessments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  confidence_score double precision default 0.0 not null
);

-- Enable RLS for assessments
alter table public.assessments enable row level security;
create policy "Users can view their own assessments" on public.assessments for select using (auth.uid() = user_id);
create policy "Users can insert their own assessments" on public.assessments for insert with check (auth.uid() = user_id);
create policy "Users can update their own assessments" on public.assessments for update using (auth.uid() = user_id);

-- 4. Create responses logger table
create table public.responses (
  id uuid default gen_random_uuid() primary key,
  assessment_id uuid references public.assessments(id) on delete cascade not null,
  question_id integer references public.questions(id) not null,
  answer jsonb not null,
  response_time_ms integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for responses
alter table public.responses enable row level security;
create policy "Users can view responses for their assessments" on public.responses for select using (
  exists (
    select 1 from public.assessments
    where assessments.id = responses.assessment_id
    and assessments.user_id = auth.uid()
  )
);
create policy "Users can insert responses for their assessments" on public.responses for insert with check (
  exists (
    select 1 from public.assessments
    where assessments.id = responses.assessment_id
    and assessments.user_id = auth.uid()
  )
);

-- 5. Create final reports storage table
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  assessment_id uuid references public.assessments(id) on delete cascade not null,
  report_json jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for reports
alter table public.reports enable row level security;
create policy "Users can view reports for their assessments" on public.reports for select using (
  exists (
    select 1 from public.assessments
    where assessments.id = reports.assessment_id
    and assessments.user_id = auth.uid()
  )
);
create policy "Users can insert reports for their assessments" on public.reports for insert with check (
  exists (
    select 1 from public.assessments
    where assessments.id = reports.assessment_id
    and assessments.user_id = auth.uid()
  )
);
