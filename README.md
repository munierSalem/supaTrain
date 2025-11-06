This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



## Activity Table
```
create table public.activities (
  activity_id bigint primary key,              -- Strava (or other source) activity ID
  user_id uuid not null references auth.users(id),
  source text not null default 'strava',

  resource_state int,
  athlete jsonb,
  name text,
  distance double precision,
  moving_time int,
  elapsed_time int,
  total_elevation_gain double precision,
  type text,
  sport_type text,
  workout_type double precision,
  device_name text,
  start_date timestamptz,
  start_date_local timestamptz,
  timezone text,
  utc_offset double precision,
  location_city text,
  location_state text,
  location_country text,
  achievement_count int,
  kudos_count int,
  comment_count int,
  athlete_count int,
  photo_count int,
  map jsonb,
  trainer bool,
  commute bool,
  manual bool,
  private bool,
  visibility text,
  flagged bool,
  gear_id text,
  start_latlng jsonb,
  end_latlng jsonb,
  average_speed double precision,
  max_speed double precision,
  has_heartrate bool,
  average_heartrate double precision,
  max_heartrate double precision,
  heartrate_opt_out bool,
  display_hide_heartrate_option bool,
  elev_high double precision,
  elev_low double precision,
  upload_id bigint,
  upload_id_str text,
  external_id text,
  from_accepted_tag bool,
  pr_count int,
  total_photo_count int,
  has_kudoed bool,
  average_cadence double precision,
  average_watts double precision,
  max_watts double precision,
  weighted_average_watts double precision,
  device_watts text,
  kilojoules double precision,

  created_at timestamptz default now()
);

-- Optional composite index for lookups
create index idx_activities_user_source on public.activities (user_id, source);

-- Enable Row Level Security
alter table public.activities enable row level security;

-- RLS: users can see only their own data
create policy "users can view own activities"
on public.activities for select
using (auth.uid() = user_id);

-- RLS: users can insert only their own data
create policy "users can insert own activities"
on public.activities for insert
with check (auth.uid() = user_id);
```


### Connections Table

```
create table user_connections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  provider text not null check (provider in ('strava')),
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  athlete_id bigint not null,
  scope text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_connections enable row level security;

create policy "Users can manage their own connections"
  on user_connections
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```


## Weekly View

```
-- Weekly totals per user (Mon–Sun, UTC-based)
create or replace view weekly_aggregates
with (security_invoker = true) as
select
  user_id,
  (date_trunc('week', start_date) + interval '1 day')::date              as week_start,     -- Monday (UTC)
  (date_trunc('week', start_date) + interval '7 day')::date as week_end,  -- Sunday (UTC)
  to_char(date_trunc('week', start_date), 'IYYY-"W"IW')      as iso_week, -- e.g. 2025-W45
  count(*)                                          as activities,
  coalesce(sum(distance), 0)::bigint               as distance,
  coalesce(sum(moving_time), 0)::bigint            as moving_time,
  coalesce(sum(elapsed_time),0)::bigint            as elapsed_time,
  coalesce(sum(total_elevation_gain), 0)::bigint   as total_elevation_gain,

  -- time-weighted average HR across activities
  case
    when sum(elapsed_time) > 0 then
      round(
        sum(coalesce(average_heartrate,0) * coalesce(elapsed_time,0))::numeric
        / nullif(sum(elapsed_time), 0),
        1
      )
    else null
  end as average_heartrate,

  -- max HR across activities
  max(nullif(max_heartrate,0)) as max_heartrate

from activities
group by user_id, date_trunc('week', start_date)
order by user_id, week_start desc;

```