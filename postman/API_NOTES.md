# 📘 NeighborNest — API Notes & Reference

> Hand-written API notes extracted directly from the backend controllers (`backend/*/src/main/java/**/controller/`).
> Use these alongside Postman. All endpoints go through the **API Gateway** unless noted otherwise.

---

## 1. Overview

NeighborNest is a microservices platform that helps newcomers find compatible neighbors and form small community groups ("Nests").

### Service map & ports

| Service              | Port  | Route prefix          | Purpose                                  |
| -------------------- | ----- | --------------------- | ---------------------------------------- |
| **API Gateway**      | 8080  | `/` (everything)      | Single entry point, JWT check, routing   |
| Eureka (registry)    | 8761  | —                     | Service discovery                        |
| Auth Service         | 8081  | `/api/auth/**`        | Register, login, token management        |
| User Service         | 8082  | `/api/users/**`       | Profiles, onboarding, anchors, photos    |
| Matching Service     | 8083  | `/api/matching/**`    | Compatibility scoring, proposals         |
| Nest Service         | 8084  | `/api/nests/**`       | Nests, meetings, expenses, vibe checks   |
| Chat Service (REST)  | 8085  | `/api/chat/**`        | Chat history, conversations, receipts    |
| Chat Service (WS)    | 8085  | `/ws/chat/**`         | STOMP/SockJS realtime chat               |
| Notification Service | 8086  | `/api/notifications/**` | Inbox, preferences, email/SMS, admin   |

### Base URLs

```text
Gateway (use for everything):  http://localhost:8080
Direct service (debug only):   http://localhost:808X   (per-service port above)
WebSocket (STOMP/SockJS):      ws://localhost:8080/ws/chat
```

### Authentication flow (very important)

1. `POST /api/auth/register` → create account.
2. `POST /api/auth/login` → returns `accessToken` + `refreshToken`.
3. For **every protected request** send the header:

```
Authorization: Bearer <accessToken>
```

4. When the access token expires, `POST /api/auth/refresh` with the refresh token to get a new pair.

### Auth badges used below

| Badge | Meaning |
| ----- | ------- |
| 🔓 **Public** | No token needed |
| 🔒 **JWT** | Valid `Authorization: Bearer <token>` header required |
| 🔑 **ADMIN** | JWT required **and** user must have the `ADMIN` role |

---

## 2. Quick Reference (all endpoints)

