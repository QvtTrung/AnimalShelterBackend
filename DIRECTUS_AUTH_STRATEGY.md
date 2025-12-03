# Directus Authentication Strategy

## Overview

With properly configured Directus permissions for **Admin**, **User**, and **Public** roles, the backend uses a simplified authentication strategy:

- **Primary Client (`directus`)**: Authenticated users with proper role permissions
- **Admin Token (limited use)**: Only for specific system operations

## Two Directus Clients

### 1. `directus` - Authenticated User Client (PRIMARY)

**File:** `src/config/directus.ts`

```typescript
const directus = createDirectus(config.directus.url)
  .with(rest())
  .with(authentication("json"));
```

**Purpose:** Uses the logged-in user's JWT token (access_token)

- **Token Type:** JWT access token (expires in 15 minutes)
- **Refresh:** Has a refresh_token for getting new access tokens
- **Use Cases:**
  - All CRUD operations (create, read, update, delete)
  - User-specific queries
  - Dashboard analytics
  - Reports, rescues, adoptions, pets

**How Token is Set:**

- Auth middleware extracts Bearer token from Authorization header
- Sets it on the directus client: `directus.setToken(token)`
- Token persists for the request lifecycle

**Permissions:** Admin users have full access configured in Directus admin panel

### 2. `adminDirectus` - Admin Static Token (LIMITED USE)

**File:** `src/config/directus.ts`

```typescript
const adminDirectus = createDirectus(config.directus.url)
  .with(rest())
  .with(staticToken(config.directus.token || ""));
```

**Purpose:** System-level operations that bypass user permissions

- **Token Type:** Static token (never expires)
- **Use Cases (ONLY):**
  1. **User Registration** - Creating new users requires admin permissions
  2. **Notifications** - Cross-user notification access (reading/creating notifications for any user)

**Token Source:**

- Set in `.env` as `DIRECTUS_TOKEN`
- Generated in Directus admin panel (User Profile > Token)

### 3. `publicDirectus` - Not Used

Public unauthenticated access is not currently used in this project.

## Architecture Decisions

### Why Simplified to One Primary Client?

**Previous Problem:**

- We tried using `adminDirectus` for all READ operations to avoid token expiration
- This caused confusion and unnecessary complexity
- Lost audit trail for some operations

**Solution:**

- Configure proper Directus permissions for Admin role
- Use authenticated user token (`directus`) for ALL operations
- Users see "Token expired" and frontend handles refresh
- Only use `adminDirectus` where truly necessary

### BaseService Strategy

```typescript
export class BaseService<T> {
  protected sdk = directus;  // User token for ALL operations

  async findAll() {
    // Uses sdk with user permissions
    return await this.sdk.request(readItems(...));
  }

  async create(data) {
    // Uses sdk - tracks user_created
    return await this.sdk.request(createItem(...));
  }
}
```

### Special Cases

#### NotificationService

```typescript
export class NotificationService extends BaseService<DirectusNotification> {
  // Needs admin SDK for cross-user operations
  protected notificationSdk = adminDirectus;

  async createNotification(data) {
    // Create notification for ANY user (not just logged-in user)
    return await this.notificationSdk.request(
      createItem("notifications", data)
    );
  }
}
```

**Why?** Notifications are created by the system for other users, not by the user themselves.

#### AuthService Registration

```typescript
async register(payload) {
  // Temporarily use admin token to create user
  if (config.directus.token) {
    directus.setToken(config.directus.token);
  }

  // Create new user in 'users' collection (requires admin permission)
  await directus.request(createItem('users', userData));

  // Token is reset by next request's auth middleware
}
```

**Why?** Creating new users in the `users` collection requires admin permissions.

## Token Flow

### Request Lifecycle

1. **Request arrives** → Auth middleware extracts Bearer token
2. **Token set** → `directus.setToken(userToken)`
3. **Operation executes** → Uses user's permissions from Directus
4. **If token expired:**
   - Backend returns 401
   - Frontend catches error
   - Frontend calls `/auth/refresh` with refresh_token
   - Frontend gets new access_token
   - Frontend retries original request

### No Backend Auto-Refresh

Backend does NOT automatically refresh tokens because:

- Backend doesn't have the refresh_token (it's in frontend)
- Frontend manages its own token lifecycle
- Cleaner separation of concerns

## Directus Permissions Setup

### Admin Role Configuration

In Directus Admin Panel → Settings → Roles & Permissions → Admin:

**Collections to configure:**

- `users` - Full CRUD
- `reports` - Full CRUD
- `rescues` - Full CRUD
- `rescues_users` - Full CRUD
- `rescues_reports` - Full CRUD
- `adoptions` - Full CRUD
- `pets` - Full CRUD
- `pet_images` - Full CRUD
- `notifications` - Read only (system creates them)
- `directus_users` - Read access

**Field Permissions:**

- Enable `user_created` and `user_updated` tracking
- All fields readable and writable for admin

## Configuration

### Environment Variables

```bash
# Directus connection
DIRECTUS_URL=http://localhost:8055

# Admin token (only for registration & notifications)
DIRECTUS_TOKEN=your_static_admin_token_here

# Token expiration (configured in Directus)
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
```

### Directus Admin Setup

1. **Create Admin Role** with full permissions
2. **Generate Static Token:**
   - Go to Admin User Profile
   - Scroll to "Token" section
   - Click "Generate Token"
   - Copy token to `.env` as `DIRECTUS_TOKEN`
3. **Configure Token Expiration:**
   - Settings > Project Settings > Security
   - Set ACCESS_TOKEN_TTL=15m
   - Set REFRESH_TOKEN_TTL=7d

## Service Architecture

### Regular Services (Reports, Rescues, Pets, etc.)

```typescript
export class ReportService extends BaseService<Report> {
  // Uses inherited `sdk` (directus) for all operations
  // User permissions apply
}
```

### Dashboard Service

```typescript
export class DashboardService extends BaseService<any> {
  // Uses inherited `sdk` for analytics
  // Admin users can see all data
}
```

### Notification Service (Special Case)

```typescript
export class NotificationService extends BaseService<Notification> {
  protected notificationSdk = adminDirectus;

  // Uses admin SDK for cross-user notification operations
}
```

## Best Practices

### ✅ DO

- Use `sdk` (user token) for all regular CRUD operations
- Configure Directus permissions properly for each role
- Let frontend handle token refresh
- Use `adminDirectus` only for true system operations

### ❌ DON'T

- Don't use `adminDirectus` for regular queries
- Don't try to refresh tokens on backend
- Don't bypass Directus permissions unless absolutely necessary
- Don't store admin token in code (use environment variable)

## Troubleshooting

### Issue: "Token expired" errors

**Cause:** User's access token expired (15 minutes)
**Fix:** Frontend should catch 401 errors and refresh token automatically

### Issue: Permission denied on operations

**Cause:** Directus permissions not configured properly
**Fix:** Check Admin role permissions in Directus panel

### Issue: Can't create users during registration

**Cause:** Missing admin token or improper permissions
**Fix:** Verify `DIRECTUS_TOKEN` is set and valid

### Issue: TypeScript error - property conflict

**Cause:** Child service declares property with different visibility than parent
**Fix:** Use `protected` for properties that override parent class properties
