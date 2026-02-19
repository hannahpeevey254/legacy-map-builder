
## Authentication — Full System Audit & Fix

### What's broken and what's being built

The auth scaffolding already exists (AuthPage, AuthContext, ProtectedRoute, /auth and /dashboard routes) but several wiring issues prevent it from working correctly end-to-end. This plan fixes all of them in one pass and adds the missing "Forgot Password" flow.

---

### The 5 Problems Being Fixed

**1. Supabase client split-brain**
- `AuthContext`, `AuthPage`, and `Dashboard` all import from `@/lib/supabase` — a conditional client that returns `null` if env vars aren't set.
- `@/integrations/supabase/client.ts` is the always-initialized client (hardcoded URL + key, which is correct for the anon key).
- Fix: All auth-related files will import from `@/integrations/supabase/client` so the session never fails silently.

**2. NavBar "Log In" is a dead link**
- Currently `<a href="#">Log In</a>` — goes nowhere.
- Fix: Replace with a `<Link to="/auth">` that is session-aware. If the user is already logged in, it becomes a `<Link to="/dashboard">Dashboard</Link>` button.

**3. "Start Curating" NavBar button doesn't route to auth**
- It currently focuses the hero email input instead of routing anywhere.
- Fix: If logged out → navigate to `/auth`. If logged in → navigate to `/dashboard`.

**4. Column name mismatch: `title` vs `name`**
- The `digital_assets` table has a column called `name` (confirmed in the DB schema), but the Dashboard code inserts `{ title: ... }`.
- Fix: Update the `DigitalAsset` interface and all insert/select references in `Dashboard.tsx` to use `name` instead of `title`.

**5. No Forgot Password flow**
- The AuthPage has no "Forgot password?" link.
- Fix: Add a "Forgot password?" link in login mode that shows an inline reset form. When submitted, it calls `supabase.auth.resetPasswordForEmail()` with a redirect to `/reset-password`. A new `/reset-password` page handles the recovery token and lets the user set a new password.

---

### Files Changed

- `src/lib/supabase.ts` — Update to re-export from the canonical integration client so nothing breaks that still imports from here.
- `src/contexts/AuthContext.tsx` — Switch import to `@/integrations/supabase/client`.
- `src/pages/AuthPage.tsx` — Switch import + add "Forgot password?" inline reset section in login mode.
- `src/pages/Dashboard.tsx` — Switch import + fix `title` → `name` column mismatch throughout.
- `src/components/NavBar.tsx` — Make session-aware: "Log In" → `/auth`, "Start Curating" → `/auth` or `/dashboard` depending on session, show "Dashboard" if already logged in.
- `src/App.tsx` — Add the `/reset-password` route.
- `src/pages/ResetPassword.tsx` — New page that reads the recovery token from the URL hash and lets the user set a new password.

---

### User Flow After This Fix

```text
Landing Page (/)
  NavBar — logged out:    "Log In" → /auth   |  "Start Curating" → /auth
  NavBar — logged in:     "Dashboard" → /dashboard  |  "Start Curating" → /dashboard

/auth  (Login/Signup toggle)
  Signup → confirmation email → user clicks link → auto-logged in → /dashboard
  Login  → direct → /dashboard
  Login  → "Forgot password?" → inline form → email sent → user clicks link → /reset-password

/reset-password
  Reads #access_token from URL (Supabase recovery flow)
  Shows new password form → calls updateUser({ password }) → redirects to /dashboard

/dashboard  (ProtectedRoute)
  If no session → redirected to /auth
  "Sign Out" button → signs out → redirected to /
```

---

### Technical Details

**NavBar session awareness**
- Wrap NavBar with `useAuth()` (AuthContext is already a provider above all routes in App.tsx, so this is safe).
- Conditional render: if `session` → show "Go to Dashboard" link + user email indicator. If no `session` → show "Log In" + "Start Curating".

**Forgot Password inline form**
- In `AuthPage`, add a `forgotPassword` boolean state.
- When `forgotPassword` is true and `mode === "login"`, replace the password field with a single email field and a "Send reset link" button.
- On submit: `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`
- Show success message inline.

**ResetPassword page**
- On mount, check `window.location.hash` for `type=recovery` — if not present, redirect to `/auth`.
- Show a new password + confirm password form.
- On submit: `supabase.auth.updateUser({ password: newPassword })` → toast success → navigate to `/dashboard`.
- This is a public route (not behind ProtectedRoute).

**Column fix**
- The `DigitalAsset` interface field `title` → renamed to `name`.
- All `.insert()`, `.select()`, and display references in `Dashboard.tsx` updated accordingly.
- The `AddAssetModal` label "Asset title" stays as-is for UX; only the DB column key changes.
