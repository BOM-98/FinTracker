# Supabase Migration Status Report

**Date:** 2025-11-10
**Migration:** AWS Cognito/Amplify → Supabase Auth

---

## Executive Summary

| Category | Status | Files Migrated | Files Remaining |
|----------|--------|----------------|-----------------|
| **Configuration** | ❌ Not Started | 0/3 | 3 |
| **Authentication Pages** | 🟡 Partial | 1/3 | 2 |
| **Server Actions** | ✅ Complete | 1/1 | 0 |
| **State Management** | ❌ Not Started | 0/2 | 2 |
| **Components** | ❌ Not Started | 0/2 | 2 |
| **Middleware** | ✅ Complete | 1/1 | 0 |
| **Dependencies** | ❌ Not Started | 0/1 | 1 |

**Overall Progress:** 3/13 files migrated (23%)

---

## ✅ Completed Migrations

### 1. Login Page (`/src/app/(auth)/login/page.tsx`)
- **Status:** ✅ Migrated to Supabase
- **Changes:**
  - Removed `signIn()` from AWS Amplify
  - Removed `fetchUserSession()` from old auth lib
  - Now uses `loginAction()` server action
  - Uses Supabase authentication

**Reference:** `src/app/(auth)/login/page.tsx:11`

---

### 2. Login Actions (`/src/app/(auth)/login/actions.ts`)
- **Status:** ✅ New file created for Supabase
- **Contains:**
  - `loginAction()` - Email/password login
  - `signupAction()` - User registration
  - `loginWithGithubAction()` - GitHub OAuth
  - `logoutAction()` - User logout

**Reference:** `src/app/(auth)/login/actions.ts`

---

### 3. Middleware (`/src/middleware.ts`)
- **Status:** ✅ Migrated to Supabase
- **Changes:**
  - Uses `updateSession()` from Supabase middleware
  - Properly configured with Supabase SSR helpers

**Reference:** `src/middleware.ts:2`

---

### 4. Supabase Client Files
- **Status:** ✅ Created
- **Files:**
  - `/src/lib/supabase/client.ts` - Browser client
  - `/src/lib/supabase/server.ts` - Server client (Next.js 15 async pattern)
  - `/src/lib/supabase/middleware.ts` - Middleware helper

---

## ❌ Files Still Using AWS Amplify/Cognito

### 1. Registration Page (`/src/app/(auth)/register/page.tsx`)
- **Status:** ❌ Still using Amplify
- **Current Implementation:**
  ```typescript
  import { signUp } from 'aws-amplify/auth';  // Line 28

  const cognitoResult = await signUp({       // Line 66
    username: email,
    password,
    options: {
      userAttributes: {
        email,
        given_name: firstName,
        family_name: lastName,
        phone_number: phoneNumber,
        birthdate: dateOfBirth,
        address: address1,
        'custom:city': city,
        'custom:state': state,
        'custom:postal_code': postalCode,
        'custom:ssn': ssn,
        'custom:roles': JSON.stringify(roles)
      }
    }
  });
  ```

**What Needs to Change:**
- Replace `signUp()` from Amplify with `signupAction()` server action
- Map custom Cognito attributes to Supabase user_metadata
- Update confirmation flow to use Supabase OTP

**Impacted Lines:** `28, 66-91, 143-146`

---

### 2. Confirm Signup Page (`/src/app/(auth)/confirm-signup/page.tsx`)
- **Status:** ❌ Still using Amplify
- **Current Implementation:**
  ```typescript
  import { confirmSignUp } from '@aws-amplify/auth';  // Line 14

  const result = await confirmSignUp({                // Line 50
    username: email,
    confirmationCode: code
  });
  ```

**What Needs to Change:**
- **Option A:** Delete this page entirely and use email link verification (recommended)
- **Option B:** Refactor to use Supabase OTP verification:
  ```typescript
  await supabase.auth.verifyOtp({
    email: email,
    token: code,
    type: 'signup'
  })
  ```

**Note:** A route handler for email link verification already exists at:
- `/src/app/(auth)/confirm-signup/route.ts` ✅

**Impacted Lines:** `14, 50-55`

---

