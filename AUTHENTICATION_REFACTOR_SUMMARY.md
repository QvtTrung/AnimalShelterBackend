# Authentication Refactor Summary

## Changes Made

### Problem Statement

The previous architecture used `adminDirectus` (static admin token) for ALL read operations to avoid token expiration issues. This was unnecessary because:

1. Directus permissions are properly configured for Admin role
2. It added complexity and confusion
3. TypeScript errors from property visibility conflicts
4. Token expiration should be handled by frontend, not avoided

### Solution

Simplified to use authenticated user tokens (`directus`) for all regular operations, with `adminDirectus` reserved only for true system-level operations.

## Files Modified

### 1. `base.service.ts`

**Before:**

```typescript
export class BaseService<T> {
  protected sdk = directus;
  protected adminSdk = adminDirectus;  // Used for all reads

  async findAll() {
    return await this.adminSdk.request(readItems(...));
  }
}
```

**After:**

```typescript
export class BaseService<T> {
  protected sdk = directus;  // Used for ALL operations

  async findAll() {
    return await this.sdk.request(readItems(...));
  }
}
```

**Rationale:** Admin users have proper permissions in Directus to read all data.

### 2. `dashboard.service.ts`

**Before:**

```typescript
export class DashboardService extends BaseService<any> {
  private adminSdk = adminDirectus;  // ❌ TypeScript error

  async getUserStats() {
    return await this.adminSdk.request(...);
  }
}
```

**After:**

```typescript
export class DashboardService extends BaseService<any> {
  // Uses inherited 'sdk' from BaseService

  async getUserStats() {
    return await this.sdk.request(...);
  }
}
```

**Changes:** 28 occurrences of `this.adminSdk.request` → `this.sdk.request`

### 3. `rescue.service.ts`

**Before:**

```typescript
async findAll() {
  const items = await this.adminSdk.request(readItems(...));
}
```

**After:**

```typescript
async findAll() {
  const items = await this.sdk.request(readItems(...));
}
```

**Changes:** All read operations now use inherited `sdk` from BaseService.

### 4. `notification.service.ts` (Special Case)

**Before:**

```typescript
export class NotificationService extends BaseService<Notification> {
  private adminSdk = adminDirectus; // ❌ TypeScript error
}
```

**After:**

```typescript
export class NotificationService extends BaseService<Notification> {
  protected notificationSdk = adminDirectus; // ✅ Different name, proper visibility
}
```

**Rationale:** Notifications require admin SDK because:

- Created by system for ANY user (not by the user themselves)
- Need cross-user read access (admins viewing all notifications)
- True system-level operation

**Why keep admin token here?**

- Notification creation: `notificationService.createNotification({ user_id: otherUserId })`
- This creates a notification FOR another user, not BY the logged-in user
- Requires admin privileges to bypass "you can only create for yourself" restriction

### 5. `notification.controller.ts`

**Before:**

```typescript
import { directus, adminDirectus } from "../config/directus";
```

**After:**

```typescript
import { directus } from "../config/directus";
```

**Rationale:** Controller doesn't use `adminDirectus`, only imported unnecessarily.

### 6. `auth.service.ts`

**No changes needed.** Already uses admin token correctly:

```typescript
async register(payload) {
  if (config.directus.token) {
    directus.setToken(config.directus.token);  // Temporarily use admin token
  }

  // Create user (requires admin permission)
  await directus.request(createItem('users', userData));

  // Token reset on next request
}
```

This is the ONLY other legitimate use of admin token.

## Current `adminDirectus` Usage

| Service                | Uses Admin Token | Reason                            |
| ---------------------- | ---------------- | --------------------------------- |
| BaseService            | ❌ No            | User permissions sufficient       |
| DashboardService       | ❌ No            | Admins can see all data           |
| RescueService          | ❌ No            | Inherits from BaseService         |
| ReportService          | ❌ No            | Inherits from BaseService         |
| PetService             | ❌ No            | Inherits from BaseService         |
| NotificationService    | ✅ Yes           | Cross-user system notifications   |
| AuthService (register) | ✅ Yes           | Creating new users requires admin |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Request                      │
│            (Bearer: user_access_token)                   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │    Auth Middleware            │
        │  directus.setToken(userToken) │
        └──────────────────┬─────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                      │
        ▼                                      ▼
