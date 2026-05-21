<div align="center">

# 🧭 CompassQ

### Your Reflective Discovery Companion for the Quran

**The app that doesn't just deliver verses — it learns what moves your soul.**

> *"Every Quran app tracks how often you read. None track how deeply it moves you."*

[![Next.js 16](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres+Auth-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Quran MCP](https://img.shields.io/badge/Quran_MCP-Semantic_AI-8B5CF6?style=flat-square)](https://mcp.quran.ai/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?style=flat-square)](https://tanstack.com/query)
[![Zod 4](https://img.shields.io/badge/Zod-4-3E67B1?style=flat-square)](https://zod.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

**[▶️ Watch Demo (2 min)](https://youtube.com/shorts/Ehvn7_ZdrIE)** · **[🌐 Try Live App](https://compassq.hildankutomo.my.id)** · **[📄 Hackathon Submission](#)**

</div>

---

## 🧠 Product Philosophy & Behavioral Design

### The Post-Ramadan Retention Crisis

During Ramadan, Muslims worldwide engage deeply with the Quran — daily reading, reflection, and community recitation become habitual. But research on habit formation tells us that **habits built in extraordinary contexts collapse when the context disappears**. Post-Ramadan, the environmental cues (community iftar, taraweeh prayers, social accountability) vanish overnight.

The result: a steep engagement cliff. Users open their Quran apps less, streaks break, and the spiritual momentum built over 30 days dissipates within a week.

### How CompassQ Solves This (Behavioral Science Framework)

CompassQ is designed around **BJ Fogg's Tiny Habits model** and **James Clear's identity-based habit loops** from *Atomic Habits*:

| Principle | How CompassQ Applies It |
|-----------|------------------------|
| **Make it obvious** (Cue) | Daily emotional check-in creates a consistent trigger — "How do I feel right now?" replaces the lost Ramadan cues |
| **Make it attractive** (Craving) | Verse Resonance Score creates curiosity: "Will today's verse resonate more than yesterday's?" The weekly Resonance Report acts like a Spotify Wrapped for your spiritual life |
| **Make it easy** (Response) | One emotion tap → one verse → one optional reflection → one resonance rating. The entire session takes 60-90 seconds |
| **Make it satisfying** (Reward) | Quran Echoes reward completion with semantic discovery — "Here's where this theme echoes across the Quran." The compounding personalization means each session feels more relevant than the last |

> **The key insight:** Post-Ramadan retention fails because apps offer the same static experience regardless of how the user engages. CompassQ creates a **compounding flywheel** — the more you use it, the better it knows what moves you, the more meaningful each session becomes. This creates a switching cost that static verse-of-the-day apps cannot match.

### Reflection-First, Safe Curation Philosophy

We made a deliberate architectural choice: **rule-based verse matching + human reflection over unconstrained AI chatbots.**

**Why?**

1. **Sacred text integrity** — LLM-generated responses about Quranic meaning risk hallucination of tafsir, fabrication of hadith context, or misattribution of scholarly opinions. We refuse to put AI-generated Islamic guidance in front of users.

2. **The user is the meaning-maker** — CompassQ delivers the verse and asks *you* what it means to you. Your reflection is the insight. The app is a mirror, not a preacher.

3. **Where we DO use AI** — Quran MCP's semantic search is used exclusively for *discovery* (finding thematically connected verses), never for *interpretation*. The AI finds connections; the human finds meaning.

4. **Grounded retrieval** — Our MCP integration uses `fetch_grounding_rules` with a security nonce, ensuring all semantic results are grounded in actual Quranic text, not generated content.

```
┌─────────────────────────────────────────────────────────────┐
│  What CompassQ DOES with AI:                                │
│  ✓ Semantic similarity search (find related verses)         │
│  ✓ Vector-based thematic clustering                         │
│  ✓ Grounded retrieval with nonce verification               │
│                                                             │
│  What CompassQ NEVER does with AI:                          │
│  ✗ Generate tafsir or interpretation                        │
│  ✗ Answer Islamic jurisprudence questions                   │
│  ✗ Paraphrase or summarize Quranic meaning                 │
│  ✗ Provide spiritual advice or counseling                   │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Core User Journey & Feature Deep-Dive

### The Complete Engagement Loop

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│  Emotional   │────▶│    Quran     │────▶│     Personal     │────▶│  Verse Resonance  │────▶│   Quran Echoes   │
│  Check-in    │     │   Moment     │     │    Reflection    │     │     Scoring       │     │ (Semantic Chain) │
└──────────────┘     └──────────────┘     └──────────────────┘     └───────────────────┘     └──────────────────┘
       │                    │                      │                         │                        │
  "How do I feel?"    Arabic + Translation   "What does this        "How deeply did         "Where does this
  Select 1 of 8       + Tafsir + Audio       mean to me?"           this resonate?"         theme echo across
  emotional states    Personalized by        Max 280 chars          1-5 sparkle scale       the Quran?"
                      resonance history      Draft auto-saved       Feeds back into         MCP semantic search
                                                                    recommendations         Save as Collection
```

### Step 1: Emotional Check-in

The user opens CompassQ and answers one question: *"What's on your heart today?"*

Eight carefully chosen emotional categories map to the post-Ramadan experience:

| Category | Post-Ramadan Context |
|----------|---------------------|
| 🌊 Anxiety | Overwhelm returning to routine without spiritual structure |
| 🌿 Gratitude | Wanting to maintain the thankfulness cultivated in Ramadan |
| 🪨 Patience | Struggling with the slower pace of spiritual growth outside Ramadan |
| 🧭 Guidance | Seeking direction without the community support of Ramadan |
| 🌅 Hope | Holding onto optimism despite the post-Ramadan dip |
| ⚡ Discipline | Trying to maintain self-accountability without external structure |
| 🌑 Feeling Distant | The most common post-Ramadan emotion — spiritual disconnection |
| 🤲 Need Comfort | Seeking solace in a period of adjustment |

**One check-in per day** (timezone-aware) — this constraint is intentional. It prevents compulsive checking and frames the app as a daily ritual, not an on-demand tool.

### Step 2: Quran Moment (Personalized Verse Delivery)

Based on the emotional check-in, CompassQ delivers a single verse with full context:

- **Arabic text** (Uthmani script) — preserving the sacred original
- **English translation** (Sahih International) — accessible meaning
- **Tafsir excerpt** — scholarly context for deeper understanding
- **Audio recitation** — Quranic recitation for auditory engagement

**The recommendation engine is NOT random.** It uses a resonance-weighted selection algorithm:

```
IF user's average resonance for this category (last 30 days) >= 3.5:
    Apply partial Fisher-Yates shuffle favoring high-resonance patterns
ELSE:
    Standard rotation through category catalog
    
ALWAYS: Avoid repeating the previous session's verse
```

This means the app **learns your taste over time** without you ever configuring preferences.

### Step 3: Personal Reflection

After receiving the verse, the user is invited (never forced) to write a brief reflection:

- **Max 280 characters** — intentionally constrained to encourage distillation of thought
- **Draft auto-saved to localStorage** — survives page refresh, network issues
- **Multiple reflections per session** — "Write another reflection" for deeper processing
- **Skip option** — reflection is valuable but never mandatory

### Step 4: Verse Resonance Score

> *"How deeply did this verse resonate with you?"*

---

#### 🔮 Deep-Dive: Verse Resonance Score — Quantified Spiritual Impact

The Verse Resonance Score is CompassQ's core innovation. It answers a question no other Quran app asks: **"Did this verse actually move you?"**

**The Mechanism:**

A single-tap 1-5 sparkle rating (✦) appears after reflection. It's:
- **Optional** — doesn't block session completion
- **Toggleable** — tap the same score to deselect
- **Accessible** — proper `role="radiogroup"` with `aria-checked` states

**The Feedback Loop:**

```
User rates verse (1-5)
        │
        ▼
Stored in sessions table ──────────────────────────────┐
        │                                              │
        ▼                                              ▼
30-day rolling average                    Weekly Resonance Report
computed per category                     (insights dashboard)
        │                                              │
        ▼                                              ▼
Categories with avg >= 3.5              "Your most resonant verse
get boosted in future                    this week was Ar-Rahman 55:13
recommendations                          when you were feeling grateful"
        │
        ▼
User receives MORE verses
from high-resonance categories
        │
        ▼
Higher satisfaction ──▶ Higher retention ──▶ More data ──▶ Better recommendations
```

**Why This Matters for Post-Ramadan Retention:**

The resonance profile becomes a **personal spiritual fingerprint** that grows more accurate over time. Leaving CompassQ means losing this accumulated understanding. This creates healthy retention through genuine value, not dark patterns.

**Technical Implementation:**
- Database: `sessions.resonance_score` (smallint, CHECK 1-5, nullable)
- Recommendation: `loadCategoryResonanceWeights()` in `src/lib/services/moments.ts`
- Insights: `computeResonanceInsights()` in `src/lib/services/insights.ts`
- UI: `ResonanceRating` component in `src/lib/ui/home/resonance-rating.tsx`

---

### Step 5: Quran Echoes (Semantic Discovery)

#### 🌊 Deep-Dive: Quran Echoes — Semantic Verse Chains via Quran MCP

After completing a session, CompassQ reveals something magical: **other verses in the Quran that echo the same theme.**

**The Concept:**

The Quran is not a linear book — it's an interconnected web of themes, stories, promises, and commands that reference each other across 114 surahs. Quran Echoes makes these invisible connections visible.

**How It Works:**

```
Session completed (verse: Al-Baqarah 2:286 on "Anxiety")
        │
        ▼
Build semantic query: "anxiety - Allah does not burden a soul
beyond that it can bear..."
        │
        ▼
Quran MCP semantic search (vector similarity)
via @modelcontextprotocol/sdk
        │
        ▼
Filter: remove original verse, deduplicate
        │
        ▼
Resolve each echo: MCP data → DB cache → QF Content API
        │
        ▼
Present as echo card:
┌─────────────┐
│ Echo         │
│ At-Talaq    │
│ 65:7        │
│ "Allah does │
│  not charge │
│  a soul..." │
│ [▶️] [🔖]   │
└─────────────┘
        │
        ▼
User can bookmark the echo or add to collections via the saved library
```

**Why Echoes Transform Engagement:**

1. **Transforms single-verse sessions into multi-verse exploration** — users discover connections they'd never find manually
2. **Creates a "one more verse" pull** — like YouTube's autoplay, but for spiritual discovery
3. **Builds thematic collections organically** — users accumulate meaningful verse groupings over time
4. **Demonstrates the Quran's internal coherence** — a pedagogically powerful experience

**Technical Implementation:**
- MCP Client: Singleton with lazy init, `StreamableHTTPClientTransport` to `https://mcp.quran.ai/`
- Tools Used: `fetch_grounding_rules`, `search_quran`, `fetch_quran`, `fetch_translation`
- Multi-layer resolution: MCP result → DB cache → QF Content API (with caching)
- Non-blocking: MCP failures return empty arrays, never crash the session flow
- File: `src/lib/services/echoes.ts`, `src/lib/qf/mcp.ts`

---

## 📋 Hackathon Compliance & API Mapping

### Content APIs Integration

| QF Content API | Feature Mapped | Integration Depth | File Path |
|----------------|---------------|-------------------|-----------|
| **Quran API** (verse text, Uthmani) | Quran Moment — Arabic display | Deep: OAuth2 client_credentials, token caching, retry w/ backoff | `src/lib/qf/content.ts` |
| **Translation API** (Sahih International) | Quran Moment — English meaning | Deep: Bundled with verse fetch, cached in DB | `src/lib/qf/content.ts` |
| **Tafsir API** (resource 169) | Quran Moment — Scholarly context | Deep: Bundled with verse fetch, cached in DB | `src/lib/qf/content.ts` |
| **Audio API** (recitation 1) | Quran Moment — Verse recitation playback | Moderate: Audio URL resolved per verse | `src/lib/qf/content.ts` |
| **Quran MCP** (semantic vector search) | Quran Echoes — Thematic verse discovery | Deep: Full MCP protocol via SDK, 4 tools used, grounding nonce | `src/lib/qf/mcp.ts` |

### User APIs Integration

| QF User API | Feature Mapped | Integration Depth | File Path |
|-------------|---------------|-------------------|-----------|
| **Bookmarks API** | Save favorite verses, sync to Quran.com | Deep: Bidirectional sync, OIDC + client_credentials hybrid | `src/lib/qf/user.ts`, `src/lib/services/bookmarks.ts` |
| **Collections API** | Custom verse groupings, organize saved verses | Deep: Create, add items, remove items, idempotent upsert | `src/lib/services/collections.ts` |
| **OIDC / OAuth2** | Connect Quran.com account, enable bookmark sync | Deep: Full PKCE (S256) flow, token refresh, cookie sessions | `src/lib/qf/oidc.ts`, `src/app/api/auth/qf/` |

### Authentication Architecture

| Auth Method | Scope | Usage |
|-------------|-------|-------|
| **OAuth2 Client Credentials** | `content` | QF Content API access (verse data) |
| **OAuth2 Client Credentials** | `bookmark` | QF User API fallback (when OIDC not connected) |
| **OIDC Authorization Code + PKCE** | `openid offline_access bookmark` | Full user-level QF access (bookmark sync) |
| **Supabase Auth** | App-level | User registration, session management, RLS |

### MCP Protocol Compliance

| MCP Requirement | Implementation |
|-----------------|---------------|
| SDK Used | `@modelcontextprotocol/sdk ^1.29.0` |
| Transport | `StreamableHTTPClientTransport` (HTTP streaming) |
| Endpoint | `https://mcp.quran.ai/` |
| Grounding | `fetch_grounding_rules` → nonce cached and passed to all subsequent calls |
| Tools Called | `search_quran`, `fetch_quran`, `fetch_translation`, `fetch_grounding_rules` |
| Error Handling | Graceful degradation (empty results on failure, never crashes) |
| Response Normalization | Handles `structuredContent`, text JSON, array/object variants |

---

## 📈 Post-Ramadan Impact Analysis

### Why CompassQ Scores Maximum on "Impact on Quran Engagement"

#### The Compounding Engagement Flywheel

Unlike static verse-delivery apps that offer the same experience on Day 1 and Day 100, CompassQ creates a **compounding personalization engine**:

```
Week 1: Generic recommendations (learning phase)
         ↓
Week 2: Resonance data begins shaping selections
         ↓
Week 4: Strong category preferences emerge
         ↓
Week 8: Highly personalized — each verse feels "chosen for me"
         ↓
Week 12+: Deep resonance profile = powerful switching cost
```

#### The Three Retention Mechanisms

**1. Personalization Lock-in (Resonance Score)**

Every session makes the next session better. The 30-day rolling resonance window means:
- Recent engagement is weighted heavily
- The app adapts to emotional seasons (post-Ramadan adjustment → settling → growth)
- Users who leave and return find their profile still relevant (decay is gradual)

**2. Discovery Reward (Quran Echoes)**

Each completed session unlocks a semantic discovery moment. This creates:
- **Variable reward** (Nir Eyal's Hook Model) — you never know which connections the MCP will surface
- **Completion motivation** — "I want to see what echoes today"
- **Collection building** — accumulated echo collections become a personal Quran map

**3. Identity Reinforcement (Weekly Insights)**

The weekly Resonance Report tells users:
- "You engaged 5 days this week" (consistency)
- "Your most resonant verse was..." (personal meaning)
- "You gravitated toward patience and hope" (self-knowledge)
- "Your average resonance increased from 3.2 to 3.8" (growth)

This transforms Quran engagement from a *behavior* into an *identity* — "I am someone who connects deeply with the Quran" — which is the strongest predictor of long-term habit retention (James Clear, *Atomic Habits*, Chapter 2).

#### Why the Closed Loop Guarantees Long-Term Engagement

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE COMPASSQ FLYWHEEL                         │
│                                                                 │
│   ┌──────────┐        ┌──────────────┐        ┌──────────┐    │
│   │  Better  │───────▶│   Higher     │───────▶│   More   │    │
│   │  Verses  │        │  Resonance   │        │   Data   │    │
│   └──────────┘        └──────────────┘        └──────────┘    │
│        ▲                                           │           │
│        │                                           │           │
│        └───────────────────────────────────────────┘           │
│                                                                 │
│   + Quran Echoes add DISCOVERY to each cycle                   │
│   + Weekly Insights add REFLECTION to each cycle               │
│   + Streak tracking adds CONSISTENCY to each cycle             │
│                                                                 │
│   = A system that gets MORE valuable with every use            │
└─────────────────────────────────────────────────────────────────┘
```

**No other app in this hackathon builds this closed loop.** Competitors either:
- Deliver random/sequential verses (no personalization)
- Track mood but don't feed it back into recommendations (no learning)
- Use AI for one-shot Q&A (no memory across sessions)
- Track streaks without measuring *quality* of engagement (vanity metrics)

CompassQ is the only submission that measures **depth of engagement** (resonance), **feeds it back** (weighted recommendations), and **rewards continued use** (semantic discovery + insights). This is why it guarantees post-Ramadan retention where others fail.

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React 19)                      │
│  TanStack Query │ Zod Validation │ localStorage Persistence  │
└────────────────────────────┬────────────────────────────────┘
                             │
                    Next.js 16 App Router
                             │
┌────────────────────────────┼────────────────────────────────┐
│                     API ROUTES (v1/)                          │
│  check-ins │ moments │ reflections │ sessions │ echoes       │
│  bookmarks │ collections │ streaks │ history │ insights      │
└──────┬─────────────┬──────────────┬─────────────────────────┘
       │             │              │
       ▼             ▼              ▼
┌──────────┐  ┌───────────┐  ┌──────────────┐
│ Supabase │  │ QF Content│  │  Quran MCP   │
│ Postgres │  │    API    │  │ (Semantic AI) │
│ + Auth   │  │ + User API│  │              │
│ + RLS    │  │ + OIDC    │  │              │
└──────────┘  └───────────┘  └──────────────┘
```

### Key Engineering Decisions

| Decision | Rationale |
|----------|-----------|
| **Rule-based matching + MCP discovery** | Prevents hallucination of sacred text while enabling AI-powered exploration |
| **Supabase RLS** | Row-level security ensures users can only access their own data without app-level checks |
| **Fire-and-forget QF sync** | Bookmark sync to Quran.com never blocks the user experience |
| **Multi-layer verse caching** | MCP result → DB cache → Content API. Minimizes external calls, maximizes speed |
| **Zod on API boundaries** | Runtime type safety catches malformed requests before they hit business logic |
| **Retry with backoff + jitter** | Graceful handling of QF API rate limits (429) and transient failures |
| **localStorage draft persistence** | Reflections survive network issues and page refreshes |
| **Timezone-aware daily limits** | One check-in per *user's local day*, not UTC day |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (local or hosted)
- Quran Foundation API credentials

### Environment Setup

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# QF Content API (OAuth2 Client Credentials)
QF_CONTENT_ENV=production
QF_CONTENT_CLIENT_ID=your_client_id
QF_CONTENT_CLIENT_SECRET=your_client_secret
QF_CONTENT_TRANSLATION_RESOURCE_ID=85
QF_CONTENT_TAFSIR_RESOURCE_ID=169
QF_CONTENT_RECITATION_ID=1

# QF User API / OIDC (for bookmark sync)
QF_USER_CLIENT_ID=your_user_client_id
QF_USER_CLIENT_SECRET=your_user_client_secret
QF_USER_ENV=production

# Quran MCP
QURAN_MCP_URL=https://mcp.quran.ai/
```

### Installation & Development

```bash
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

### Database Migrations

Apply Supabase migrations in order:

```bash
supabase db push
```

Or manually apply from `supabase/migrations/`:
1. `20260407103000_auth_profiles.sql` — Auth & profiles
2. `20260408110000_core_schema.sql` — Core tables (check-ins, sessions, reflections, etc.)
3. `20260408111000_rls.sql` — Row-level security policies
4. `20260408130000_recommendation_seed.sql` — Category → verse mapping seed data
5. `20260520100000_fix_reflection_min_length.sql` — Reflection constraint fix
6. `20260520110000_add_resonance_score.sql` — Resonance score column + index

---

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router pages & API routes
│   ├── api/v1/                   # RESTful API endpoints
│   │   ├── check-ins/            # Daily emotional check-in
│   │   ├── moments/recommend/    # Verse recommendation engine
│   │   ├── reflections/          # Personal reflection CRUD
│   │   ├── sessions/[id]/        # Session completion + echoes
│   │   ├── bookmarks/            # Verse bookmarking (QF sync)
│   │   ├── collections/          # Verse collections
│   │   ├── streaks/              # Engagement streaks
│   │   ├── history/              # Session history
│   │   └── insights/weekly/      # Weekly resonance insights
│   └── api/auth/qf/              # QF OIDC authentication flow
├── lib/
│   ├── qf/                       # Quran Foundation integrations
│   │   ├── content.ts            # Content API (verse, translation, tafsir, audio)
│   │   ├── mcp.ts                # Quran MCP (semantic search)
│   │   ├── user.ts               # User API (bookmark sync)
│   │   └── oidc.ts               # OIDC PKCE authentication
│   ├── services/                 # Business logic layer
│   │   ├── moments.ts            # Resonance-weighted recommendation engine
│   │   ├── echoes.ts             # Quran Echoes (MCP semantic chains)
│   │   ├── insights.ts           # Weekly insights + resonance analytics
│   │   ├── sessions.ts           # Session lifecycle + streak updates
│   │   └── ...                   # check-ins, reflections, bookmarks, etc.
│   ├── queries/                  # Client-side TanStack Query hooks
│   └── ui/                       # React components
│       ├── home/                 # Core flow UI (check-in, moment, reflection, echoes)
│       ├── insights/             # Weekly dashboard
│       ├── saved/                # Bookmarks & collections
│       └── profile/              # User profile + QF connect
└── supabase/migrations/          # Database schema & seed data
```

---

## 👥 Team

| Name | Role |
|------|------|
| **Hildan Kusto Utomo** | Full-Stack Engineer |
| **Terresa Alicia** | Project Manager & Product Engineer |

---

## 🏆 Built For

**Quran Foundation Hackathon — Ramadan 2026**

CompassQ is a submission for the Quran Foundation Hackathon, focused on solving the post-Ramadan engagement retention problem through behavioral design, personalized verse discovery, and semantic AI.

---

<div align="center">

*CompassQ — Because the Quran deserves more than a streak counter.*

</div>