### 3. Auth Store (`/src/hooks/useAuthStore.ts`)
- **Status:** ❌ Completely tied to Amplify
- **Current Implementation:**
  ```typescript
  import { fetchAuthSession, signOut } from '@aws-amplify/auth';  // Line 4

  loadUserDetails: async () => {
    const session = await fetchAuthSession();          // Line 62
    const payload = session.tokens.idToken.payload;    // Line 68
    const roles = payload['cognito:groups'] as string[]; // Line 72
    // ...
  }

  logoutUser: async () => {
    await signOut();                                   // Line 126
    // ...
  }
  ```

**What Needs to Change:**
- Replace `fetchAuthSession()` with Supabase session management
- Replace `signOut()` with Supabase signOut
- Update role parsing from `cognito:groups` to Supabase user_metadata
- Refactor to use Supabase auth state

**Suggested Supabase Replacement:**
```typescript
import { createClient } from '@/lib/supabase/client'

loadUserDetails: async () => {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const { data: { user } } = await supabase.auth.getUser()

  // Parse from user_metadata instead of cognito:groups
  const roles = user.user_metadata?.roles || []
  const email = user.email
  const firstName = user.user_metadata?.given_name || ''
  const lastName = user.user_metadata?.family_name || ''
  // ...
}

logoutUser: async () => {
  const supabase = createClient()
  await supabase.auth.signOut()
  // ...
}
```

**Impacted Lines:** `4, 62, 68, 72, 89-90, 126`

---

### 4. Signup Store (`/src/hooks/useSignupStore.ts`)
- **Status:** ⚠️ No Amplify imports, but used for Amplify flow
- **Current Purpose:** Stores email between signup and confirmation pages
- **Future:** May not be needed if using email link verification

**Decision Needed:**
- If using email link verification → Delete this store
- If keeping manual code entry → Keep this store

---

### 5. App Sidebar (`/src/components/layout/app-sidebar.tsx`)
- **Status:** ❌ Still using Amplify signOut
- **Current Implementation:**
  ```typescript
  import { signOut } from '@aws-amplify/auth';  // Line 49

  <DropdownMenuItem onClick={() => signOut()}>  // Line 202
    <IconLogout className='mr-2 h-4 w-4' />
    Sign Out
  </DropdownMenuItem>
  ```

**What Needs to Change:**
- Remove Amplify signOut import
- Use `logoutAction()` from server actions or call Supabase client signOut
- Update onClick handler

**Suggested Replacement:**
```typescript
import { logoutAction } from '@/app/(auth)/login/actions'

<DropdownMenuItem onClick={async () => {
  await logoutAction()
  router.push('/login')
}}>
  <IconLogout className='mr-2 h-4 w-4' />
  Sign Out
</DropdownMenuItem>
```

**Impacted Lines:** `49, 202`

---

### 6. Nav User Component (`/src/components/nav-user.tsx`)
- **Status:** ✅ No Amplify imports
- **Note:** Log out button is just UI (no functionality implemented)
- **Action Required:** Add logout functionality using Supabase

**Current State:**
```typescript
<DropdownMenuItem>
  <IconLogout className='mr-2 h-4 w-4' />
  Log out
</DropdownMenuItem>
```

**Needs:** Same fix as app-sidebar above

**Impacted Lines:** `101-104`

---

### 7. Old Server Auth File (`/src/lib/auth.ts`)
- **Status:** ❌ Entirely Amplify-based, no longer used
- **Current Implementation:**
  ```typescript
  import { runWithAmplifyServerContext } from '@/lib/amplifyServerUtils';
  import { fetchAuthSession } from '@aws-amplify/auth/server';

  export async function fetchUserSession() {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec)
    });
    // Sets cookie with Cognito ID token
  }
  ```

**Action Required:**
- ✅ This file is no longer imported anywhere (login page now uses `loginAction`)
- **Recommended:** Delete this file entirely

**Impacted Lines:** Entire file

---

## 🗂️ Configuration Files to Delete

### 1. Amplify Client Config (`/src/amplifyConfig.ts`)
- **Status:** ❌ Still exists and imported
- **Current Usage:** Imported in `/src/app/layout.tsx:10`
- **Action:** Delete file after removing from layout.tsx

---

### 2. Amplify Configuration (`/src/amplifyconfiguration.ts`)
- **Status:** ❌ Still exists
- **Contains:** Cognito User Pool ID and Client ID config
- **Action:** Delete file (Supabase config uses env vars directly)

---

### 3. Amplify Server Utils (`/src/lib/amplifyServerUtils.ts`)
- **Status:** ❌ Still exists
- **Current Usage:** Only used by `/src/lib/auth.ts` (which is unused)
- **Action:** Delete file

