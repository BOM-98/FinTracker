# Authentication System Analysis

## Files Involved with Authentication

### Configuration & Initialization
- `/src/amplifyConfig.ts` - Client-side Amplify configuration initialization
- `/src/amplifyconfiguration.ts` - AWS Cognito configuration (user pool and client IDs)
- `/src/lib/amplifyServerUtils.ts` - Server-side Amplify utilities for SSR

### Authentication Logic & Utilities
- `/src/lib/auth.ts` - Server action for fetching user session and setting secure cookies
- `/src/lib/authFormSchema.ts` - Zod validation schemas for authentication forms

### State Management (Zustand)
- `/src/hooks/useAuthStore.ts` - Global authentication state management store
- `/src/hooks/useSignupStore.ts` - Temporary state for signup flow

### Authentication Pages
- `/src/app/(auth)/login/page.tsx` - Login page and flow
- `/src/app/(auth)/register/page.tsx` - User registration/signup flow
- `/src/app/(auth)/confirm-signup/page.tsx` - Email confirmation page

### Auth Components
- `/src/features/auth/components/user-auth-form.tsx` - Generic email-based login form (unused)
- `/src/features/auth/components/github-auth-button.tsx` - OAuth provider button (placeholder)
- `/src/features/auth/components/sign-in-view.tsx` - Sign-in page layout wrapper
- `/src/features/auth/components/sign-up-view.tsx` - Sign-up page layout wrapper

### User Navigation & Profile Components
- `/src/components/nav-user.tsx` - User dropdown menu in sidebar
- `/src/components/user-avatar-profile.tsx` - Reusable user avatar component
- `/src/components/layout/user-nav.tsx` - Alternative user navigation component (scaffolding)

### Middleware & Routing
- `/src/middleware.ts` - Next.js middleware for route handling (minimal implementation)

### Layout & Provider Setup
- `/src/app/layout.tsx` - Root layout with Amplify initialization
- `/src/app/dashboard/layout.tsx` - Dashboard layout (protected area)
- `/src/components/layout/providers.tsx` - Provider wrapper for client components
- `/src/components/layout/app-sidebar.tsx` - Main application sidebar with user menu

---

## How the Authentication System Works

### System Architecture

The authentication system is built on **AWS Amplify** with **AWS Cognito** as the identity provider. It uses a combination of client-side and server-side operations, with state management handled by Zustand.

### Initialization Flow

1. **Root Layout** (`/src/app/layout.tsx`)
   - Imports and renders the `ConfigureAmplifyClientSide` component
   - This initializes the Amplify SDK on the client side

2. **Client Configuration** (`/src/amplifyConfig.ts`)
   - Configures Amplify with SSR enabled
   - Imports configuration from `amplifyconfiguration.ts`
   - Enables client components to use Amplify auth functions

3. **Cognito Configuration** (`/src/amplifyconfiguration.ts`)
   - Defines AWS Cognito user pool ID and client ID
   - Reads from environment variables:
     - `NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID`
     - `NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID`

4. **Server-Side Setup** (`/src/lib/amplifyServerUtils.ts`)
   - Exports `runWithAmplifyServerContext` for server components
   - Configures cookie-based token provider
   - Enables server-side access to auth sessions

---

### Sign-Up Flow

```
User → /register page
  ↓
[Step 1: Personal Information]
- First Name, Last Name
- Address, City, State, Postal Code
- Phone Number
- Date of Birth
- SSN
  ↓
[Validation] ← /src/lib/authFormSchema.ts
  ↓
[Step 2: Account Credentials]
- Email
- Password
  ↓
[Form Submission]
  ↓
/src/app/(auth)/register/page.tsx calls signUp() from AWS Amplify
  ↓
AWS Cognito creates user with custom attributes:
- Standard: email, given_name, family_name, phone_number, birthdate, address
- Custom: custom:city, custom:state, custom:postal_code, custom:ssn, custom:roles
  ↓
[Cognito Response: CONFIRM_SIGN_UP required]
  ↓
Email stored in signup store (/src/hooks/useSignupStore.ts)
  ↓
Redirect to /confirm-signup
  ↓
/src/app/(auth)/confirm-signup/page.tsx
- Retrieves email from signup store
- User enters 6-digit confirmation code
- Calls confirmSignUp() from AWS Amplify
  ↓
[Account Confirmed]
  ↓
Clear email from store
  ↓
Redirect to /login
```

