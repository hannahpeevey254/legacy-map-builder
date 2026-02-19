
## Upgrade the Curation Dashboard with Relational Assignments

### What's Being Built

The current Dashboard already handles Digital Assets and Trusted Contacts separately. This upgrade replaces the "coming soon" Assignments placeholder with a fully functional **Add Asset + Assign flow** — a single modal where you create an asset and immediately assign it to one or more trusted contacts in one action. The dashboard will also display existing assignments inline on each asset card.

---

### How It Works — The User Flow

```text
User clicks "Add Asset"
        ↓
Modal opens:
  Step 1 — Fill asset title, type, description
  Step 2 — "Assign to" — dropdown of existing trusted contacts
             (multi-select: can assign to multiple people at once)
        ↓
Click "Save & Assign"
        ↓
App inserts into digital_assets  →  gets back new asset ID
App inserts into relational_assignments (one row per contact selected)
        ↓
Dashboard refreshes:
  Assets list shows asset + "Assigned to: Sarah, Tom" chips
  Stats bar "Assignments" counter updates with real count
```

---

### Technical Details

**Changes only to `src/pages/Dashboard.tsx`** — no new files needed:

1. **New type: `RelationalAssignment`**
   ```ts
   interface RelationalAssignment {
     id: string;
     asset_id: string;
     contact_id: string;
   }
   ```

2. **Fetch assignments** alongside assets and contacts on load using a Supabase `.select("*")` on `relational_assignments`.

3. **Upgrade `AddAssetModal`**:
   - Accept `contacts: TrustedContact[]` as a prop so it can display the contact list
   - Add a multi-select contact picker section below the description field — rendered as toggleable pills (same design language as the asset type pills)
   - On submit: first `insert` into `digital_assets`, get the new asset's `id` from the response, then bulk-`insert` into `relational_assignments` for each selected contact
   - If no contacts exist yet, show a soft inline note: "Add a trusted contact first to assign this asset"

4. **Asset list cards** — each asset row gets a "Assigned to" line beneath it showing contact name chips, derived by cross-referencing `assignments` and `contacts` arrays in memory (no extra queries).

5. **Stats bar** — the "Assignments" stat changes from hardcoded `0` to `assignments.length` (real count from fetched data).

6. **Remove the "coming soon" card** at the bottom — it's replaced by the live assignment system.

---

### Data Flow

```text
State in Dashboard:
  assets[]          ← digital_assets table
  contacts[]        ← trusted_contacts table
  assignments[]     ← relational_assignments table

AddAssetModal receives:
  contacts[]        ← passed as prop

On save:
  1. INSERT digital_assets → returns { data[0].id }
  2. INSERT relational_assignments (asset_id, contact_id, user_id) × N

After save:
  fetchAssets() + fetchAssignments() called
  UI reflects new asset with its assigned contacts immediately
```

---

### Visual Design

Stays fully within the existing SafeHands design system:
- Contact picker pills use the same active/inactive style as the asset type picker
- "Assigned to" chips on asset cards use `AssetTypePill`-style treatment with a person icon
- Empty state if no contacts exist guides user to add contacts first

---

### Edge Cases Handled

- If no contacts exist when adding an asset: assignment section is hidden with a soft guide message — the asset still saves without assignments
- If a contact is deleted after assignment: the `on delete cascade` in the DB schema handles orphan cleanup automatically
- Duplicate assignments: the `unique (asset_id, contact_id)` constraint in the schema prevents duplicates at the DB level; the UI de-dupes by toggling