---

### 4. Root Layout (`/src/app/layout.tsx`)
- **Status:** ❌ Still initializing Amplify
- **Current Implementation:**
  ```typescript
  import ConfigureAmplifyClientSide from '@/amplifyConfig';  // Line 10

  // Inside RootLayout component:
  <ConfigureAmplifyClientSide />
  ```

**What Needs to Change:**
- Remove Amplify config import and component
- Add Supabase provider if using React context pattern (optional)

**Impacted Lines:** `10, 55 (component render)`

---

## 📦 Package Dependencies to Remove

### `package.json` - Lines 26-28, 67
```json
{
  "dependencies": {
    "@aws-amplify/adapter-nextjs": "^1.6.2",
    "@aws-amplify/auth": "^6.12.4",
    "@aws-amplify/cli": "^13.0.1",
    "aws-amplify": "^6.14.4"
  }
}
```

**Action Required:**
```bash
pnpm remove @aws-amplify/adapter-nextjs @aws-amplify/auth @aws-amplify/cli aws-amplify
```

**Impact:** This will remove ~50MB of dependencies

---

## 🔄 Migration Checklist

### Phase 1: Core Auth Flow (High Priority)

- [ ] **Register Page** - Migrate to Supabase signUp
  - File: `/src/app/(auth)/register/page.tsx`
  - Replace Amplify `signUp()` with Supabase
  - Map custom attributes to user_metadata
  - Update confirmation flow

- [ ] **Auth Store** - Migrate to Supabase session management
  - File: `/src/hooks/useAuthStore.ts`
  - Replace `fetchAuthSession()` with Supabase getSession
  - Replace `signOut()` with Supabase signOut
  - Update role parsing logic

- [ ] **App Sidebar** - Update logout functionality
  - File: `/src/components/layout/app-sidebar.tsx`
  - Replace Amplify `signOut()` with Supabase
  - Test logout flow

- [ ] **Nav User** - Add logout functionality
  - File: `/src/components/nav-user.tsx`
  - Implement logout with Supabase

---

### Phase 2: Confirmation Flow (Medium Priority)

- [ ] **Confirm Signup Page** - Choose approach:
  - **Option A (Recommended):** Delete page, use email link verification
  - **Option B:** Refactor to use Supabase OTP verification

- [ ] **Signup Store** - Evaluate necessity
  - Keep if using manual code entry
  - Delete if using email links

---

### Phase 3: Cleanup (Final Steps)

- [ ] **Root Layout** - Remove Amplify initialization
  - File: `/src/app/layout.tsx`
  - Remove `ConfigureAmplifyClientSide` import and render

- [ ] **Delete Old Config Files:**
  - [ ] `/src/amplifyConfig.ts`
  - [ ] `/src/amplifyconfiguration.ts`
  - [ ] `/src/lib/amplifyServerUtils.ts`
  - [ ] `/src/lib/auth.ts`

- [ ] **Remove Package Dependencies:**
  ```bash
  pnpm remove @aws-amplify/adapter-nextjs @aws-amplify/auth @aws-amplify/cli aws-amplify
  pnpm install
  ```

- [ ] **Remove Environment Variables:**
  - Remove from `.env.local`:
    - `NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID`
    - `NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID`

- [ ] **Final Verification:**
  - [ ] Search codebase for any remaining `aws-amplify` imports
  - [ ] Test complete auth flow: signup → confirm → login → logout
  - [ ] Verify no Amplify errors in console
  - [ ] Check bundle size reduction

---

## 🎯 Priority Order for Migration

### Immediate (Blocking user registration)
1. **Register Page** - Users can't sign up without this
2. **Auth Store** - Critical for session management across app
3. **Confirm Signup** - Needed to complete registration flow

### High Priority (Blocking full functionality)
4. **App Sidebar Logout** - Users can't log out properly
5. **Root Layout** - Remove Amplify initialization

### Medium Priority (Cleanup)
6. **Nav User Logout** - Alternative logout location
7. **Delete old config files**
8. **Remove package dependencies**

### Low Priority (Final polish)
9. **Environment variable cleanup**
10. **Final verification and testing**

---

## 🚨 Critical Issues Identified