**Key Files Involved:**
- `/src/app/(auth)/register/page.tsx` - Handles multi-step form and signUp() call
- `/src/lib/authFormSchema.ts` - Validates all form fields with Zod
- `/src/hooks/useSignupStore.ts` - Stores email between signup and confirmation
- `/src/app/(auth)/confirm-signup/page.tsx` - Handles confirmation code submission

**Interactions:**
1. Form validation happens in real-time using authFormSchema
2. On successful submission, AWS Amplify communicates with Cognito
3. Signup store temporarily holds email for the confirmation page
4. Confirmation page clears the store after successful verification

---

### Login Flow

```
User → /login page
  ↓
[Email & Password Input]
  ↓
[Form Validation] ← /src/lib/authFormSchema.ts
  ↓
/src/app/(auth)/login/page.tsx calls signIn() from AWS Amplify
  ↓
AWS Cognito authenticates user
  ↓
[Client-Side Sign-In Successful]
  ↓
fetchUserSession() server action called (/src/lib/auth.ts)
  ↓
Server extracts ID token from Cognito session
  ↓
ID token stored in secure httpOnly cookie
- Cookie name: 'idToken'
- Expiration: 1 hour
- Security: httpOnly, secure (production), sameSite='lax'
  ↓
Redirect to /dashboard
  ↓
useAuthStore.loadUserDetails() called (/src/hooks/useAuthStore.ts)
  ↓
Parse ID token JWT payload:
- email, given_name, family_name
- cognito:groups (roles)
- Set isLoggedIn = true
- Populate user details
  ↓
[User Logged In - Dashboard Accessible]
```

**Key Files Involved:**
- `/src/app/(auth)/login/page.tsx` - Handles login form and signIn() call
- `/src/lib/auth.ts` - Server action that sets secure cookie with ID token
- `/src/lib/authFormSchema.ts` - Validates email and password
- `/src/hooks/useAuthStore.ts` - Manages auth state after login

**Interactions:**
1. Login page validates credentials using authFormSchema
2. AWS Amplify signIn() communicates with Cognito
3. On success, server action (auth.ts) retrieves the session
4. Server creates secure httpOnly cookie with ID token
5. Auth store (useAuthStore) loads user details from token
6. Auth store extracts roles from `cognito:groups` in token payload

---

### Session Management

**Client-Side State** (`/src/hooks/useAuthStore.ts`):
```typescript
State:
- token, idToken, accessToken (JWT tokens)
- isLoggedIn (boolean)
- user (UserDetails object with email, name, roles)
- loading, error (status indicators)

Methods:
- loadUserDetails() - Fetches and parses Cognito session
- logoutUser() - Signs out and clears all state
- setAuthSession() - Updates auth state
- clearAuthSession() - Resets to initial state
```

**Server-Side Token Storage** (`/src/lib/auth.ts`):
```typescript
- ID token stored as secure httpOnly cookie
- Cookie expires in 1 hour
- Cookie security: httpOnly, secure (production), sameSite='lax'
- Provides CSRF protection
```

**Token Extraction Flow:**
```
useAuthStore.loadUserDetails()
  ↓
Fetch current auth session from Amplify
  ↓
Extract ID token from session.tokens.idToken
  ↓
Parse JWT payload using custom parser
  ↓
Extract user data:
- email
- given_name → firstName
- family_name → lastName
- cognito:groups → roles array
  ↓
Determine role hierarchy:
- SuperAdmin (if in cognito:groups)
- Admin (if in cognito:groups)
- Member (default)
  ↓
Set flags: admin, superAdmin, dash, bb
  ↓
Update store state with user object
  ↓
Set isLoggedIn = true
```

**Interactions:**
1. Server (auth.ts) creates cookie after successful login
2. Client (useAuthStore) loads user details from Amplify session
3. Auth store maintains in-memory state for quick access
4. Cookie persists across page refreshes (1 hour)
5. Amplify SDK handles token refresh automatically

---

### Logout Flow

```
User clicks "Sign Out" in sidebar
  ↓
/src/components/nav-user.tsx or /src/components/layout/app-sidebar.tsx
  ↓
Calls signOut() from AWS Amplify
  ↓
AWS Cognito session invalidated
  ↓
useAuthStore.logoutUser() called
  ↓
Clear all auth state:
- tokens = null
- user = null
- isLoggedIn = false
  ↓
[User Logged Out]
```

