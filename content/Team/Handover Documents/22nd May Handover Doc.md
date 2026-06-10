# Orelis Hub — AI Session Handover
**Date:** 22nd May 2026  
**Repo root:** `/Users/tanmaygarg/orelis-vault/`  
**App root:** `/Users/tanmaygarg/orelis-vault/App/`  
**Dev server:** `cd App && npm run dev` → runs on `http://localhost:5173` (or 5174 if 5173 is occupied)

---

## What Has Been Built

A full React + TypeScript frontend for **Orelis Hub** — an AI business consulting platform by Orelis Studios. The app is a UI template with all data mocked, designed so that real AI logic and a backend can be dropped in later. No real backend exists yet.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite 8 |
| Language | TypeScript 6 (strict, `verbatimModuleSyntax` on) |
| Styling | Tailwind CSS v3 — all colours hardcoded as hex/rgba, no Tailwind named colours |
| Routing | React Router v6 (`BrowserRouter`, `Routes`, `Route`, `Navigate`, `Outlet`) |
| State | React Context + `useReducer` (no Redux, no Zustand) |
| Auth stub | JWT localStorage, wired for AWS API Gateway + PostgreSQL |
| Font | Inter (loaded from Google Fonts in `index.html`) |

**Important TypeScript rule:** The project uses `verbatimModuleSyntax`. Always use `import type { Foo }` for type-only imports, never `import { Foo }` for types.

---

## Folder Structure

```
App/
├── index.html                  ← Inter font loaded here, title = "Orelis Hub"
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx                 ← Root routing logic (see below)
    ├── index.css               ← All CSS variables / design tokens
    ├── App.css                 ← (unused, can ignore)
    ├── types/
    │   └── index.ts            ← All TypeScript interfaces
    ├── lib/
    │   ├── mockData.ts         ← All placeholder data (replace with AI API calls later)
    │   └── authService.ts      ← Auth API layer (wired for AWS/PostgreSQL)
    ├── context/
    │   ├── AppContext.tsx       ← Global app state (onboarding, dashboard)
    │   └── AuthContext.tsx      ← Auth state (user, token, isAuthenticated)
    ├── pages/
    │   ├── Onboarding.tsx       ← Full onboarding flow
    │   ├── Auth.tsx             ← Sign in / Sign up / Forgot password
    │   ├── DashboardRouter.tsx  ← Routes to Individual or Business dashboard
    │   ├── IndividualDashboard.tsx
    │   ├── BusinessDashboard.tsx
    │   ├── AIAdvisor.tsx        ← Stub chat UI
    │   ├── Launchpad.tsx        ← Stub idea cards (individual only)
    │   ├── Simulation.tsx       ← Stub AI simulation page
    │   ├── Tasks.tsx            ← Filterable task list
    │   ├── Documents.tsx        ← Drag & drop upload stub
    │   ├── Reports.tsx          ← Stub reports list
    │   ├── Profile.tsx          ← Stub profile page
    │   └── Settings.tsx         ← Stub settings page
    ├── components/
    │   ├── layout/
    │   │   ├── Sidebar.tsx      ← Fixed left nav, 228px wide
    │   │   ├── Topbar.tsx       ← Sticky 56px top bar
    │   │   └── DashboardLayout.tsx ← Shell with Outlet, applies sidebar margin
    │   ├── ui/
    │   │   ├── Badge.tsx
    │   │   ├── Button.tsx
    │   │   ├── Card.tsx
    │   │   └── ProgressBar.tsx
    │   └── dashboard/
    │       ├── individual/
    │       │   ├── IndividualHero.tsx
    │       │   ├── AITasksPanel.tsx
    │       │   ├── FeaturedIdea.tsx
    │       │   ├── BuildCTA.tsx
    │       │   ├── QuickAccess.tsx
    │       │   ├── RecentIdeas.tsx
    │       │   ├── NewsFeed.tsx
    │       │   └── SkillsFocus.tsx
    │       └── business/
    │           ├── BusinessHero.tsx
    │           ├── BusinessTasksPanel.tsx
    │           ├── GrowthRoadmap.tsx
    │           ├── PerformanceAnalytics.tsx
    │           ├── StrategicInsights.tsx
    │           ├── CompetitorResearch.tsx
    │           ├── AIActivityFeed.tsx
    │           ├── OpsSnapshot.tsx
    │           ├── BusinessQuickAccess.tsx
    │           └── DocumentIntelligence.tsx
```