┌───────────────────┐              ┌──────────────────────┐
│  Regular Services │              │  Special Services    │
│  - Dashboard      │              │  - Notifications     │
│  - Reports        │              │  - Auth (register)   │
│  - Rescues        │              │                      │
│  - Pets           │              │  Uses: adminDirectus │
│                   │              │  (static token)      │
│  Uses: directus   │              └──────────────────────┘
│  (user token)     │
└───────────────────┘
```

## Token Flow

### Regular Operations (Reports, Rescues, etc.)

```
1. User logs in → Gets access_token (15 min) + refresh_token (7 days)
2. Frontend stores tokens
3. Frontend sends: GET /api/reports
   Header: Authorization: Bearer <access_token>
4. Auth middleware: directus.setToken(access_token)
5. ReportService: this.sdk.request(readItems('reports'))
6. Directus checks: Does this token have permission?
   - Yes → Return data
   - No → 403 Forbidden
7. Token expired → 401 Unauthorized
8. Frontend catches 401 → Calls /auth/refresh → Retries request
```

### System Operations (Notifications)

```
1. User creates report
2. Backend: reportService.create(data)
3. Backend: notificationService.createNotification({
     user_id: assigned_rescuer_id,  // Different user!
     message: "New report assigned"
   })
4. NotificationService uses adminDirectus (bypasses permission check)
5. Notification created for other user
```

## Benefits of Refactor

### ✅ Advantages

1. **Simpler Architecture** - One client for most operations
2. **Proper Permissions** - Relies on Directus role configuration
3. **TypeScript Compliance** - No property visibility conflicts
4. **Clear Intent** - Admin token only where truly needed
5. **Better Debugging** - Easier to trace which user made changes
6. **Audit Trail** - User context preserved for all operations

### ⚠️ Considerations

1. **Token Expiration** - Users will see 401 errors after 15 minutes
   - Frontend handles this with automatic token refresh
   - Better UX than silent failures
2. **Permission Errors** - If Directus permissions not configured properly
   - Clear error messages
   - Forces proper permission setup

## Required Directus Configuration

### Admin Role Permissions

In Directus Admin Panel → Settings → Roles & Permissions → Admin:

| Collection      | Create | Read | Update | Delete | Fields               |
| --------------- | ------ | ---- | ------ | ------ | -------------------- |
| users           | ✅     | ✅   | ✅     | ✅     | All                  |
| reports         | ✅     | ✅   | ✅     | ✅     | All                  |
| rescues         | ✅     | ✅   | ✅     | ✅     | All                  |
| rescues_users   | ✅     | ✅   | ✅     | ✅     | All                  |
| rescues_reports | ✅     | ✅   | ✅     | ✅     | All                  |
| adoptions       | ✅     | ✅   | ✅     | ✅     | All                  |
| pets            | ✅     | ✅   | ✅     | ✅     | All                  |
| pet_images      | ✅     | ✅   | ✅     | ✅     | All                  |
| notifications   | ❌     | ✅   | ✅     | ❌     | All (system creates) |

**Important:** Enable `user_created` and `user_updated` field tracking.

## Testing Checklist

- [ ] Login with admin user
- [ ] Create a report (should track user_created)
- [ ] List all reports (should show all)
- [ ] Update a report (should track user_updated)
- [ ] Dashboard loads (should show analytics)
- [ ] Notifications work (cross-user access)
- [ ] Token expires after 15 min → Frontend refreshes → Operations continue
- [ ] New user registration works (creates user with admin token)

## Migration Notes

### For Developers

1. **No frontend changes needed** - API contracts unchanged
2. **Backend changes only** - Service layer refactor
3. **Directus permissions must be configured** before deployment
4. **Test thoroughly** with actual admin users

### Rollback Plan

If issues occur, revert to previous commits:

- `base.service.ts` - Restore `adminSdk` for reads
- `dashboard.service.ts` - Restore `private adminSdk`
- `rescue.service.ts` - Use `adminSdk` for reads

## Conclusion

The refactored architecture is simpler, more maintainable, and properly leverages Directus's permission system. Admin tokens are reserved for true system operations (notifications and user registration) where cross-user access is legitimately required.

The key insight: **If you have proper permissions configured in Directus, you don't need to bypass them with admin tokens.**
