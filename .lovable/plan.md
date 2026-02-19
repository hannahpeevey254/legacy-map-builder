
# The Intentionality Engine — "Set Your Intentions" — Full Implementation Plan

## What You Asked For

When a user clicks "Set your intentions" (Step 03 in the empty-state onboarding card), they should arrive at a fully-featured **Intentionality Engine** — a dedicated page or modal that handles:

1. Per-asset intent actions (4 options, not 3)
2. Social media platform-specific intentions
3. A "Master Digital Scrub" global toggle
4. All styled in glassmorphic dark cards matching the design system

---

## Current State — What Already Exists

- `relational_assignments.intent_action` column exists in the DB
- The **Add Asset Modal** already exposes 3 intent actions per contact: Preserve / Transfer / Delete
- The empty-state card has a Step 03 "Set your intentions" with no action (it renders no button currently)
- The `INTENT_ACTIONS` constant only has 3 values — the spec requires 4: **Preserve & Share**, **Archive**, **Delete Permanently**, **Donate**
- There is no Social Legacy checklist anywhere
- There is no "Master Digital Scrub" global toggle

---

## What Needs to Be Built

### Part 1 — Database Change
Add a new `social_intentions` table to store per-platform intentions. This is needed because social media intentions (Instagram, Facebook, LinkedIn, etc.) are not asset-specific — they are platform-level settings per user.

Schema:
- `id uuid`
- `user_id uuid`
- `platform text` (instagram, facebook, twitter, linkedin, discord, whatsapp, youtube, tiktok)
- `intention text` (memorialize, delete, archive, transfer, final_post_then_close, preserve_threads, wipe, preserve)
- `notes text` (optional — e.g. "Delete DMs but preserve photos")
- `created_at`, `updated_at`

### Part 2 — Expand Intent Actions (4 options)
Update `INTENT_ACTIONS` constant in Dashboard.tsx to include:
- **Keep & Share** (was "Preserve") — "Preserve the data and pass access to a specific person." Color: Warm Sage green
- **Archive Quietly** (was "Transfer") — "Store in a private vault. No one receives it unless specified." Color: Muted Gold
- **Clear My Path** (was "Delete") — "Erase permanently after the wait period. No trace." Color: Soft red
- **Donate to History** (new) — "Send to a public archive, museum, or institution." Color: Lavender/blue-tint

The DB `intent_action` column accepts free text so no migration is needed for this — just update the UI constants.

### Part 3 — New Intentionality Engine Page
Create `/intentions` as a new dedicated route, accessible via:
- Clicking "Set your intentions" in the empty-state Step 03 card
- A new "My Intentions" button in the dashboard header area

The page has three sections rendered as glassmorphic cards:

**Section A — Asset Intentions**
Lists all existing digital assets. For each asset, shows the current intent action (if any) and lets the user change it inline via the 4-action toggle. Saves directly to `relational_assignments` when changed. If an asset has no contact assigned yet, shows a soft warning: "Assign a contact first to activate this intention."

**Section B — Social Legacy Checklist**
8 platform cards (glassmorphic, matching the design language):

| Platform | Options |
|---|---|
| Instagram / Facebook | Memorialize (keep posts, lock account) · Delete permanently |
| X (Twitter) / Threads | Archive historical posts · Digital Scrub (delete all) |
| LinkedIn | Final post announcement → Account closure |
| Discord / WhatsApp | Preserve selected threads · Wipe account |
| YouTube / TikTok | Transfer creative IP to a named person · Delete channel |

Each card: platform icon (emoji or Lucide equivalent), platform name, 2 option buttons (conversational language), and an optional "Add a note" field (e.g. "Delete my DMs but keep my photos for Mum").

Data is saved to the new `social_intentions` table.

**Section C — Master Intent (The Digital Scrub)**
A large, clearly separated glassmorphic card with a warning tone. Contains:
- A toggle labeled **"Full Digital Scrub"** (off by default)
- Description: "If activated, Safe Hands will attempt to delete all connected accounts and cloud data — leaving behind only the specific assets you have manually marked as 'Keep & Share'."
- Conversational language. No alarming legal wording.
- When toggled ON: shows a soft confirmation step with the text "Are you certain? This instruction will activate after your Security Wait Period is exhausted. You can change your mind at any time."
- Stored in the `profiles` table as a new boolean column `master_scrub_enabled` (default `false`).

---

## File Changes Required

### Database Migrations (2)
1. Create `social_intentions` table with RLS (users can only manage their own rows)
2. Add `master_scrub_enabled boolean default false` column to `profiles` table

### New File: `src/pages/IntentionEngine.tsx`
A full-page dedicated intentions editor with all 3 sections above. Uses the existing design tokens (Forest Green, dark backgrounds, glassmorphic borders).

### Modified Files
- **`src/pages/Dashboard.tsx`**:
  - Update `INTENT_ACTIONS` constant to 4 options with new conversational labels
  - Make Step 03 "Set your intentions" in `EmptyStateOnboarding` link to `/intentions`
  - Add "My Intentions" shortcut link in the dashboard header or as a Reflection Engine CTA
  - Update `UserProfile` type to include `master_scrub_enabled`

- **`src/App.tsx`**:
  - Register `/intentions` as a new protected route

- **`src/integrations/supabase/types.ts`**:
  - Types auto-update after migrations (we cannot edit this file manually per guidelines)

---

## User Flow

```text
Dashboard → Empty state "Set your intentions" card (Step 03) 
         → /intentions page

/intentions page:
  ┌─────────────────────────────────┐
  │  Your Intentions                │
  │  "Tell Safe Hands what you      │
  │   want to happen to your        │
  │   digital world."               │
  ├─────────────────────────────────┤
  │  SECTION A: Your Assets         │
  │  (per-asset 4-action toggle)    │
  ├─────────────────────────────────┤
  │  SECTION B: Social Legacy       │
  │  (per-platform 2-option cards)  │
  ├─────────────────────────────────┤
  │  SECTION C: Master Intent       │
  │  (Full Digital Scrub toggle)    │
  └─────────────────────────────────┘
```

---

## Design Details

All cards follow the existing pattern:
- Background: `hsl(179 100% 6%)`
- Border: `hsl(149 28% 79% / 0.10)`
- Text: `hsl(149 28% 79%)`
- Glassmorphic backdrop-blur on the page header

The 4 intent action buttons use pill toggles (same as current Add Asset Modal), with colors:
- Keep & Share: `hsl(149 28% 79%)` — Warm Sage
- Archive Quietly: `hsl(45 60% 65%)` — Muted Gold
- Clear My Path: `hsl(0 55% 60%)` — Soft Red
- Donate to History: `hsl(220 40% 65%)` — Slate Blue

Social platform cards use a consistent 2-option pill layout with a third "Add a note" text field that expands on focus.

The Master Scrub section uses a subtle red border tint to signal its weight, without being alarming.

---

## Build Order

1. Run migration: add `social_intentions` table
2. Run migration: add `master_scrub_enabled` to `profiles`
3. Create `src/pages/IntentionEngine.tsx`
4. Register `/intentions` route in `src/App.tsx`
5. Update `INTENT_ACTIONS` in `Dashboard.tsx` (4 options, new labels)
6. Wire the Step 03 "Set your intentions" card to navigate to `/intentions`
7. Add a "My Intentions" link button on the dashboard
