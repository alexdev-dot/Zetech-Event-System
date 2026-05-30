---
name: Security & Scalability Hardening
description: Decisions made during the comprehensive backend security + scalability pass; rules every new route must follow.
---

# Security & Scalability Rules

## JWT
- `JWT_SECRET` is now a required env var (128-char hex, shared environment). Backend calls `process.exit(1)` at startup if unset or < 32 chars.
- Token expiry reduced from 24h → 8h to limit breach exposure.

## Auth token cache (`authCache`)
- `NodeCache` with TTL=30s, keyed by last 40 chars of the JWT signature.
- **Why:** every authenticated request was hitting Supabase DB; at 10k+ concurrent students this is a bottleneck. Cache reduces DB round-trips by ~99%.
- **How to apply:** `authenticateToken` already uses it. If you invalidate a user (ban, delete), their cached token lasts up to 30s — this is the accepted tradeoff.

## Input sanitization
- `sanitizeStr(val, maxLen)` — strips null bytes, enforces max length. Use on ALL user-supplied strings before storing or querying.
- `isValidDate(s)` — strict YYYY-MM-DD regex, used on all date inputs.
- Field length limits (title 150, description 3000, location 200, category 100, time 20, imageUrl 500).

## Rate limiters
- `globalLimiter`: 2000 req/15min/IP (all routes)
- `authLimiter`: 10 req/15min/IP (login + register)
- `adminWriteLimiter`: 120 req/min/IP — apply to POST/PUT on events
- `eventActionLimiter`: 20 req/min/IP — apply to student event registration
- `socialActionLimiter`: 30 req/min/IP — apply to comments/reactions/votes
- `uploadLimiter`: 10 req/min/IP — apply to file upload endpoint

## Error responses
- Never include `error.message` in 500 responses — use generic messages only.
- Health endpoint returns 503 with generic message on DB failure (no `detail`).

## Admin password hashing
- If `password_hash` doesn't start with `$2` (not bcrypt), always deny login and log a `[Security]` warning. Never compare plaintext with `===` (timing attack).

## Socket.io
- `join(userId)` — validates userId is a positive integer; ignores invalid input.
- `join-club-leader(club)` — sanitizes club name to `[a-zA-Z0-9 \-_]` max 100 chars.
- Socket connection logs suppressed in production (`NODE_ENV !== 'production'`).

## JSON body limits
- `express.json({ limit: "100kb" })` — sufficient for all API payloads; file uploads use multipart.
