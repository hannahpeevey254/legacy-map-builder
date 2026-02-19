
## Connect SafeHands to Your Supabase Project

### What Needs to Happen

Two secrets need to be securely stored in the project so the Supabase client can initialize:

| Secret Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://gyqdnpqhdodczzaadape.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | The JWT key you just provided |

The `src/lib/supabase.ts` file is already written correctly — it reads from `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`. Once the secrets are stored, the Supabase client will initialize and both waitlist forms (Hero + Footer) will go live.

---

### Waitlist Table SQL

Once the secrets are added, you'll need to run the following SQL in your Supabase dashboard (SQL Editor) to create the waitlist table:

```sql
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.waitlist enable row level security;

-- Allow anyone to insert (for public waitlist signups)
create policy "Allow public inserts"
  on public.waitlist
  for insert
  to anon
  with check (true);
```

Run this in your Supabase project at:
**Dashboard → SQL Editor → New Query → Paste → Run**

---

### Steps to Implement

1. Add `VITE_SUPABASE_URL` secret with your project URL
2. Add `VITE_SUPABASE_ANON_KEY` secret with the key you provided
3. No code changes needed — `src/lib/supabase.ts` already handles the initialization correctly
4. Provide you with the SQL above to run in your Supabase dashboard to create the `waitlist` table with Row Level Security enabled

After this, both the Hero and Footer email forms will be fully functional — emails will be saved, duplicates handled gracefully, and toast notifications will confirm each submission.
