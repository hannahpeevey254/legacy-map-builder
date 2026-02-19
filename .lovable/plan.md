
# Brutally Honest Implementation Plan — Safe Hands vs. Spec v3

## What's Actually Built vs. What the Spec Requires

This is an unfiltered gap analysis. The current codebase is at the very beginning of Phase 2. Here is exactly where things stand.

---

## What IS Working (Phase 1 — Complete)

- Landing page with all locked sections: Hero, Quiet Questions, Reflection Engine, How It Works, Privacy, Footer
- Design system is correctly implemented: Forest Green, Dark Plum, Cream, Warm Sage, Muted Gold palette applied consistently
- Waitlist email capture is functional (Supabase)
- Auth system: Sign up, login, forgot password, reset password — all working
- NavBar is session-aware (logged in vs. logged out states)
- Super Admin role infrastructure: `user_roles` table, `has_role()` function, RLS policies, badge on dashboard

---

## What's MISSING — Brutally Honest Gap List

### Phase 2 — MVP Curation Dashboard

The dashboard exists but is a skeleton. Here is what the spec requires vs. what is built:

**Asset Management — Partially Built**
- What exists: Manual text-based asset entry (name + type + notes + assign to contact). Correct asset taxonomy (Photos, Voice Notes, Messages, Journals, Creative Work, Accounts).
- What's missing from spec:
  - No file upload of any kind. The spec requires drag-and-drop for PDF, DOCX, images, audio, video — nothing in the DB or UI for this.
  - No Supabase Storage bucket configured at all.
  - No folder/collection organisation ("For Maya", "Delete Upon Death" named collections).
  - No intent actions on assignments. The `relational_assignments` table has an `intent_action` column (Preserve, Transfer, Delete) but no UI exposes this — every assignment is blank.
  - No batch operations on assets.

**Trusted Contacts — Partially Built**
- What exists: Add contacts with name, email, relationship. Delete contacts.
- What's missing:
  - No Executor designation. The spec requires a Digital Executor role with a 7–30 day Security Wait Period. The `profiles` table (with `wait_period_days`) doesn't exist in the DB yet.
  - No ability to edit a contact after creation.
  - No contact detail view.

**Dashboard UX — Underdeveloped**
- Two-column card layout is functional but sparse. The spec implies a richer UI: progress indicators, completeness score, Reflection Engine prompts surfacing inside the dashboard.
- No empty-state onboarding flow — a new user lands on a blank dashboard with no guidance.
- No Reflection Engine AI prompts inside the dashboard (spec explicitly describes this for unlabelled items).

**Senior Onboarding Flow — Not Started**
- The spec defines a dedicated `/onboarding/senior` route with linear, one-task-per-screen progression and Executor + Wait Period setup. This does not exist.

**`profiles` Table — Missing**
- The spec lists `profiles` as a core schema table (stores user settings and `wait_period_days`). It does not exist in the database.

**`integration_connections` Table — Missing**
- Required by spec for Phase 2/3. Stores OAuth tokens, connection status, sync metadata. Does not exist.

---

### Phase 3 — AI, Automation & Deep Integrations (Not Started)

Nothing from Phase 3 is built. This is expected, but it's a large scope:

