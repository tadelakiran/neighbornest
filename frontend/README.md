# 🏘️ NeighborNest — Frontend (Modules 1 & 2: Auth · Onboarding · Profile)

The React + TypeScript frontend for **NeighborNest** — a platform that matches newcomers in a city
into small curated groups (*Nests*) with local *Anchors*.

**Module 1** delivered the **Authentication & Core Shell**: login/register, JWT handling with
automatic refresh, the post-login app shell (navbar + sidebar), toasts, routing guards, and the
404/error surfaces.

**Module 2** delivered the **Onboarding & Profile** experience: an animated 7-step onboarding
wizard (with draft auto-save and resume), a full profile dashboard with an edit slide-over,
settings, and the Anchor application flow.

## 🧱 Tech Stack

| Concern          | Library                                          |
| ---------------- | ------------------------------------------------ |
| UI               | React 18 + TypeScript (strict)                   |
| Build tool       | Vite 5                                           |
| Styling          | Tailwind CSS 3.4 (dark-first, utility classes)   |
| Routing          | React Router v6 (declarative)                    |
| HTTP             | Axios (interceptors for auth + refresh)          |
| State            | Zustand 4 (auth store + toast store)             |
| Forms            | React Hook Form + Zod validation                 |
| Animations       | Framer Motion (page transitions, stagger, spring)| 
| Icons            | Lucide React (no FontAwesome, no shadcn/ui)      |

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (defaults to http://localhost:5173)
npm run dev
```

Other scripts:

```bash
npm run typecheck   # TypeScript strict typecheck
npm run build       # typecheck + production build (dist/)
npm run preview     # preview the production build
```

## ⚙️ Environment

Copy `.env.example` to `.env.local` if you need to override the API URL:

```
VITE_API_URL=http://localhost:8080
```

- The API Gateway already enables CORS for all origins, so pointing directly at
  `http://localhost:8080` works.
- **Alternative:** set `VITE_API_URL=` (empty) to route requests through the Vite dev proxy
  (`/api` → `http://localhost:8080`) defined in `vite.config.ts` — useful if you ever disable CORS.

## 🔐 Authentication Flow

- **Login** → `POST /api/auth/login` → tokens stored → `GET /api/users/me` fetches the profile →
  redirect to the intended page (or `/dashboard`).
- **Register** → `POST /api/auth/register`. The backend returns the created user **without tokens**,
  so we redirect to `/login` with a success toast.
- **Token lifecycle**
  - Access token (15 min): **memory only** (Zustand). Never persisted.
  - Refresh token: stored in `localStorage` so sessions survive reloads.
  - On any 401 (except login/refresh endpoints), the axios interceptor calls
    `POST /api/auth/refresh`, **rotates** the token, and retries the original request. Concurrent
    401s are queued behind a single refresh. If refresh fails, the session is cleared and the user
    is sent to `/login`.
- **Logout** → `POST /api/auth/logout` (best effort) → clear local session → `/login`.

### Persistence model (Zustand `persist`)

Only `user` and `isAuthenticated` are persisted — the access token stays in memory, and the refresh
token is stored under a dedicated key (`neighbornest.refreshToken`).

## 🗂️ Folder Structure

```
src/
├── components/
│   ├── ui/            # Button, Input, Card, Badge, Avatar, Spinner, Toast, Toggle, Textarea, Select, Modal, StepCard, FieldError
│   ├── layout/        # Navbar, Sidebar, AppLayout, PublicLayout
│   ├── auth/          # LoginForm, RegisterForm
│   ├── onboarding/    # OnboardingWizard, StepIndicator, 7 wizard steps
│   └── profile/       # ProfileHeader, ProfileTabs, ProfileInfoTab, EditProfilePanel, SettingsTab, AnchorApplicationForm, TagInput, MyNestsPlaceholder
├── pages/             # Login, Register, Onboarding, Dashboard, Profile, NotFound, ComingSoon
├── hooks/             # useAuth, useToast, useProfile, useOnboardingDraft
├── stores/            # authStore (persisted), toastStore
├── services/          # api.ts (axios + interceptors), authService.ts, userService.ts
├── types/             # auth.types.ts, user.types.ts (wire-accurate API contracts)
├── lib/               # utils.ts (cn, getErrorMessage), constants.ts, onboarding.ts, motion.ts
└── router/            # AppRouter, ProtectedRoute
```

## 📡 API Contracts (important)

The backend serializes **responses in snake_case** while **request bodies use camelCase**:

| Endpoint | Body (camelCase) | Response (snake_case) |
| -------- | ---------------- | --------------------- |
| `POST /api/auth/login` | `{ email, password }` | `{ access_token, refresh_token, token_type, expires_in }` |
| `POST /api/auth/register` | `{ fullName, email, password }` | user object (`full_name`, `role`, `is_onboarded`, …) |
| `POST /api/auth/refresh` | `{ refreshToken }` | same as login |
| `POST /api/auth/logout` | `{ refreshToken }` (optional) | `200` |
| `GET /api/users/me` | — | profile object (`full_name`, `role`, `is_onboarded`, …) |

Notes baked into the types:

- `GET /api/users/me` (user-service) does **not** return `email`; `User.email` is therefore
  optional and only populated from the registration response.
- A 404 from `/api/users/me` means the profile hasn't been created yet — the shell tolerates it
  silently.
- The password rule (uppercase + lowercase + digit + special) mirrors the backend `@Pattern`
  validation exactly (`PASSWORD_REGEX` in `src/lib/constants.ts`).

### Module 2 — user-service contracts

| Endpoint | Body (camelCase) | Response (snake_case) |
| -------- | ---------------- | --------------------- |
| `POST /api/users/profile` | `{ fullName, city, neighborhood?, yearsInCity?, occupation? }` | profile object |
| `GET /api/users/me` | — | profile + `onboarding_answers` |
| `PUT /api/users/me` | partial `{ fullName?, city?, workType?, personalityType?, … }` | profile object |
| `POST /api/users/onboarding` | `{ answers: [{ questionKey, answerValue, weight }] }` | profile object |
| `GET /api/users/onboarding/status` | — | `{ onboarded, answerCount }` |
| `POST /api/users/anchor-apply` | `{ yearsInCity, neighborhoodsKnown: string[], … }` | application object |

- Enum values (work type, personality, schedule, social goal, budget) **must match the backend**
  exactly (e.g. `FULL_TIME`, `AMBIVERT`, `EARLY_BIRD`, `FRIENDSHIP`, `MEDIUM`).
- Onboarding answers use `values_*` keys (1-5 rating, weight = rating) and `interest_<slug>` keys
  (weight 2) — the matching-service scoring engine consumes both.
- Anchor tag lists are sent as **comma-joined strings** (the arrays are joined in `userService`).

## ✨ Module 2 — Onboarding & Profile

- **Onboarding wizard (`/onboarding`)**: 7 animated steps (Welcome → Basic Info → Personality →
  Interests → Lifestyle → Review → Done) with a progress stepper, direction-aware slide
  transitions, staggered form fields, per-step Zod validation, a celebration screen with confetti,
  and **draft auto-save** to localStorage (`neighbornest.onboarding.draft`) so a refresh resumes
  exactly where you left off.
- **Profile dashboard (`/profile`)**: sticky identity card with color-coded role badge, tabbed
  content (Info / My Nests / Settings), read-only onboarding data grouped by category, and an
  **Edit Profile slide-over** with optimistic updates + rollback.
- **Anchor application (`/profile/anchor-apply`)**: newcomers can apply to become local Anchors
  with a tag input for neighborhoods/languages and a pending-review success modal.
- **Settings**: notification toggles (localStorage), change-password form, and a delete-account
  danger zone — password change and deletion are UI-only until the backend endpoints land.

## 🎨 Design System

- Backgrounds: `slate-900` (main) · `slate-800` (cards) · `slate-950` (navbar/sidebar)
- Primary accent: `emerald-500` (buttons, active states, icons)
- Text: `slate-100` headings · `slate-300` body · `slate-400` muted
- Borders: `slate-700` · Errors: `rose-500` · Success: `emerald-400`
- Font: Inter (Google Fonts, loaded in `index.html`)

## 🧭 Routes

| Path                    | Guard   | Page                             |
| ----------------------- | ------- | -------------------------------- |
| `/login`                | public  | Login                            |
| `/register`             | public  | Register                         |
| `/onboarding`           | private | 7-step onboarding wizard         |
| `/dashboard`            | private | Dashboard placeholder (M3)       |
| `/profile`              | private | Profile dashboard (M2)           |
| `/profile/anchor-apply` | private | Anchor application (NEWCOMER only) |
| `/my-nest`              | private | Coming soon (M3)                 |
| `/messages`             | private | Coming soon (M4)                 |
| `*`                     | —       | 404 page                         |

`ProtectedRoute` redirects unauthenticated users to `/login` while remembering the intended URL in
router location state; after login the user is returned there.

## 🧩 What's Next (later modules)

- **Module 3** — Nests, matching, proposals
- **Module 4** — Nest home, members & messaging
- **Module 5** — City events & activities
