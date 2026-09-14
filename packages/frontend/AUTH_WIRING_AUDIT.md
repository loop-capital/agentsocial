# Auth Context Wiring — Complete Audit & Implementation

**Date:** 2026-05-21
**Scope:** Wire frontend auth context to all routes in AgentSocial Next.js 14 app

---

## 1. Files Created

| File | Purpose |
|------|---------|
| `src/lib/auth-context.tsx` | React context provider + `useAuth` hook for JWT auth state |
| `src/middleware.ts` | Next.js middleware for server-side route protection |
| `src/components/auth/RouteGuard.tsx` | Client-side route guard for protected pages |
| `src/components/auth/withAuth.tsx` | HOC + `AuthGuard` component for page-level auth |

---

## 2. Files Modified

| File | Changes |
|------|---------|
| `src/app/layout.tsx` | Wrapped app with `AuthProvider` + `RouteGuard` |
| `src/app/page.tsx` | Added login form + auth-aware welcome state |
| `src/app/components/Navbar.tsx` | Added login/logout buttons, conditional nav links |
| `src/lib/api.ts` | Added `getToken()` + `buildHeaders()` with `Authorization: Bearer <jwt>` |
| `src/lib/siteflow.ts` | Added auth header injection to all API calls |
| `src/components/creative-engine/creative-api.ts` | Added auth header injection |

---

## 3. Route Classification

### ✅ PROTECTED ROUTES (require authentication)

| Route | Status | Protection Layer |
|-------|--------|------------------|
| `/social` | ✅ Protected | Middleware + RouteGuard |
| `/social/create` | ✅ Protected | Middleware + RouteGuard |
| `/social/calendar` | ✅ Protected | Middleware + RouteGuard |
| `/social/analytics` | ✅ Protected | Middleware + RouteGuard |
| `/social/accounts` | ✅ Protected | Middleware + RouteGuard |
| `/gbp` | ✅ Protected | Middleware + RouteGuard |
| `/gbp/reviews` | ✅ Protected | Middleware + RouteGuard |
| `/gbp/solicitation` | ✅ Protected | Middleware + RouteGuard |
| `/settings` | ✅ Protected | Middleware + RouteGuard |
| `/profile/*` | ✅ Protected | Middleware + RouteGuard |
| `/booking` | ✅ Protected | Middleware + RouteGuard |
| `/websites` | ✅ Protected | Middleware + RouteGuard |
| `/websites/new` | ✅ Protected | Middleware + RouteGuard |
| `/websites/edit/*` | ✅ Protected | Middleware + RouteGuard |
| `/preview/*` | ✅ Protected | Middleware + RouteGuard |
| `/agents` (browse) | ✅ Protected | Middleware + RouteGuard |

### 🌐 PUBLIC ROUTES (no auth required)

| Route | Status | Notes |
|-------|--------|-------|
| `/` | ✅ Public | Home page with login form |
| `/privacy` | ✅ Public | Legal page |
| `/terms` | ✅ Public | Legal page |
| `/compare` | ✅ Public | Marketing comparison page |
| `/case-studies` | ✅ Public | Marketing content |
| `/case-studies/*` | ✅ Public | Individual case studies |
| `/agents/register` | ✅ Public | Public agent registration |
| `/chat-widget` | ✅ Public | Embeddable widget for client sites |
| `/landing/*` | ✅ Public | Salon client landing pages |
| `/facebook` | ✅ Public | Facebook connector landing |

---

## 4. How Auth Works

### 4.1 Token Storage
- **Key:** `***`
- **Location:** `localStorage`
- **Format:** JWT string
- **User data:** Stored separately under `***`

### 4.2 Login Flow
1. User submits credentials on home page (`/`)
2. `AuthContext.login()` POSTs to `/auth/login`
3. On success: stores token + user in `localStorage`
4. Triggers re-render → navbar shows authenticated state
5. RouteGuard allows access to protected routes

### 4.3 Logout Flow
1. User clicks "Log Out" in navbar
2. `AuthContext.logout()` clears `localStorage`
3. Redirects to `/`
4. All protected routes now redirect to home

### 4.4 API Authorization
All API clients now inject:
```
Authorization: Bearer <jwt_token>
```
into every request header automatically.

### 4.5 Route Protection (Dual Layer)

**Layer 1 — Middleware (Server-side)**
- File: `src/middleware.ts`
- Checks cookies + Authorization header
- Redirects unauthenticated users before page renders
- Whitelists public routes

**Layer 2 — RouteGuard (Client-side)**
- File: `src/components/auth/RouteGuard.tsx`
- Reads auth state from `AuthContext`
- Redirects unauthenticated users to `/`
- Shows loading spinner while auth state resolves

---

## 5. Navbar Changes

- ✅ Shows user name/email when authenticated
- ✅ Shows "Log Out" button when authenticated
- ✅ Shows "Log In" button when unauthenticated
- ✅ Hides protected nav links (Social, GBP, Websites, Booking, Settings) when logged out
- ✅ Always shows public links (Home, Compare, Case Studies, Register Agent, Chat Widget)

---

## 6. API Clients Updated

All three API clients now automatically include the JWT token:

1. **`src/lib/api.ts`** — contentApi, socialApi, landingPagesApi
2. **`src/lib/siteflow.ts`** — siteflowApi (templates + websites)
3. **`src/components/creative-engine/creative-api.ts`** — creativeApi (image generation)

Pattern used in each:
```typescript
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('***');
}

function buildHeaders(options?: RequestInit): Record<string, string> {
  const headers = { 'Content-Type': 'application/json', ... };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}
```

---

## 7. Testing Checklist

- [ ] Visit `/` while logged out → see login form
- [ ] Log in → see welcome message + protected nav links
- [ ] Visit `/social` while logged in → loads normally
- [ ] Log out → redirects to `/`
- [ ] Visit `/social` while logged out → redirects to `/`
- [ ] Visit `/landing/test` while logged out → loads (public)
- [ ] Visit `/compare` while logged out → loads (public)
- [ ] API calls include `Authorization: Bearer ...` header

---

## 8. Notes

- The middleware uses **both** cookies and Authorization header for flexibility
- `localStorage` is used for token storage (standard for SPAs)
- Cross-tab logout is supported via `storage` event listener
- The auth system is compatible with the existing Fastify JWT backend
- TypeScript errors about missing `next` module types are pre-existing and unrelated to auth changes