### Issue 1: User Registration is Broken
**Impact:** High - Users cannot create new accounts
**Files:** `/src/app/(auth)/register/page.tsx`
**Cause:** Still using Cognito signUp which won't work with Supabase
**Fix:** Migrate to Supabase signup action

### Issue 2: Session Management Not Working
**Impact:** High - User state won't persist correctly
**Files:** `/src/hooks/useAuthStore.ts`
**Cause:** Attempting to fetch Cognito sessions that don't exist
**Fix:** Refactor to use Supabase session APIs

### Issue 3: Logout Functionality Broken
**Impact:** Medium - Users can't properly log out
**Files:** `/src/components/layout/app-sidebar.tsx`
**Cause:** Calling Amplify signOut instead of Supabase
**Fix:** Replace with Supabase signOut

### Issue 4: Old Code Bloating Bundle
**Impact:** Low - Unnecessary package size
**Files:** `package.json`
**Cause:** AWS Amplify packages still installed (~50MB)
**Fix:** Remove unused dependencies

---

## 📊 Custom Attributes Migration Map

Your Cognito setup uses extensive custom attributes. Here's how to map them to Supabase:

| Cognito Attribute | Supabase Location | Code Change Required |
|-------------------|-------------------|----------------------|
| `email` | `user.email` | Built-in |
| `given_name` | `user.user_metadata.given_name` | ✅ |
| `family_name` | `user.user_metadata.family_name` | ✅ |
| `phone_number` | `user.phone` | Built-in |
| `birthdate` | `user.user_metadata.birthdate` | ✅ |
| `address` | `user.user_metadata.address` | ✅ |
| `custom:city` | `user.user_metadata.city` | ✅ |
| `custom:state` | `user.user_metadata.state` | ✅ |
| `custom:postal_code` | `user.user_metadata.postal_code` | ✅ |
| `custom:ssn` | `user.user_metadata.ssn` | ⚠️ Encrypt! |
| `custom:roles` | `user.user_metadata.roles` | ✅ |
| `cognito:groups` | `user.user_metadata.roles` or RLS policies | ✅ |

**Security Note:** Consider encrypting SSN before storing in user_metadata, or storing in separate secure table.

---

## 🔍 Files Not Requiring Changes

These files were mentioned in the original documentation but don't need changes:

### Already Supabase-Compatible:
- ✅ `/src/lib/authFormSchema.ts` - Pure Zod validation, no auth provider dependency
- ✅ `/src/components/user-avatar-profile.tsx` - Pure UI component
- ✅ `/src/features/auth/components/` - Layout components, no auth logic

### Not Yet Implemented:
- `/src/features/auth/components/user-auth-form.tsx` - Marked as unused
- `/src/features/auth/components/github-auth-button.tsx` - Placeholder only

---

## 📝 Next Steps Recommendation

**Start with this order:**

1. **Migrate Register Page** (1-2 hours)
   - Create signup server action (similar to loginAction)
   - Update form submission to use new action
   - Map attributes to user_metadata

2. **Migrate Auth Store** (2-3 hours)
   - Replace fetchAuthSession with Supabase
   - Update role parsing logic
   - Test session persistence

3. **Fix Logout** (30 minutes)
   - Update app-sidebar and nav-user
   - Test logout flow

4. **Handle Confirmation** (1 hour)
   - Decide on email link vs manual code
   - Implement chosen approach

5. **Cleanup** (30 minutes)
   - Delete old files
   - Remove packages
   - Final testing

**Total Estimated Time:** 5-7 hours

---

## ✅ Testing Checklist (After Migration)

- [ ] User can sign up with email/password
- [ ] User receives confirmation email
- [ ] User can confirm email (link or code)
- [ ] User can log in with credentials
- [ ] Session persists on page refresh
- [ ] Protected routes work correctly
- [ ] User can log out
- [ ] User data (name, email, metadata) displays correctly
- [ ] No console errors related to Amplify
- [ ] Build completes without warnings
- [ ] Bundle size reduced by ~50MB

---

## 🎓 Reference Documentation

- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **Supabase SSR (Next.js):** https://supabase.com/docs/guides/auth/server-side/nextjs
- **Your Supabase Files:**
  - Client: `/src/lib/supabase/client.ts`
  - Server: `/src/lib/supabase/server.ts`
  - Middleware: `/src/lib/supabase/middleware.ts`

---

**Last Updated:** 2025-11-10
**Status:** 23% Complete (3/13 files migrated)