**Key Files Involved:**
- `/src/components/nav-user.tsx` - Sidebar user menu with logout button
- `/src/components/layout/app-sidebar.tsx` - Main sidebar with sign out
- `/src/hooks/useAuthStore.ts` - Clears auth state on logout

**Interactions:**
1. Logout button triggers Amplify signOut()
2. Cognito invalidates all tokens
3. Auth store clears client-side state
4. User should be redirected to /login (not currently implemented)

---

### Protected Routes

**Current Status:** Not implemented

**Intended Implementation:**
1. Middleware (`/src/middleware.ts`) should check for valid auth token
2. Redirect unauthenticated users from `/dashboard` to `/login`
3. Server components should validate session server-side

**Current Gaps:**
- Middleware doesn't check authentication
- Dashboard is accessible without login
- No protected route wrapper component

---

### User Profile & Navigation

**Sidebar Integration:**

```
/src/components/layout/app-sidebar.tsx
  ↓
Renders user section in footer
  ↓
/src/components/nav-user.tsx
  ↓
Displays user avatar, name, email
  ↓
Dropdown menu with:
- Account settings
- Billing
- Notifications
- Log out button
  ↓
Calls signOut() from AWS Amplify on logout
```

**User Avatar Component:**

```
/src/components/user-avatar-profile.tsx
  ↓
Accepts user prop with:
- imageUrl (optional)
- fullName
- emailAddresses
  ↓
Renders avatar with:
- Image if available
- Fallback initials
- Optional user info (name, email)
```

**Interactions:**
1. Sidebar imports and renders nav-user component
2. Nav-user displays current user from auth store
3. User avatar component is reusable across app
4. Dropdown menu provides access to account features

---

## AWS Amplify Dependencies & Migration to Supabase

### Files That Use AWS Amplify (12 files total)

#### 1. **Configuration Files** (MUST REPLACE)

**`/src/amplifyConfig.ts`**
- **Current Usage:** Configures Amplify SDK with SSR for client components
- **Migration:** Replace with Supabase client initialization
- **Action:** Create new `supabaseConfig.ts` with Supabase client setup

**`/src/amplifyconfiguration.ts`**
- **Current Usage:** Defines Cognito user pool and client IDs
- **Migration:** Replace with Supabase project URL and anon key
- **Action:** Create new configuration file with Supabase credentials

**`/src/lib/amplifyServerUtils.ts`**
- **Current Usage:** Server-side Amplify context with cookie-based tokens
- **Migration:** Replace with Supabase server-side client utilities
- **Action:** Create new server utilities for Supabase SSR

---

#### 2. **Authentication Pages** (MUST REFACTOR)

**`/src/app/(auth)/login/page.tsx`**
- **Line References:** Imports and calls from `aws-amplify/auth`
  - `signIn()` function
  - `signOut()` function
- **Migration:** Replace with Supabase auth methods:
  - `supabase.auth.signInWithPassword()`
  - `supabase.auth.signOut()`
- **Action:** Update imports and function calls

**`/src/app/(auth)/register/page.tsx`**
- **Line References:** Imports from `aws-amplify/auth`
  - `signUp()` function
- **Migration:** Replace with Supabase signup:
  - `supabase.auth.signUp()`
  - Update user attributes to use Supabase metadata
- **Action:**
  - Refactor signUp call
  - Map custom Cognito attributes to Supabase user metadata
  - Update confirmation flow if email confirmation is enabled

**`/src/app/(auth)/confirm-signup/page.tsx`**
- **Line References:** Imports from `aws-amplify/auth`
  - `confirmSignUp()` function
- **Migration:**
  - Supabase handles email confirmation automatically
  - May need `supabase.auth.verifyOtp()` if using OTP
- **Action:** Update confirmation logic or remove if Supabase auto-confirms

---

#### 3. **Server Actions** (MUST REFACTOR)

**`/src/lib/auth.ts`**
- **Line References:**
  - Imports `fetchAuthSession` from `aws-amplify/auth/server`
  - Uses `runWithAmplifyServerContext`
- **Migration:** Replace with Supabase server-side session:
  - `supabase.auth.getSession()`
  - Use `@supabase/ssr` package for SSR