- Google Drive OAuth (read-only, drive.readonly scope)
- Dropbox OAuth (v2 API)
- WhatsApp guided export-and-upload parser (.zip)
- iMessage guided export parser (.db file)
- Meta Data Download Tool guided upload parser
- Twitter/X archive ingestion
- LinkedIn export ingestion
- Password vault (AES-256 encrypted, executor time-lock)
- Password manager CSV import (1Password, LastPass, Bitwarden)
- In-app voice recorder (Browser MediaRecorder API)
- Rich text journal editor
- AI Reflection Engine prompts on uncatalogued data
- Automated inactivity trigger (Dead Man's Switch)
- Automated asset categorisation suggestions

### Phase 4 — Governance (Not Started)

- Full Dead Man's Switch trigger system
- Advanced executor controls and permissions
- Native iOS/Android app (MediaLibrary API for camera roll)
- CloudKit / iCloud Drive integration

---

## Prioritised Build Plan — What to Build Next

### IMMEDIATE — Complete Phase 2 (in build order)

**Step 1 — Add Intent Actions to Relational Assignments**
The column already exists in the DB (`intent_action`). The UI just needs to expose it. In `AddAssetModal`, when assigning a contact, add a selection per contact: Preserve / Transfer / Delete. This is one modal change and zero DB migrations needed.
- Files: `src/pages/Dashboard.tsx`

**Step 2 — File Upload Infrastructure**
- Create a Supabase Storage bucket called `assets` (private, RLS: `auth.uid() = owner`).
- Add a `file_path` column to `digital_assets` table.
- Add a file upload input to `AddAssetModal` with drag-and-drop. Accepts PDF, DOCX, images, audio, video.
- After upload, store the file path in `digital_assets.file_path`.
- Files: `src/pages/Dashboard.tsx`, 1 new DB migration

**Step 3 — Create the `profiles` Table**
Required by spec for executor setup and wait periods.
- Schema: `id uuid (FK auth.users)`, `wait_period_days integer default 7`, `executor_contact_id uuid (FK trusted_contacts)`, `created_at`, `updated_at`
- RLS: users can only read/write their own profile
- Files: 1 new DB migration, `src/integrations/supabase/types.ts`

**Step 4 — Executor Designation UI**
Add an "Executor" section to the dashboard where the user can designate one trusted contact as their Digital Executor and set the wait period (7–30 day slider).
- Files: `src/pages/Dashboard.tsx`

**Step 5 — Named Collections / Folders**
Allow users to create named groups (e.g., "For Maya", "Delete Upon Death") and drag assets into them.
- Requires a new `collections` table: `id`, `user_id`, `name`, `created_at`
- And a `collection_id` FK on `digital_assets`
- Files: 1 new DB migration, `src/pages/Dashboard.tsx`

**Step 6 — Senior Onboarding Flow**
Create `/onboarding/senior` as a multi-step wizard:
- Step 1: Warm welcome in plain language ("Let's set up your Safe Vault")
- Step 2: Add a Digital Executor (name + email)
- Step 3: Set Security Wait Period (slider: 7–30 days)
- Step 4: Add your first digital asset (simplified — just name and who gets it)
- Step 5: Confirmation screen
- Language: conversational, no jargon, "Safe Vault" not "encryption"
- Files: `src/pages/SeniorOnboarding.tsx` (new), `src/App.tsx`

**Step 7 — Reflection Engine Dashboard Prompts**
Surface 1–3 contextual prompts inside the dashboard for assets that have no contact assigned or no intent action set. Example: "You have 3 unlabelled voice notes. Who should hear them?" Styled as the dark card UI shown in the landing page mock.
- Files: `src/pages/Dashboard.tsx`

**Step 8 — Empty-State Onboarding**
If a user has 0 assets and 0 contacts, show a guided empty state instead of blank cards: "Start by adding someone you trust" → opens Add Contact modal. Three-step onboarding strip below the stats bar.
- Files: `src/pages/Dashboard.tsx`

---

### PHASE 3 PREPARATION — What Needs Architecture Decisions Now

**File parsing infrastructure**
WhatsApp .zip, iMessage .db, and social media archive parsing cannot run in the browser. This requires an Edge Function for server-side parsing. Plan: Supabase Edge Function (`parse-export`) that accepts an uploaded file, parses it, and returns structured thread data. This is the most complex engineering task in the entire spec.

**OAuth integration flow**
Google Drive and Dropbox OAuth requires a redirect URI registered in their developer consoles. The `integration_connections` table needs to be created now so Phase 3 doesn't require a schema migration mid-build. Suggested schema: `id`, `user_id`, `provider` (google_drive | dropbox | icloud), `access_token_encrypted`, `refresh_token_encrypted`, `scopes`, `connected_at`, `expires_at`, `status`.

**AES-256 vault for passwords**
Client-side encryption before sending to DB. The spec says tokens are "encrypted at rest, never exposed client-side." This requires a Web Crypto API implementation or a Supabase Vault integration. Architecture decision needed before building.

**AI Reflection Engine**
Not defined in the spec as to which AI provider. Needs an API key (OpenAI or similar) and an Edge Function to handle prompts. The prompts shown in the live mock ("unlabelled voice notes", "unassigned photos", "unsent drafts") suggest a categorisation + gap-detection approach, not generative content.

---

## Current Database vs. Spec Schema — Gap Table

| Table | Status | Missing |
|---|---|---|
| `digital_assets` | Exists | `file_path` column, `collection_id` FK |
| `trusted_contacts` | Exists | Nothing critical |
| `relational_assignments` | Exists | `intent_action` is in DB but not exposed in UI |
| `profiles` | Missing | Entire table |
| `integration_connections` | Missing | Entire table |
| `collections` | Missing | Entire table |
| `user_roles` | Exists | Complete |

---

## Honest Priority Order for Next Build Sessions

1. Intent actions in assignment UI (30 min, no DB change)
2. `profiles` table + executor designation UI (1 session)
3. File upload with Supabase Storage (1 session)
4. Named collections/folders (1 session)
5. Senior onboarding flow at `/onboarding/senior` (1 session)
6. Dashboard Reflection Engine prompts (1 session)
7. `integration_connections` table creation (schema-only, sets up Phase 3)
8. Phase 3 guided export flows: WhatsApp, iMessage (2–3 sessions, requires Edge Functions)
9. Google Drive / Dropbox OAuth (2 sessions, requires external app registration)
10. AI Reflection Engine Edge Function (1–2 sessions, requires AI provider decision)