| # | Method | Path | Auth |
| - | ------ | ---- | ---- |
| **Auth** | | | |
| 1 | POST | `/api/auth/register` | 🔓 |
| 2 | POST | `/api/auth/login` | 🔓 |
| 3 | POST | `/api/auth/refresh` | 🔓 |
| 4 | POST | `/api/auth/logout` | 🔒 |
| 5 | GET | `/api/auth/validate?token=` | 🔓 |
| **User profiles** | | | |
| 6 | POST | `/api/users/profile` | 🔒 |
| 7 | GET | `/api/users/me` | 🔒 |
| 8 | PUT | `/api/users/me` | 🔒 |
| 9 | DELETE | `/api/users/me` | 🔒 |
| 10 | POST | `/api/users/me/photo` (multipart) | 🔒 |
| 11 | GET | `/api/users/photo/{fileName}` | 🔓 |
| 12 | POST | `/api/users/onboarding` | 🔒 |
| 13 | GET | `/api/users/onboarding/status` | 🔒 |
| 14 | POST | `/api/users/anchor-apply` | 🔒 |
| 15 | GET | `/api/users/anchor-application` | 🔒 |
| 16 | GET | `/api/users/anchor-applications?status=` | 🔑 |
| 17 | PUT | `/api/users/anchor-applications/{applicationId}/review` | 🔑 |
| 18 | GET | `/api/users/{userId}/profile` | 🔒 |
| 19 | GET | `/api/users/ready-for-match` | 🔒 |
| **Nests** | | | |
| 20 | POST | `/api/nests` | 🔒 |
| 21 | GET | `/api/nests/{nestId}` | 🔒 |
| 22 | GET | `/api/nests/my-nests` | 🔒 |
| 23 | POST | `/api/nests/{nestId}/meetings` | 🔒 |
| 24 | GET | `/api/nests/{nestId}/meetings` | 🔒 |
| 25 | POST | `/api/nests/{nestId}/meetings/{meetingId}/complete` | 🔒 |
| 26 | POST | `/api/nests/{nestId}/meetings/{meetingId}/cancel` | 🔒 |
| 27 | POST | `/api/nests/{nestId}/expenses` | 🔒 |
| 28 | GET | `/api/nests/{nestId}/expenses` | 🔒 |
| 29 | PATCH | `/api/nests/{nestId}/expenses/{expenseId}/settle` | 🔒 |
| 30 | POST | `/api/nests/{nestId}/vibe-check` | 🔒 |
| 31 | GET | `/api/nests/{nestId}/vibe-check/status` | 🔒 |
| 32 | POST | `/api/nests/{nestId}/graduate` | 🔒 |
| 33 | POST | `/api/nests/{nestId}/disband` | 🔒 |
| 34 | POST | `/api/nests/{nestId}/leave` | 🔒 |
| 35 | DELETE | `/api/nests/{nestId}/members/{userId}` | 🔒 (Anchor) |
| **Matching** | | | |
| 36 | POST | `/api/matching/calculate/{userId}` | 🔒 |
| 37 | GET | `/api/matching/compatibles/{userId}` | 🔒 |
| 38 | POST | `/api/matching/propose` | 🔒 |
| 39 | POST | `/api/matching/proposals/{proposalId}/respond` | 🔒 |
| 40 | GET | `/api/matching/proposals/pending/{userId}` | 🔒 |
| 41 | POST | `/api/matching/execute/{proposalId}` | 🔒 |
| **Chat (REST)** | | | |
| 42 | GET | `/api/chat/nests/{nestId}/messages` | 🔒 |
| 43 | GET | `/api/chat/nests/{nestId}/members/online` | 🔒 |
| 44 | POST | `/api/chat/dm/start` | 🔒 |
| 45 | GET | `/api/chat/dm/conversations` | 🔒 |
| 46 | GET | `/api/chat/dm/{conversationId}/messages` | 🔒 |
| 47 | POST | `/api/chat/messages/read` | 🔒 |
| **Chat (WebSocket/STOMP)** | | | |
| 48 | SEND | `/app/chat/nest/{nestId}/send` → `/topic/nest.{nestId}.messages` | 🔒 |
| 49 | SEND | `/app/chat/dm/{conversationId}/send` → `/queue/user/{id}/dm` | 🔒 |
| 50 | SEND | `/app/chat/nest/{nestId}/typing` → `/topic/nest.{nestId}.typing` | 🔒 |
| 51 | SEND | `/app/chat/dm/{conversationId}/typing` → `/queue/user/{id}/typing` | 🔒 |
| 52 | SEND | `/app/chat/read` → read-receipt updates | 🔒 |
| **Notifications** | | | |
| 53 | GET | `/api/notifications/me?page=&size=` | 🔒 |
| 54 | GET | `/api/notifications/me/unread-count` | 🔒 |
| 55 | PUT | `/api/notifications/{notificationId}/read` | 🔒 |
| 56 | PUT | `/api/notifications/me/read-all` | 🔒 |
| 57 | GET | `/api/notifications/me/preferences` | 🔒 |
| 58 | PUT | `/api/notifications/me/preferences` | 🔒 |
| 59 | POST | `/api/notifications/send` | 🔑 |
| 60 | GET | `/api/notifications/templates` | 🔒 |
| 61 | POST | `/api/notifications/templates` | 🔑 |
| 62 | GET | `/api/notifications/stats` | 🔑 |
| **Gateway fallback** | | | |
| 63 | GET | `/fallback/{service}` | 🔓 |