- **Action:**
  - Rewrite `fetchUserSession()` function
  - Update cookie handling (Supabase manages this automatically)
  - Extract token from Supabase session

---

#### 4. **State Management** (MUST REFACTOR)

**`/src/hooks/useAuthStore.ts`**
- **Line References:**
  - Imports `fetchAuthSession`, `signOut` from `aws-amplify/auth`
  - Calls `fetchAuthSession()` in `loadUserDetails()`
  - Calls `signOut()` in `logoutUser()`
- **Migration:** Replace with Supabase auth hooks:
  - `supabase.auth.getSession()`
  - `supabase.auth.signOut()`
  - Consider using `@supabase/auth-helpers-react` for built-in hooks
- **Action:**
  - Update `loadUserDetails()` to fetch from Supabase session
  - Update `logoutUser()` to call Supabase signOut
  - Parse Supabase user object instead of Cognito token
  - Map roles from Supabase user metadata instead of `cognito:groups`

---

#### 5. **Layout Files** (MINOR CHANGES)

**`/src/app/layout.tsx`**
- **Line References:**
  - Imports `ConfigureAmplifyClientSide` from `@/amplifyConfig`
- **Migration:** Replace with Supabase provider:
  - Remove Amplify config import
  - Add Supabase client provider (if using context pattern)
- **Action:** Update imports and provider setup

---

#### 6. **UI Components** (MINOR CHANGES)

**`/src/components/layout/app-sidebar.tsx`**
- **Line References:**
  - Imports `signOut` from `aws-amplify/auth`
  - Calls `signOut()` in logout handler
- **Migration:** Replace with Supabase signOut:
  - `supabase.auth.signOut()`
- **Action:** Update import and function call

---

#### 7. **Package Dependencies** (MUST UPDATE)

**`package.json`**
- **Current Dependencies:**
  - `aws-amplify` package
  - Related Amplify types
- **Migration:** Remove Amplify, add Supabase:
  ```bash
  pnpm remove aws-amplify
  pnpm add @supabase/supabase-js @supabase/ssr
  ```
- **Action:** Update package.json and lock file

**`pnpm-lock.yaml`**
- **Current State:** Contains Amplify dependencies
- **Migration:** Will update automatically after package.json changes
- **Action:** Run `pnpm install` after updating package.json

---

## Migration Checklist for Supabase

### Phase 1: Setup & Configuration
- [ ] Install Supabase packages: `@supabase/supabase-js`, `@supabase/ssr`
- [ ] Create Supabase project and obtain credentials
- [ ] Set environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Create `/src/lib/supabase/client.ts` for client-side Supabase
- [ ] Create `/src/lib/supabase/server.ts` for server-side Supabase (SSR)
- [ ] Delete `/src/amplifyConfig.ts`
- [ ] Delete `/src/amplifyconfiguration.ts`
- [ ] Delete `/src/lib/amplifyServerUtils.ts`

### Phase 2: Authentication Pages
- [ ] Refactor `/src/app/(auth)/login/page.tsx`:
  - Replace `signIn()` with `supabase.auth.signInWithPassword()`
  - Update error handling for Supabase error format
- [ ] Refactor `/src/app/(auth)/register/page.tsx`:
  - Replace `signUp()` with `supabase.auth.signUp()`
  - Map custom attributes to Supabase user metadata
  - Update user attributes structure
- [ ] Refactor `/src/app/(auth)/confirm-signup/page.tsx`:
  - Replace `confirmSignUp()` with Supabase OTP verification
  - Or remove page if Supabase auto-confirms emails

### Phase 3: State Management
- [ ] Refactor `/src/hooks/useAuthStore.ts`:
  - Replace `fetchAuthSession()` with `supabase.auth.getSession()`
  - Update `loadUserDetails()` to parse Supabase user object
  - Map roles from user metadata instead of Cognito groups
  - Update `logoutUser()` to call `supabase.auth.signOut()`

### Phase 4: Server Actions
- [ ] Refactor `/src/lib/auth.ts`:
  - Replace `fetchAuthSession()` with Supabase server-side session
  - Update `fetchUserSession()` to use Supabase SSR helpers
  - Verify cookie handling (Supabase manages this automatically)

