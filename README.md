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


## Config

Installed Packages:

```
npm install react-hook-form zod @hookform/resolvers
npm i luxon
npm install d3
```


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


alter table activities
  alter column source set default 'manual',
  alter column created_at set default now();

create policy "Users can manage own activities"
  on activities
  for all
  using (auth.uid() = user_id)
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
with base as (
  select
    *,
    sport_type in ('AlpineSki') as is_powered
  from activities
)
select
  user_id,
  (date_trunc('week', start_date) + interval '1 day')::date as week_start,      -- Monday (UTC)
  (date_trunc('week', start_date) + interval '7 day')::date as week_end,        -- Sunday (UTC)
  to_char(date_trunc('week', start_date), 'IYYY-"W"IW') as iso_week,            -- e.g. 2025-W45
  count(*) as activities,
  coalesce(sum(distance) filter (where not is_powered), 0)::bigint as distance,
  coalesce(sum(moving_time), 0)::bigint as moving_time,
  coalesce(sum(elapsed_time), 0)::bigint as elapsed_time,
  coalesce(sum(total_elevation_gain) filter (where not is_powered), 0)::bigint as total_elevation_gain,
  -- time-weighted average HR across activities, excluding missing or zero HR
  case
    when
      coalesce(
        sum(elapsed_time) filter (where average_heartrate is not null and average_heartrate > 0),
        0
      ) > 0
    then round(
      (
        sum(average_heartrate * elapsed_time)
          filter (where average_heartrate is not null and average_heartrate > 0)
      )::numeric
      /
      nullif(
        sum(elapsed_time)
          filter (where average_heartrate is not null and average_heartrate > 0),
        0
      ),
      1
    )
    else null
  end as average_heartrate,

  -- max HR across activities
  max(nullif(max_heartrate, 0)) as max_heartrate

from base
group by user_id, date_trunc('week', start_date)
order by user_id, week_start desc;


```

## Missing Strava GPX View

```
-- Create or replace the view
create or replace view public.missing_streams
with (security_invoker = true) as
select
  a.activity_id,
  a.user_id,
  a.source
from public.activities a
left join public.activity_data d
  on a.activity_id = d.activity_id
where d.activity_id is null
  and a.source = 'strava'
  and a.sport_type in (
    'Run', 'Ride', 'Hike', 'Walk', 'AlpineSki', 'BackcountrySki', 'NordicSki'
  )
```

## Activity Data

Tracks if activity GPX has been downloaded and will, eventually, also include columns for derived metrics on activities

```
-- 1) Table
create table if not exists public.activity_data (
  activity_id        bigint primary key
                     references public.activities(activity_id) on delete cascade,
  user_id            uuid not null
                     references auth.users(id) on delete cascade,
  source             text not null,   -- e.g. 'strava', 'garmin'
  stream_path           text not null,   -- local or S3/Supabase Storage path
  stream_downloaded_at  timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  checksum_sha256    text
    constraint activity_data_checksum_hex_chk
    check (
      checksum_sha256 is null
      or checksum_sha256 ~ '^[0-9a-f]{64}$'
    ),

  constraint activity_data_source_chk
  check (length(source) between 1 and 64)
);

comment on table public.activity_data is
'Per-activity file pointer + bookkeeping for Strava stream downloads (1:1 with activities).';

comment on column public.activity_data.stream_path is
'Filesystem path or object-storage URL to the Strava stream JSON file.';

comment on column public.activity_data.checksum_sha256 is
'SHA-256 (hex) of stream JSON file contents; set by app when saving file.';

-- Helpful index for frequent lookups
create index if not exists activity_data_user_id_idx
  on public.activity_data (user_id);

create index if not exists activity_data_stream_downloaded_at_idx
  on public.activity_data (stream_downloaded_at desc);

-- Ensure data integrity: each row’s user_id must match the parent activity’s user_id
create or replace function public.enforce_activity_user_match()
returns trigger language plpgsql as $$
declare
  expected_user uuid;
begin
  select a.user_id into expected_user
  from public.activities a
  where a.activity_id = new.activity_id;

  if expected_user is null then
    raise exception 'Activity % does not exist', new.activity_id;
  end if;

  if new.user_id != expected_user then
    raise exception 'activity_data.user_id must match activities.user_id';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_activity_user_match on public.activity_data;
create trigger trg_activity_user_match
before insert or update on public.activity_data
for each row execute function public.enforce_activity_user_match();

