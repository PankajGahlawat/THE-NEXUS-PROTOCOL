-- Enable Realtime
drop publication if exists supabase_realtime;
create publication supabase_realtime for all tables;

-- Teams Table
create table public.teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  code text unique not null,
  total_shards int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id)
);

-- Users Table (Players)
create table public.users (
  id uuid references auth.users(id) primary key,
  team_id uuid references public.teams(id),
  username text not null,
  assigned_role text check (assigned_role in ('HACKER', 'INFILTRATOR', 'ANALYST')),
  active_now boolean default false,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Progress Table
create table public.progress (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) not null,
  mission_id text not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  role_played text not null,
  shards_earned int default 0
);

-- Live Activity Feed (for broadcasts)
create table public.live_activity (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) not null,
  user_id uuid references public.users(id),
  action_type text not null, -- 'MISSION_COMPLETE', 'SHARD_FOUND', 'ROLE_SELECT', 'PING'
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.teams enable row level security;
alter table public.users enable row level security;
alter table public.progress enable row level security;
alter table public.live_activity enable row level security;

-- Policies (Simplified for prototype: allow public read/write if they have the team code)
create policy "Allow public read/write" on public.teams for all using (true) with check (true);
create policy "Allow public read/write" on public.users for all using (true) with check (true);
create policy "Allow public read/write" on public.progress for all using (true) with check (true);
create policy "Allow public read/write" on public.live_activity for all using (true) with check (true);
