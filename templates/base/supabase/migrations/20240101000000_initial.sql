create table if not exists public.users (
  id serial primary key,
  clerk_id text not null unique,
  email text unique,
  name text,
  avatar_url text,
  created_at timestamptz not null default now()
);