### Phase 5: UI Components
- [ ] Update `/src/components/layout/app-sidebar.tsx`:
  - Replace Amplify `signOut()` with Supabase signOut
- [ ] Update `/src/components/nav-user.tsx`:
  - Verify logout functionality with Supabase

### Phase 6: Layout & Providers
- [ ] Update `/src/app/layout.tsx`:
  - Remove `ConfigureAmplifyClientSide` import
  - Add Supabase provider if using context pattern
- [ ] Consider creating a Supabase auth provider wrapper

### Phase 7: Database & User Attributes
- [ ] Create Supabase database table for user profiles (if needed)
- [ ] Map custom Cognito attributes to Supabase:
  - `custom:city` → user_metadata.city
  - `custom:state` → user_metadata.state
  - `custom:postal_code` → user_metadata.postal_code
  - `custom:ssn` → user_metadata.ssn (consider encryption)
  - `custom:roles` → user_metadata.roles
- [ ] Set up Row Level Security (RLS) policies in Supabase

### Phase 8: Cleanup
- [ ] Remove `aws-amplify` from package.json
- [ ] Run `pnpm install` to update lock file
- [ ] Remove unused Amplify imports across codebase
- [ ] Test all authentication flows:
  - Sign up
  - Email confirmation
  - Login
  - Logout
  - Session persistence
  - Protected routes (after implementing)

### Phase 9: Additional Considerations
- [ ] Implement protected route middleware in `/src/middleware.ts`
- [ ] Add session refresh logic
- [ ] Update error messages for Supabase error format
- [ ] Consider implementing Supabase Auth UI components
- [ ] Set up Supabase Auth email templates
- [ ] Configure Supabase Auth providers (if adding OAuth)

---

## Environment Variables Migration

### Current (AWS Cognito):
```env
NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID=your-user-pool-id
NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID=your-client-id
```

### New (Supabase):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (server-only)
```

---

## Custom Attributes Mapping

| Cognito Attribute | Supabase Equivalent |
|-------------------|---------------------|
| `email` | `user.email` (built-in) |
| `given_name` | `user.user_metadata.given_name` |
| `family_name` | `user.user_metadata.family_name` |
| `phone_number` | `user.phone` (built-in) |
| `birthdate` | `user.user_metadata.birthdate` |
| `address` | `user.user_metadata.address` |
| `custom:city` | `user.user_metadata.city` |
| `custom:state` | `user.user_metadata.state` |
| `custom:postal_code` | `user.user_metadata.postal_code` |
| `custom:ssn` | `user.user_metadata.ssn` (encrypt!) |
| `custom:roles` | `user.user_metadata.roles` or separate roles table |
| `cognito:groups` | `user.user_metadata.roles` or RLS policies |

---

## Key Differences: Cognito vs Supabase

| Feature | AWS Cognito | Supabase |
|---------|-------------|----------|
| **Session Management** | JWT tokens managed by Amplify | JWT tokens managed by Supabase |
| **Email Confirmation** | Requires `confirmSignUp()` | Automatic or OTP-based |
| **Custom Attributes** | `custom:attribute` prefix | `user_metadata` object |
| **Roles/Groups** | `cognito:groups` in token | `user_metadata.roles` or RLS |
| **Server-Side Auth** | `runWithAmplifyServerContext` | `@supabase/ssr` helpers |
| **Cookie Handling** | Manual cookie creation | Automatic via SSR package |
| **Token Refresh** | Automatic via Amplify SDK | Automatic via Supabase client |
| **OAuth Providers** | Configured in Cognito console | Configured in Supabase dashboard |

---

## Summary

The authentication system is deeply integrated with AWS Amplify and Cognito. The migration to Supabase will require:

1. **12 files to modify** with varying levels of refactoring
2. **3 files to delete** (Amplify configuration files)
3. **3-5 new files to create** (Supabase configuration and utilities)
4. **Package dependencies update** (remove Amplify, add Supabase)
5. **Database schema setup** in Supabase for user profiles
6. **Environment variables replacement**

The most critical changes are in:
- Authentication pages (login, register, confirm-signup)
- Auth store (useAuthStore.ts)
- Server actions (auth.ts)
- Configuration files (complete replacement)

The migration is straightforward but requires careful attention to:
- Custom attribute mapping
- Role-based access control
- Session management
- Error handling differences
