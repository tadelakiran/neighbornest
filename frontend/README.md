# 🏘️ NeighborNest — Frontend (Module 1: Authentication & Core Shell)

The React + TypeScript frontend for **NeighborNest** — a platform that matches newcomers in a city
into small curated groups (*Nests*) with local *Anchors*.

This module delivers the **Authentication & Core Shell**: login/register, JWT handling with
automatic refresh, the post-login app shell (navbar + sidebar), toasts, routing guards, and the
404/error surfaces. Dashboard, Profile, My Nest, and Messages are placeholders for later modules.

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
│   ├── ui/            # Button, Input, Card, Badge, Avatar, Spinner, Toast
│   ├── layout/        # Navbar, Sidebar, AppLayout, PublicLayout
│   └── auth/          # LoginForm, RegisterForm
├── pages/             # Login, Register, Dashboard, Profile, NotFound, ComingSoon
├── hooks/             # useAuth, useToast
├── stores/            # authStore (persisted), toastStore
├── services/          # api.ts (axios + interceptors), authService.ts
├── types/             # auth.types.ts (wire-accurate API contracts)
├── lib/               # utils.ts (cn, getErrorMessage), constants.ts
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
- A 404 from `/api/users/me` means the profile hasn't been created yet (Module 2) — the shell
  tolerates it silently.
- The password rule (uppercase + lowercase + digit + special) mirrors the backend `@Pattern`
  validation exactly (`PASSWORD_REGEX` in `src/lib/constants.ts`).

## 🎨 Design System

- Backgrounds: `slate-900` (main) · `slate-800` (cards) · `slate-950` (navbar/sidebar)
- Primary accent: `emerald-500` (buttons, active states, icons)
- Text: `slate-100` headings · `slate-300` body · `slate-400` muted
- Borders: `slate-700` · Errors: `rose-500` · Success: `emerald-400`
- Font: Inter (Google Fonts, loaded in `index.html`)

## 🧭 Routes

| Path         | Guard   | Page                         |
| ------------ | ------- | ---------------------------- |
| `/login`     | public  | Login                        |
| `/register`  | public  | Register                     |
| `/dashboard` | private | Dashboard placeholder (M3)   |
| `/profile`   | private | Profile placeholder (M2)     |
| `/my-nest`   | private | Coming soon (M3)             |
| `/messages`  | private | Coming soon (M4)             |
| `*`          | —       | 404 page                     |

`ProtectedRoute` redirects unauthenticated users to `/login` while remembering the intended URL in
router location state; after login the user is returned there.

## 🧩 What's Next (later modules)

- **Module 2** — Profile creation & onboarding (answers, lifestyle preferences)
- **Module 3** — Nests, matching, proposals
- **Module 4** — Messaging
- **Module 5** — City events & activities