---

## App Routing Logic (`App.tsx`)

The app uses a **three-gate pattern** in `AppRoutes()`:

```
Gate 1: !state.isOnboarded        → show <OnboardingPage />
Gate 2: !authState.isAuthenticated → show <AuthPage />
Gate 3: authenticated + onboarded  → show <DashboardLayout /> with all routes
```

Provider wrapping order (outermost first):
```tsx
<AppProvider>
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
</AppProvider>
```

**Note:** `AppContext` (onboarding state) is NOT persisted to localStorage — it lives only in memory. `AuthContext` IS rehydrated from localStorage on mount via a `useEffect`.

---

## State Management

### AppContext (`src/context/AppContext.tsx`)
Manages onboarding flow and which dashboard is active.

Key state fields:
- `isOnboarded: boolean` — flips to `true` when `COMPLETE_ONBOARDING` is dispatched
- `activeDashboard: 'individual' | 'business'` — which dashboard to show
- `onboarding: OnboardingState` — all form data from both onboarding paths

Key actions:
| Action | Effect |
|---|---|
| `SET_USER_TYPE` | Sets `onboarding.userType` to `'individual'` or `'business'` |
| `UPDATE_ONBOARDING` | Partial update of any onboarding field |
| `COMPLETE_ONBOARDING` | Sets `isOnboarded: true`, sets `activeDashboard` from userType |
| `SWITCH_DASHBOARD` | Switches between individual/business dashboards after onboarding |
| `RESET_ONBOARDING` | Resets entire state back to initial (used by ⇄ button in sidebar) |
| `ADD_DOCUMENT` / `REMOVE_DOCUMENT` | Manages `documentsUploaded` array |

### AuthContext (`src/context/AuthContext.tsx`)
Manages auth session. Rehydrates from localStorage on mount.

Key state fields:
- `isAuthenticated: boolean`
- `user: AuthUser | null` — `{ id, email, name, avatarUrl?, provider, newsletterOptIn, createdAt }`
- `token: string | null`
- `isLoading: boolean`
- `error: string | null`

Exposed handlers: `handleSignUp`, `handleSignIn`, `handleGoogleSignIn`, `handleForgotPassword`, `handleSignOut`, `clearError`

---

## Auth System (`src/lib/authService.ts`)

Wired for AWS backend + PostgreSQL. All functions are stubs — they call a real REST API once `VITE_API_URL` is set.

**Environment variables needed:**
- `VITE_API_URL` — AWS API Gateway / EC2 endpoint (e.g. `https://api.orelis.io`)
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth 2.0 client ID

**Endpoints mapped:**
| Function | Endpoint |
|---|---|
| `signUp()` | `POST /auth/signup` |
| `signIn()` | `POST /auth/signin` |
| `signInWithGoogle()` | `POST /auth/google` |
| `forgotPassword()` | `POST /auth/forgot-password` |

Token is stored in `localStorage` under keys `orelis_token` and `orelis_user`. The plan is to swap to httpOnly cookies once the backend is live.

---

## Onboarding Flow (`src/pages/Onboarding.tsx`)

Two paths, selected at the `WelcomeStep`:

### Business Path (4 steps)
1. **Company Setup** — name, website, industry, size, stage, goals, pain points
2. **Document Upload** — drag & drop, stores to `onboarding.documentsUploaded`
3. **AI Profile Review** — shows a mock AI-generated summary (placeholder)
4. **Done** — "Go to dashboard" button fires `handleComplete`