---

## 3. Auth Service — `/api/auth`

### 1. POST `/api/auth/register` — Register a new user — 🔓 Public
Creates a new account (role `NEWCOMER`).

**Body:**
```json
{
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "password": "Pass@123"
}
```
- `fullName`: 2–100 chars (required)
- `email`: valid email, max 255 (required)
- `password`: 8–128 chars; must contain uppercase + lowercase + digit + special char (required)

**Responses:** `201` user created · `400` invalid input · `409` email already registered

---

### 2. POST `/api/auth/login` — Login — 🔓 Public
Authenticates and returns JWT access + refresh tokens.

**Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "Pass@123"
}
```

**Responses:** `200` `{ "accessToken": "...", "refreshToken": "..." }` · `400` invalid input · `401` invalid credentials

---

### 3. POST `/api/auth/refresh` — Refresh access token — 🔓 Public
Exchanges a valid refresh token for a new token pair (refresh token is rotated).

**Body:**
```json
{ "refreshToken": "550e8400-e29b-41d4-a716-446655440000" }
```

**Responses:** `200` new `{ accessToken, refreshToken }` · `400` invalid input · `401` invalid/expired refresh token

---

### 4. POST `/api/auth/logout` — Logout — 🔒 JWT
Invalidates the refresh token (body optional).

**Body (optional):**
```json
{ "refreshToken": "550e8400-e29b-41d4-a716-446655440000" }
```

**Responses:** `200` `"Logout successful"` · `401` unauthorized

---

### 5. GET `/api/auth/validate?token={jwt}` — Validate a JWT — 🔓 Public
Used internally by other services to confirm token ownership.

**Query param:** `token` — raw JWT

**Responses:** `200` `{ "valid": true/false, "userId": ..., "email": ..., "role": ... }`
(Invalid/expired tokens return `valid: false` with `200` — not an error.)

---

## 4. User Service — `/api/users` (profiles & onboarding)

> Note: the gateway routes `/api/users/**` to the **user-service**. (auth-service defines a `GET /api/users/me` too, but the gateway sends this prefix to user-service.)

### 6. POST `/api/users/profile` — Create user profile — 🔒 JWT
Creates a profile for the authenticated user. `authUserId` is taken from the JWT (cannot be spoofed).

**Body:**
```json
{
  "fullName": "John Doe",
  "profilePhotoUrl": "https://storage.example.com/photos/user1.jpg",
  "city": "San Francisco",
  "neighborhood": "Mission District",
  "yearsInCity": 1,
  "occupation": "Software Engineer",
  "role": "NEWCOMER"
}
```
- Required: `fullName`, `city`

**Responses:** `201` profile created · `400` invalid input · `409` profile already exists

---

### 7. GET `/api/users/me` — Get current profile — 🔒 JWT
Returns the full profile of the authenticated user **including onboarding answers**.

**Responses:** `200` profile · `401` unauthorized · `404` profile not found

---

### 8. PUT `/api/users/me` — Update current profile — 🔒 JWT
Partial update — all fields optional.

**Body (any subset):**
```json
{
  "fullName": "John Doe",
  "profilePhotoUrl": "https://storage.example.com/photos/user1.jpg",
  "city": "San Francisco",
  "neighborhood": "Noe Valley",
  "yearsInCity": 2,
  "occupation": "Product Manager",
  "workType": "FULL_TIME",
  "personalityType": "AMBIVERT",
  "schedulePreference": "FLEXIBLE",
  "socialGoal": "FRIENDSHIP",
  "budgetLevel": "MEDIUM",
  "role": "NEWCOMER"
}
```

**Responses:** `200` updated profile · `400` invalid input · `404` profile not found

---

### 9. DELETE `/api/users/me` — Delete profile — 🔒 JWT
Deletes the profile + onboarding answers + anchor applications.

**Responses:** `204` no content · `404` profile not found

---

### 10. POST `/api/users/me/photo` — Upload profile photo — 🔒 JWT
`Content-Type: multipart/form-data` with a `file` part (JPG, PNG, WEBP, GIF; max 5 MB).

**Responses:** `200` updated profile · `400` invalid/unsupported image · `404` profile not found

---

### 11. GET `/api/users/photo/{fileName}` — Get a profile photo — 🔓 Public
**Path param:** `fileName`

**Responses:** `200` image resource · `404` photo not found

---

### 12. POST `/api/users/onboarding` — Submit onboarding answers — 🔒 JWT
Stores answers and marks the profile as onboarded (needed before matching).

**Body:**
```json
{
  "answers": [
    { "questionKey": "values_adventure", "answerValue": "5", "weight": 3 },
    { "questionKey": "lifestyle_social", "answerValue": "FRIENDSHIP", "weight": 4 }
  ]
}
```
Each answer: `questionKey` (required), `answerValue` (required), `weight` 1–5 (required).

**Responses:** `200` updated profile · `400` invalid input · `404` profile not found

---

### 13. GET `/api/users/onboarding/status` — Onboarding status — 🔒 JWT

**Responses:** `200` `{ "onboarded": true/false, ... }` · `404` profile not found

---

### 14. POST `/api/users/anchor-apply` — Apply to become an Anchor — 🔒 JWT
**Body:**
```json
{
  "yearsInCity": 5,
  "neighborhoodsKnown": "Mission, Noe Valley, Castro",
  "languagesSpoken": "English, Spanish",
  "experience": "Ran a local book club for 3 years",
  "availability": "Evenings and weekends"
}
```
- Required: `yearsInCity` (≥ 1), `neighborhoodsKnown`, `experience`

**Responses:** `201` application created · `400` invalid input or onboarding incomplete · `404` profile not found

---

### 15. GET `/api/users/anchor-application` — My anchor application — 🔒 JWT
Returns the caller's most recent application.

**Responses:** `200` application · `404` no application found

---

### 16. GET `/api/users/anchor-applications?status=PENDING` — List applications — 🔑 ADMIN
**Optional query param:** `status` = `PENDING` | `APPROVED` | `REJECTED`

**Responses:** `200` list · `403` forbidden (ADMIN required)

---

### 17. PUT `/api/users/anchor-applications/{applicationId}/review` — Review application — 🔑 ADMIN
Approves/rejects and promotes the applicant to `ANCHOR` on approval.

**Path param:** `applicationId`
**Body:**
```json
{ "decision": "APPROVE", "note": "Strong local knowledge" }
```
`decision`: `APPROVE` | `REJECT` (required) · `note`: optional, max 1000 chars

**Responses:** `200` updated application · `400` invalid decision / already reviewed · `403` forbidden · `404` not found

---

### 18. GET `/api/users/{userId}/profile` — Public profile — 🔒 JWT
**Path param:** `userId` — target profile ID

**Responses:** `200` profile · `404` not found

---

### 19. GET `/api/users/ready-for-match` — Match-ready users — 🔒 JWT
Returns all onboarded users eligible for matching (consumed by matching-service).

**Responses:** `200` `[UserMatchResponse, ...]`

---

## 5. Nest Service — `/api/nests`

### 20. POST `/api/nests` — Create Nest — 🔒 JWT
Creates a Nest from an accepted proposal (primarily called by matching-service via Feign).

**Body:**
```json
{
  "name": "Mission Mates",
  "city": "San Francisco",
  "memberUserIds": [1, 2, 3],
  "anchorUserIds": [4]
}
```
- Required: `name`, `city`, `memberUserIds` (≥ 1)

**Responses:** `201` Nest created · `400` invalid input

---

### 21. GET `/api/nests/{nestId}` — Get Nest details — 🔒 JWT
**Path param:** `nestId`

**Responses:** `200` Nest + members · `404` not found

---

### 22. GET `/api/nests/my-nests` — My Nests — 🔒 JWT
Returns all active or graduated Nests the user belongs to.

**Responses:** `200` `[NestResponse, ...]`

---

### 23. POST `/api/nests/{nestId}/meetings` — Schedule meeting — 🔒 JWT (member)
**Path param:** `nestId`
**Body:**
```json
{
  "scheduledAt": "2025-02-01T18:30:00",
  "venueName": "Blue Bottle Coffee",
  "venueAddress": "315 Linden St, San Francisco",
  "activityType": "Coffee & Chat",
  "description": "Weekly catch-up over coffee"
}
```
- Required: `scheduledAt` (future), `venueName`, `activityType`

**Responses:** `201` meeting created · `400` invalid input · `403` not a member · `404` nest not found

---

### 24. GET `/api/nests/{nestId}/meetings` — List meetings — 🔒 JWT (member)
**Path param:** `nestId`
**Responses:** `200` `[MeetingResponse, ...]` · `403` not a member

---

### 25. POST `/api/nests/{nestId}/meetings/{meetingId}/complete` — Complete meeting — 🔒 JWT (member)
**Path params:** `nestId`, `meetingId`
**Responses:** `200` updated meeting · `403` not a member · `404` not found · `409` meeting not scheduled

---

### 26. POST `/api/nests/{nestId}/meetings/{meetingId}/cancel` — Cancel meeting — 🔒 JWT (member)
**Path params:** `nestId`, `meetingId`
**Responses:** `200` updated meeting · `403` not a member · `404` not found · `409` meeting not scheduled

---

### 27. POST `/api/nests/{nestId}/expenses` — Create expense — 🔒 JWT (payer/member)
**Path param:** `nestId`
**Body (EQUAL split):**
```json
{
  "amount": 100.00,
  "description": "Group dinner",
  "splitType": "EQUAL"
}
```
**Body (CUSTOM split):**
```json
{
  "amount": 100.00,
  "description": "Group dinner",
  "splitType": "CUSTOM",
  "splits": [
    { "userId": 7, "amountOwed": 60.00 },
    { "userId": 8, "amountOwed": 40.00 }
  ]
}
```
`splitType`: `EQUAL` | `CUSTOM` (required) · `splits` required when CUSTOM.

**Responses:** `201` expense created · `400` invalid input/splits · `404` nest not found

---

### 28. GET `/api/nests/{nestId}/expenses` — List expenses — 🔒 JWT (member)
**Path param:** `nestId`
**Responses:** `200` `[ExpenseResponse, ...]` · `403` not a member

---

### 29. PATCH `/api/nests/{nestId}/expenses/{expenseId}/settle` — Settle my split — 🔒 JWT
Marks the caller's share of an expense as settled.
**Path params:** `nestId`, `expenseId`
**Responses:** `200` updated expense · `404` expense or split not found

---

### 30. POST `/api/nests/{nestId}/vibe-check` — Submit vibe check — 🔒 JWT (member)
**Path param:** `nestId`
**Body:**
```json
{
  "connectionScore": 8,
  "comfortScore": 9,
  "feedback": "Loving the group energy!"
}
```
Scores are 1–10 (required); `feedback` optional (max 2000).

**Responses:** `201` vibe check submitted · `400` invalid input · `404` nest not found

---

### 31. GET `/api/nests/{nestId}/vibe-check/status` — Vibe check status — 🔒 JWT (member)
Aggregated vibe check scores for a Nest.
**Path param:** `nestId`
**Responses:** `200` aggregated status · `403` not a member · `404` not found

---

### 32. POST `/api/nests/{nestId}/graduate` — Graduate Nest — 🔒 JWT
Marks the Nest graduated and publishes a graduation event.
**Path param:** `nestId`
**Responses:** `200` updated Nest · `404` not found · `409` nest not active

---

### 33. POST `/api/nests/{nestId}/disband` — Disband Nest — 🔒 JWT
**Path param:** `nestId`
**Responses:** `200` updated Nest · `404` not found · `409` nest already ended

---

### 34. POST `/api/nests/{nestId}/leave` — Leave Nest — 🔒 JWT (active member)
**Path param:** `nestId`
**Responses:** `200` updated Nest · `403` not an active member · `404` not found · `409` nest already ended

---

### 35. DELETE `/api/nests/{nestId}/members/{userId}` — Remove member — 🔒 JWT (Anchor only)
**Path params:** `nestId`, `userId` (profile ID of the member to remove)
**Responses:** `200` updated Nest · `403` not an anchor (or removing yourself) · `404` nest/member not found

---

## 6. Matching Service — `/api/matching`

### 36. POST `/api/matching/calculate/{userId}` — Calculate compatibility scores — 🔒 JWT
Computes scores for the user against all eligible users.
**Path param:** `userId` (profile ID)
**Responses:** `200` count of scores computed (number) · `400` user not eligible · `503` user-service unavailable

---

### 37. GET `/api/matching/compatibles/{userId}` — Top compatible users — 🔒 JWT
**Path param:** `userId`
**Responses:** `200` `[{ userId, score, ... }, ...]` ordered by score

---

### 38. POST `/api/matching/propose` — Create Nest proposal — 🔒 JWT
**Body:**
```json
{
  "userIds": [1, 2, 3, 4, 5],
  "anchorIds": [1]
}
```
- `userIds`: **5–8 people** total (required)
- `anchorIds`: **1–2 anchors** (required)

**Responses:** `201` proposal created · `400` invalid input

---

### 39. POST `/api/matching/proposals/{proposalId}/respond` — Respond to proposal — 🔒 JWT
**Path param:** `proposalId`
**Body:**
```json
{ "accept": true }
```
**Responses:** `200` updated proposal · `400` proposal closed/expired or user not a member

---

### 40. GET `/api/matching/proposals/pending/{userId}` — Pending proposals — 🔒 JWT
**Path param:** `userId` (profile ID)
**Responses:** `200` `[MatchProposalResponse, ...]`

---

### 41. POST `/api/matching/execute/{proposalId}` — Execute accepted proposal — 🔒 JWT
Triggers Nest creation in the nest-service for a fully accepted proposal.
**Path param:** `proposalId`
**Responses:** `200` `{ proposalId, nestId, ... }` · `400` proposal not in `ACCEPTED` status · `503` nest-service unavailable

---

## 7. Chat Service — REST (`/api/chat`)

> Pagination: page size defaults to **50**, sorted newest first (`createdAt` DESC). Use `?page=0&size=50&sort=createdAt,desc`.

### 42. GET `/api/chat/nests/{nestId}/messages` — Nest chat history — 🔒 JWT (member)
Returns a paginated history of a Nest's group messages; the fetched page is marked as read for the caller.
**Path param:** `nestId`
**Query params:** `page` (0-based), `size` (default 50), `sort`
**Responses:** `200` `Page<MessageResponse>` · `403` not an active member · `503` nest-service unavailable

---

### 43. GET `/api/chat/nests/{nestId}/members/online` — Nest members (online placeholder) — 🔒 JWT (member)
Returns all active member profile IDs (Redis presence tracking is planned; for now returns all active members).
**Path param:** `nestId`
**Responses:** `200` `[profileId, ...]` · `403` not a member · `503` nest-service unavailable

---

### 44. POST `/api/chat/dm/start` — Start a DM conversation — 🔒 JWT
Finds or creates the unique conversation with the participant. Only unlocked for users who shared an active or graduated Nest.
**Body:**
```json
{ "participantId": 12 }
```
`participantId`: user-service profile ID (required).

**Responses:** `201` conversation created/fetched · `400` invalid participant or self-conversation · `403` users never shared a Nest · `503` nest-service unavailable

---

### 45. GET `/api/chat/dm/conversations` — My conversations — 🔒 JWT
Returns all DM conversations with last-message preview + unread counts.
**Responses:** `200` `[ConversationResponse, ...]`

---

### 46. GET `/api/chat/dm/{conversationId}/messages` — DM history — 🔒 JWT (participant)
Returns a paginated history; the fetched page is marked as read.
**Path param:** `conversationId`
**Query params:** `page`, `size`, `sort`
**Responses:** `200` `Page<MessageResponse>` · `403` not a participant · `404` conversation not found

---

### 47. POST `/api/chat/messages/read` — Mark messages as read — 🔒 JWT
**Body:**
```json
{ "messageIds": [101, 102] }
```
**Responses:** `200` `{ "markedCount": 2 }` · `400` messageIds missing/empty

---

## 8. Chat Service — WebSocket / STOMP

- **Endpoint:** `ws://localhost:8080/ws/chat` (SockJS fallback enabled — the gateway routes `/ws/chat/**`).
- Auth: send the JWT on the STOMP `CONNECT` frame (handled by `JwtChannelInterceptor`).
- Prefixes: `/app` = client→server, `/topic` = group broadcasts, `/queue/user/` = private queues.
- The server derives the sender from the authenticated session — **never trust `senderId` in payloads**.

### 48. Group message — send + subscribe
- **Send to:** `/app/chat/nest/{nestId}/send`
- **Subscribe to:** `/topic/nest.{nestId}.messages` (to receive)
- **Payload:**
```json
{
  "roomType": "NEST_GROUP",
  "nestId": 3,
  "content": "Coffee at Blue Bottle this Saturday?",
  "messageType": "TEXT"
}
```
`content` required (max 2000 chars, HTML stripped server-side).

### 49. Direct message — send + subscribe
- **Send to:** `/app/chat/dm/{conversationId}/send`
- **Receive on:** `/queue/user/{profileId}/dm` (both participants)
- **Payload:**
```json
{
  "roomType": "DIRECT",
  "conversationId": 5,
  "content": "See you Saturday!",
  "messageType": "TEXT"
}
```

### 50. Group typing indicator
- **Send to:** `/app/chat/nest/{nestId}/typing`
- **Receive on:** `/topic/nest.{nestId}.typing`
- **Payload:**
```json
{ "roomType": "NEST_GROUP", "nestId": 3, "isTyping": true }
```

### 51. DM typing indicator
- **Send to:** `/app/chat/dm/{conversationId}/typing`
- **Receive on:** `/queue/user/{profileId}/typing`
- **Payload:**
```json
{ "roomType": "DIRECT", "conversationId": 5, "isTyping": true }
```

### 52. Mark read (real-time)
- **Send to:** `/app/chat/read`
- **Payload:** `{ "messageIds": [101, 102] }`
- Receives read-receipt updates on the room's topic/queue.

---

## 9. Notification Service — `/api/notifications`

> Pagination: default `size` = **20**, capped at **100**.

### 53. GET `/api/notifications/me?page=0&size=20` — My notifications — 🔒 JWT
Newest first.
**Query params:** `page` (default 0), `size` (default 20, max 100)
**Responses:** `200` `Page<NotificationResponse>` · `400` profile could not be resolved

---

### 54. GET `/api/notifications/me/unread-count` — Unread count — 🔒 JWT
**Responses:** `200` `{ total, unread, read }`

---

### 55. PUT `/api/notifications/{notificationId}/read` — Mark one read — 🔒 JWT
**Path param:** `notificationId`
**Responses:** `200` updated notification · `404` not found

---

### 56. PUT `/api/notifications/me/read-all` — Mark all read — 🔒 JWT
**Responses:** `200` updated counts `{ total, unread, read }`

---

### 57. GET `/api/notifications/me/preferences` — My preferences — 🔒 JWT
Defaults are created on first read.
**Responses:** `200` preferences

---

### 58. PUT `/api/notifications/me/preferences` — Update preferences — 🔒 JWT
Partial update — only non-null fields are applied.
**Body (any subset):**
```json
{
  "emailEnabled": true,
  "smsEnabled": false,
  "pushEnabled": true,
  "meetingReminders": true,
  "expenseAlerts": true,
  "vibeCheckReminders": true,
  "chatNotifications": true
}
```
**Responses:** `200` updated preferences

---

### 59. POST `/api/notifications/send` — Send manual notification — 🔑 ADMIN
**Body:**
```json
{
  "userId": 7,
  "type": "SYSTEM",
  "title": "Nest update",
  "message": "Your Nest meeting moved to Friday.",
  "channel": "EMAIL",
  "relatedEntityType": "NEST",
  "relatedEntityId": 3
}
```
- Required: `userId`, `type`, `title`, `message`, `channel`

**Responses:** `201` notification created & dispatched · `400` recipient preferences suppress channel/category · `403` ADMIN required

---

### 60. GET `/api/notifications/templates` — List email templates — 🔒 JWT
**Responses:** `200` `[EmailTemplateResponse, ...]`

---

### 61. POST `/api/notifications/templates` — Create email template — 🔑 ADMIN
Overrides the built-in classpath template for a key.
**Body:**
```json
{
  "templateKey": "nest-welcome",
  "subject": "Welcome to {nestName}!",
  "bodyHtml": "<p>Hi {firstName}, welcome to {nestName}!</p>",
  "bodyText": "Hi {firstName}, welcome to {nestName}!",
  "variables": "{ \"firstName\": \"string\" }"
}
```
- Required: `templateKey`, `subject`, `bodyHtml`, `bodyText`

**Responses:** `201` template created · `400` key already exists · `403` ADMIN required

---

### 62. GET `/api/notifications/stats` — Notification stats (today) — 🔑 ADMIN
**Responses:** `200` stats by type and channel · `403` ADMIN required

---

## 10. API Gateway — fallback

### 63. GET `/fallback/{service}` — Circuit-breaker fallback — 🔓 Public
Returned automatically by the gateway when a downstream service is unavailable (you usually won't call this directly).
**Path param:** `service` (e.g. `auth`, `user`, `matching`, `nest`, `chat`, `notification`)
**Responses:** `503` `{ timestamp, status, error, message, service }`

---

## 11. Common Response Codes

| Code | Meaning |
| ---- | ------- |
| 200 | OK |
| 201 | Created |
| 204 | No content |
| 400 | Invalid input / bad request |
| 401 | Unauthorized (missing/invalid JWT) |
| 403 | Forbidden (authenticated but wrong role / not a member) |
| 404 | Resource not found |
| 409 | Conflict (duplicate / invalid state transition) |
| 503 | Service unavailable (downstream or circuit breaker) |

---

## 12. Suggested End-to-End Test Flow (Postman)

1. **Register** → `POST /api/auth/register`
2. **Login** → `POST /api/auth/login` → copy `accessToken`
3. Set Postman environment variable `token` = access token; add header `Authorization: Bearer {{token}}`
4. **Create profile** → `POST /api/users/profile`
5. **Submit onboarding** → `POST /api/users/onboarding`
6. **Calculate scores** → `POST /api/matching/calculate/{userId}`
7. **Get compatibles** → `GET /api/matching/compatibles/{userId}`
8. **Propose** → `POST /api/matching/propose` (5–8 user IDs, 1–2 anchors)
9. **Respond** (each member) → `POST /api/matching/proposals/{proposalId}/respond` `{ "accept": true }`
10. **Execute** → `POST /api/matching/execute/{proposalId}` → returns `nestId`
11. **Nest ops** → meetings, expenses, vibe checks under `/api/nests/{nestId}/...`
12. **Chat** → subscribe `ws://localhost:8080/ws/chat`, then REST history + STOMP sends
13. **Notifications** → `GET /api/notifications/me`

---

*Generated from backend controllers on 2026-08-08 · NeighborNest Team*