-- Auto-bump updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_activity_data_touch on public.activity_data;
create trigger trg_activity_data_touch
before update on public.activity_data
for each row execute function public.touch_updated_at();

-- 2) Row Level Security (RLS)
alter table public.activity_data enable row level security;

drop policy if exists activity_data_select on public.activity_data;
create policy activity_data_select
on public.activity_data
for select
using (user_id = auth.uid());

drop policy if exists activity_data_insert on public.activity_data;
create policy activity_data_insert
on public.activity_data
for insert
with check (user_id = auth.uid());

drop policy if exists activity_data_update on public.activity_data;
create policy activity_data_update
on public.activity_data
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists activity_data_delete on public.activity_data;
create policy activity_data_delete
on public.activity_data
for delete
using (user_id = auth.uid());
```


## 🛡️ Security Hardening Checklist

This checklist summarizes how to keep the Supabase + Next.js + Strava integration secure.  
It’s organized by **time horizon** — what should be done immediately, soon, and long term.

---

### ✅ Immediate (Do Now)

- [X] **Rotate the Supabase service-role key** if it was ever exposed (pasted in terminals, logs, or committed).
  - This key bypasses RLS and has full DB privileges.
- [ ] **Verify RLS (Row-Level Security).**
  - Log in as two test users (A & B). Ensure A cannot read B’s `activities`, `user_connections`, or profile rows.
- [X] **Keep Strava tokens server-only.**
  - Never send `access_token`/`refresh_token` to the browser; never store them in `NEXT_PUBLIC_*`.
- [ ] **Harden session cookies.**
  - `HttpOnly`, `Secure`, `SameSite=Strict`, short lifetimes.
- [ ] **Limit Strava OAuth scopes** to the minimum (e.g., `read`, `activity:read_all` only if required).
- [ ] **Audit views and functions** to ensure they respect RLS.
  - Use `CREATE VIEW ... WITH (security_invoker = true)` where appropriate.
- [X] **Check environment variables.**
  - Secrets only in server env; nothing sensitive in `NEXT_PUBLIC_*`.
- [X] **.env files are git-ignored** and not printed to logs.

---

### ⏳ Short Term (1–2 Weeks)

- [ ] **Encrypt sensitive columns** (e.g., Strava `refresh_token`) using `pgcrypto` or a server function.
- [ ] **Add CI tests for RLS** (anon client + different user should see 0 rows).
- [ ] **Monitor & alert** on queries run with the service role (unusually large reads/exports).
- [ ] **Review backups & logs** to confirm encryption and restricted access.
- [ ] **Restrict Supabase console access** (least privilege; MFA enabled).
- [ ] **Sanitize all user input** and avoid rendering unsanitized HTML.
- [ ] **Rate-limit** endpoints that read/write activities.

---

### 🧭 Medium Term (1–3 Months)

- [ ] **Token hygiene & rotation.**
  - Prefer using refresh tokens server-side; rotate on schedule or suspicious use.
- [ ] **Audit trails** on sensitive tables (`user_connections`, `activities`).
  - Store `inserted_by`, timestamps, optional request metadata.
- [ ] **Secret management** via your host’s secret manager (Vercel/Netlify/AWS/GCP).
- [ ] **Automated security tests** (Playwright/Cypress/Jest) for:
  - Unauthenticated access blocked
  - Cross-user reads blocked by RLS
- [ ] **Content-Security Policy (CSP)** to mitigate XSS and cookie theft.

---

### 🧱 Long Term (3+ Months)

- [ ] **Column-level encryption or token vaulting** (KMS-backed).
- [ ] **Field-level redaction** for highly sensitive data (e.g., raw GPS coordinates).
- [ ] **Regular key rotation** (service role, Strava client secret) on a cadence.
- [ ] **Least-privilege DB roles** (separate read-only/admin paths).
- [ ] **External pen-test or security review** before/after public launch.
- [ ] **Anomaly detection & alerts** (unexpected IPs, bursts of failures, unusual query volume).

---

### 🔎 Quick Sanity Checks

- [ ] `grep -R "SERVICE_ROLE" .` → appears **only** in server code.
- [ ] Cross-user read from the browser returns 0 rows.
- [ ] Cookies are `HttpOnly` and `Secure`.
- [ ] `.env*` files are not committed; CI logs don’t echo secrets.
- [ ] Backups exist, are encrypted, and are access-controlled.
