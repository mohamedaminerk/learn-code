-- Run this once in your Supabase project's SQL Editor
-- (left sidebar -> SQL Editor -> New query -> paste -> Run).

create table if not exists progress (
  user_id uuid references auth.users not null,
  exercise_id text not null,
  completed boolean default true,
  completed_at timestamptz default now(),
  primary key (user_id, exercise_id)
);

-- Row Level Security: everyone can only ever see or change
-- their own rows, never anyone else's.
alter table progress enable row level security;

create policy "Users can view their own progress"
  on progress for select
  using (auth.uid() = user_id);

create policy "Users can insert their own progress"
  on progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own progress"
  on progress for update
  using (auth.uid() = user_id);