### Individual Path (3 steps)
1. **Idea Input** — idea title + open-ended description textarea
2. **MCQ + Open-ended** — 5 multiple choice questions (numbered 1–5), then a divider labelled "Open-ended", then Q6 "biggest challenge foreseen" textarea, Q7 "first 10 customers" textarea
3. **AI Report** — mock AI report, email capture for report delivery, newsletter opt-in checkbox

`handleComplete()` dispatches `COMPLETE_ONBOARDING` and calls `navigate('/dashboard')`. The auth gate in `App.tsx` intercepts this navigate and shows `<AuthPage />` instead if not authenticated.

**Dev bypass button:** Fixed to the bottom-right corner of the onboarding page. Clicking it:
1. Writes mock token + user to localStorage
2. Dispatches `SET_USER_TYPE: 'business'` and `COMPLETE_ONBOARDING`
3. Navigates directly to `/dashboard` — bypasses auth entirely

---

## Auth Page (`src/pages/Auth.tsx`)

Three views within one page, toggled by `mode` state:

- **Sign Up** (`mode: 'signup'`) — name, email, password + confirm, privacy policy checkbox (required), newsletter checkbox (defaulted ON)
- **Sign In** (`mode: 'signin'`) — email, password, "forgot password" link
- **Forgot Password** (`mode: 'forgot'`) — email input → success state with instructions

Features:
- `GoogleButton` component with real Google SVG logo
- `Input` component with password show/hide toggle
- `PasswordStrength` component — 4-segment bar, scores Weak / Fair / Good / Strong
- Error display box (shows both local validation errors and API errors from authState)
- Ambient glow background matching onboarding style
- **Dev bypass button** (dashed border, bottom of card) — writes mock session to localStorage and reloads

---

## Design System

### Colour Palette (Orelis Brand)
All colours are hardcoded hex/rgba inline. No Tailwind named colour classes (e.g. never `text-blue-500`).

| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#07070a` | Page background |
| `--bg-surface` | `#0c0c0e` | Sidebar, topbar |
| `--bg-card` | `#111116` | Cards, panels |
| `--bg-card-alt` | `#0f0f12` | Alternate card bg |
| `--bg-input` | `#18181c` | Input fields |
| `--accent-red` | `#ae0c00` | Primary brand red — buttons, logo, notification dot |
| `--accent-red-dim` | `#7a0800` | Red hover state |
| `--accent-gold` | `#D3AF37` | Secondary brand gold — active nav, badges, labels |
| `--accent-gold-dim` | `#b8962e` | Gold hover state |
| `--text-primary` | `#f0f0f2` | Main text |
| `--text-secondary` | `#8a8a96` | Secondary text |
| `--text-muted` | `#525258` | Muted/disabled text |

**Rule:** Red is for primary action elements (buttons, logo, notification dot). Gold is for active states, badges, labels, and informational highlights.

### Layout
- Sidebar: `228px` wide, fixed left, full height
- Topbar: `56px` tall, sticky
- Content area: `margin-left: var(--sidebar-w)`, padded `p-6`

### Gradients
- Brand gradient: `from-[#ae0c00] to-[#D3AF37]` (used on avatar pills, top accent bars)

---

## Mock Data (`src/lib/mockData.ts`)

All data is placeholder. Every export is labelled "replace with AI API calls" in comments. Key exports:

| Export | Used by |
|---|---|
| `individualTasks` | `AITasksPanel` |
| `ideas` | `FeaturedIdea`, `RecentIdeas`, `Launchpad` |
| `individualNewsItems` | `NewsFeed` |
| `skillRecommendations` | `SkillsFocus` |
| `businessTasks` | `BusinessTasksPanel` |
| `businessMetrics` | `BusinessHero` |
| `strategicInsights` | `StrategicInsights` |
| `aiActivities` | `AIActivityFeed` |
| `competitors` | `CompetitorResearch` |
| `growthMilestones` | `GrowthRoadmap` |
| `businessNewsItems` | (available, unused in current layout) |
| `opsSnapshot` | `OpsSnapshot` |
| `revenueChartData` | `PerformanceAnalytics` |

