
## SafeHands — Digital Identity Platform Landing Page

**Brand:** SafeHands | **Tagline:** "Start curating your legacy."

---

### 🎨 Design System
- **Racing Green** `#002B2A` — primary dark backgrounds
- **Misty Jade** `#BCD9C8` — CTA buttons, accents, anchor shape
- **Transparent Yellow** `#F4ECC2` — warm card tones, section washes
- **Aubergine Gleam** `#301728` — Reflection Engine section background
- **Vintage Wine** `#3F1521` — footer/closing section
- **Serif font** (Playfair Display via Google Fonts) for all headlines
- **Sans-serif** (Inter) for body copy, nav, UI elements

---

### 🏗️ Page Sections (8 Total)

#### 1. Navigation Bar
Sticky nav — "SafeHands" logotype (serif, light) on the left. Right side: "Log In" ghost link + **"Start Curating"** pill button in Misty Jade. Transitions from transparent to solid Racing Green on scroll.

#### 2. Hero Section
Full-width Racing Green background. A massive, soft-edged Misty Jade geometric arc/semi-circle (pure CSS) sits behind the headline as the visual "anchor." Headline: *"Start curating your legacy."* (large serif). Sub-headline below. Floating data-type chips (Photos · Voice Notes · Messages · Creative Work) scattered softly around the shape. Email input + **"Start Curating Your Legacy"** CTA button (Misty Jade pill) — connected to Supabase waitlist.

#### 3. "Quiet Questions" — 4-Column Card Grid
Inspired by inspiration photo 1. Light section background. Label: *"Questions worth asking."* Four oversized rounded cards, each a different color from the palette (Misty Jade, Transparent Yellow, Aubergine Gleam, Racing Green). Large serif italic question text + subtle hover interaction: card lifts and the answer text smoothly fades in below the question.
- *"Where is all the data on my phone and computer going to go?"* → We help you **Map it.**
- *"Who do I want to have it and how do I decide?"* → You **Assign it.**
- *"Is my creative work just... files? Or is it part of who I am?"* → You **Categorize it.**
- *"What happens to my voice notes, my journals, my unsent drafts?"* → You **Decide.**

#### 4. Social Proof Bar
Clean, minimal strip between sections. Placeholder stats (easily editable):
- **2,400+** people have started mapping their digital identity
- **18,000+** digital artifacts categorized
- **94%** say they feel more prepared after one session

#### 5. The Reflection Engine
Aubergine Gleam `#301728` background — intimate, deep. Left: descriptive text about the AI reflection partner. Right: a CSS phone mockup with 3 floating, animated glassmorphic "notification cards" (backdrop blur, soft border, Misty Jade tones) showing AI prompts like *"I've found 42 unlabelled voice notes..."* Cards gently float up and down via CSS keyframe animation.

#### 6. "How It Works" — 3-Step Anchor
Inspired by inspiration photo 2. Light/warm background wash. Serif headline: *"Three steps to intentional legacy."* Three horizontal/pill-shaped step cards:
1. **Inventory** — Securely scan your photos, voice notes, and accounts.
2. **Reflect** — AI-guided prompts help you categorize Memories vs. Assets.
3. **Entrust** — Set inactivity triggers and assign trusted contacts, intentionally.

#### 7. "Privacy by Intent" Ethics Block
Racing Green background. Serif headline: *"We built this for you. Not about you."* Three columns with icons: Zero-knowledge encryption · No data selling · Clear deletion pathways. Calm, confident tone — not legal-heavy.

#### 8. Final CTA + Footer
Vintage Wine `#3F1521` background. Large serif headline: *"Your digital life deserves intention."* Second email capture form also connected to Supabase waitlist. Footer links: Privacy Policy · Ethics Statement · Contact.

---

### 🗄️ Supabase Integration
- Connect your own Supabase project (you'll provide the Project URL + Anon Key)
- Create a `waitlist` table: `id`, `email`, `created_at`
- Both hero and footer forms insert into this table
- Zod email validation client-side before submission
- Toast notification on success / duplicate / error

---

### ✨ Interactions
- Scroll-triggered fade-in animations for each section (CSS/Intersection Observer)
- Question cards: hover lifts shadow + reveals answer text (CSS transition)
- Glassmorphic floating cards: subtle continuous float animation (CSS keyframes)
- Nav: transparent → solid on scroll (JavaScript scroll listener)
- CTA button: gentle pulse/glow on hover