---

## TypeScript Types (`src/types/index.ts`)

Key interfaces:
- `AuthUser` — `{ id, email, name, avatarUrl?, provider: 'email'|'google', newsletterOptIn, createdAt }`
- `AuthState` — `{ user, token, isAuthenticated, isLoading, error }`
- `OnboardingState` — all onboarding form fields for both paths
- `Task`, `Idea`, `NewsItem`, `StrategicInsight`, `BusinessMetric`, `AIActivity`, `Competitor`, `GrowthMilestone`, `UploadedDocument`

---

## UI Components (`src/components/ui/`)

| Component | Variants |
|---|---|
| `Badge` | `blue` (gold tint), `purple` (red tint), `teal`, `success`, `warning`, `danger`, `muted`, `outline` |
| `Button` | `primary` (red), `secondary` (gold tint), `ghost` |
| `Card` | `default`, `highlighted` (red border), `purple` (gold border), `ghost` |
| `ProgressBar` | colour + value props |

---

## Layout Components

### Sidebar (`src/components/layout/Sidebar.tsx`)
- Fixed left, 228px
- Nav sections: Workspace (Dashboard, AI Advisor, Launchpad\*, Simulation, Tasks, Documents\*), Insights (Reports), Account (Profile, Settings)
- \* Launchpad only shows for `individual`, Documents only for `business`
- Active nav item: gold text + gold-tinted background
- Nav badges: gold
- Bottom user card: shows `authState.user.name` / `authState.user.email` (falls back to onboarding data)
- ⇄ button: resets entire app state (RESET_ONBOARDING)
- ↪ button: signs out (clears localStorage + auth state)

### Topbar (`src/components/layout/Topbar.tsx`)
- Search bar (decorative, readOnly for now)
- Individual / Business toggle — active tab is gold
- "AI active" green dot pill
- Bell icon with red notification dot
- User avatar: red→gold gradient circle with initials "DU" (hardcoded for now, should use `authState.user` initials)
- "+ Quick Action" red button

### DashboardLayout (`src/components/layout/DashboardLayout.tsx`)
- Renders `<Sidebar />` + `<Topbar />` + `<Outlet />`
- Content area applies `marginLeft: var(--sidebar-w)` and `paddingTop: var(--topbar-h)`

---

## What Is NOT Yet Built / Pending

1. **Backend connection** — `VITE_API_URL` is not set. Auth calls go nowhere. Need AWS API Gateway / Express + PostgreSQL to implement the 4 auth endpoints.
2. **Google OAuth** — `VITE_GOOGLE_CLIENT_ID` not set. `initGoogleOAuth()` exists in authService but is not wired to a real flow.
3. **Real AI logic** — all dashboard data is mock. Every component has placeholder text where AI-generated content will go.
4. **Topbar user avatar** — currently hardcoded initials "DU". Should read from `authState.user.name`.
5. **AppContext persistence** — onboarding state is lost on page refresh. If the user refreshes mid-onboarding they restart. Could add localStorage persistence to AppContext if needed.
6. **Stub pages** — AIAdvisor, Simulation, Launchpad, Reports, Profile, Settings are all skeletons with placeholder content.
7. **Real routing on auth success** — currently after sign-in/sign-up the app navigates to `/dashboard` via the gate pattern in App.tsx. This works but could be made more explicit.
8. **Remove dev bypasses** — two bypass buttons exist for development (Onboarding page bottom-right, Auth page below card). Remove before production.

---

## How to Continue

1. Read `BrandDeck.md` in `Obsidian/Orelis Hub/` for brand colours (red `#ae0c00`, gold `#D3AF37`)
2. Read `Obsidian/Orelis Hub/` folder for all product documentation
3. Run `cd App && npm run dev` to start the dev server
4. Use the **dev bypass** button on the onboarding page to skip straight to the dashboard
5. All AI logic replacement points are marked with comments in `mockData.ts`
