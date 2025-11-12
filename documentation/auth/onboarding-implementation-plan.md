# User Onboarding Implementation Plan

**Created:** 2025-01-12
**Status:** Planning Phase
**Priority:** High
**Estimated Effort:** 8-12 hours

## Executive Summary

This document outlines the complete implementation plan for user onboarding in the application. Currently, users register and verify their email but skip directly to the dashboard without completing essential setup steps. The `users.onboarded_at` field exists but is never set, and critical preferences (country, currency, date format, theme, household name) are hardcoded to US defaults instead of being user-selected.

**Current State:** Registration ✅ → Email Verification ✅ → **Onboarding ❌** → Dashboard ✅

**Target State:** Registration ✅ → Email Verification ✅ → **Onboarding ✅** → Dashboard ✅

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Critical Issues Identified](#critical-issues-identified)
3. [User Journey Mapping](#user-journey-mapping)
4. [Technical Implementation Plan](#technical-implementation-plan)
5. [Database Schema Review](#database-schema-review)
6. [File Structure](#file-structure)
7. [Implementation Phases](#implementation-phases)
8. [Testing Strategy](#testing-strategy)
9. [Success Criteria](#success-criteria)

---

## Current State Analysis

### What Works ✅

**1. Registration Flow**
- Location: `src/app/(auth)/register/`
- Multi-step form (Personal details → Credentials)
- Validation: Zod schema (`src/lib/authFormSchema.ts`)
- Server Action: `signupAction()` creates:
  1. Supabase auth user (`auth.users`)
  2. Family record (`families`)
  3. User profile (`users`)

**2. Email Verification**
- Magic link sent via Supabase
- Callback handler: `src/app/auth/callback/route.ts`
- Updates `auth.users.email_confirmed_at`

**3. Authentication System**
- Dashboard protection: `requireAuthRedirect()` in `src/app/dashboard/layout.tsx`
- Auth helpers: `src/lib/auth/server-auth.ts`
- Session management working

**4. Database Schema**
- `families` table has all required fields (country, currency, timezone, date_format)
- `users` table has onboarding tracking fields:
  - `onboarded_at` (timestamp)
  - `set_onboarding_preferences_at` (timestamp)
  - `set_onboarding_goals_at` (timestamp)
  - `goals` (text[])
  - `theme` (varchar)

### What's Missing ❌

**1. No Onboarding Flow**
- Zero onboarding pages exist
- Users skip from email verification directly to dashboard
- `users.onboarded_at` remains NULL forever

**2. Hardcoded Settings**
```typescript
// src/app/(auth)/register/actions.ts lines 88-93
currency: 'USD',           // Should be user-selected
locale: 'en',              // Should be user-selected
country: 'US',             // Should be user-selected
timezone: 'America/New_York', // Should be detected/selected
date_format: '%m-%d-%Y'    // Should be user-selected
```

**3. Auto-Generated Household Name**
```typescript
// src/app/(auth)/register/actions.ts line 88
name: `${firstName}'s Household`  // Should be user-customized
```

**4. No Post-Verification Routing Logic**
```typescript
// src/app/auth/callback/route.ts line 19
const next = searchParams.get('next') ?? '/dashboard';
// Should check: onboarded_at ? '/dashboard' : '/onboarding'
```

**5. No Settings Page**
- Cannot edit household name, country, currency after creation
- No user preferences management UI

---

## Critical Issues Identified

### 🔴 Priority 1: Security

**Issue:** SSN stored in plain text in `auth.users.user_metadata.ssn`

**Impact:** Major security vulnerability

**Solution Options:**
1. **Remove SSN collection entirely** (Recommended if not legally required)
2. Encrypt at application level before storing
3. Move to Supabase Vault for secret storage
4. Create separate encrypted `sensitive_data` table

**Action:** Determine if SSN collection is required. If not, remove from registration form.

---

### 🟠 Priority 2: Missing Onboarding Flow

**Issue:** Zero onboarding pages exist despite database being ready

**Impact:**
- Users cannot customize settings
- International users forced into US defaults
- Poor user experience
- `onboarded_at` field unused

**Required Pages:**
1. `/onboarding/household` - Customize household name
2. `/onboarding/location` - Select country
3. `/onboarding/preferences` - Select currency, date format, timezone
4. `/onboarding/theme` - Select UI theme
5. `/onboarding/complete` - Confirmation and redirect

---

### 🟠 Priority 3: Routing Logic Missing

**Issue:** No check for onboarding completion status

**Impact:** Users with `onboarded_at = NULL` can access dashboard

**Required Changes:**
1. Auth callback should check onboarding status
2. Middleware should redirect non-onboarded users
3. Dashboard should verify onboarding completion

---

### 🟡 Priority 4: Data Model Inconsistencies

**Issue:** Personal data stored in `user_metadata` (JSONB) instead of proper columns

**Fields Affected:**
- `phone_number`
- `address`, `city`, `state`, `postal_code`
- `birthdate`
- `ssn` (security risk)

**Impact:**
- Cannot efficiently query by these fields
- Data not normalized
- SSN exposure risk

**Solution:**
- Move to dedicated columns/tables if needed for app functionality
- Or remove collection if not required

---

## User Journey Mapping

### Current Journey (Incomplete)

```
┌─────────────┐
│   /register │ User fills 2-step form
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ signupAction()  │ Creates: auth user → family → user profile
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ /confirm-signup │ "Check your email" message
└──────┬──────────┘
       │
       ▼ User clicks email link
┌─────────────────┐
│ /auth/callback  │ Verifies email, updates email_confirmed_at
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   /dashboard    │ ⚠️ PROBLEM: User not onboarded!
└─────────────────┘  onboarded_at = NULL
                     Settings = hardcoded defaults
```

---

### Target Journey (Complete)

```
┌─────────────┐
│   /register │ Simplified: email, password, name only
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ signupAction()  │ Creates: auth user → family → user profile
└──────┬──────────┘ Sets: onboarded_at = NULL
       │
       ▼
┌─────────────────┐
│ /confirm-signup │ "Check your email" message
└──────┬──────────┘
       │
       ▼ User clicks email link
┌─────────────────┐
│ /auth/callback  │ Verifies email
└──────┬──────────┘ Checks: onboarded_at IS NULL
       │
       ▼
┌────────────────────┐
│ /onboarding        │ NEW: Step-by-step wizard
├────────────────────┤
│ Step 1: Household  │ Customize household name
│ Step 2: Location   │ Select country (affects defaults)
│ Step 3: Currency   │ Select currency
│ Step 4: Preferences│ Date format, timezone
│ Step 5: Theme      │ UI theme selection
│ Step 6: Complete   │ Set onboarded_at = NOW()
└──────┬─────────────┘
       │
       ▼
┌─────────────────┐
│   /dashboard    │ ✅ User fully onboarded
└─────────────────┘  onboarded_at = <timestamp>
                     Settings = user's choices
```

---

## Technical Implementation Plan

### Phase 1: Routing & Middleware (2 hours)

**1.1 Update Auth Callback**

**File:** `src/app/auth/callback/route.ts`

**Current:**
```typescript
const next = searchParams.get('next') ?? '/dashboard';
redirect(next);
```

**Updated:**
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      // Check onboarding status
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('onboarded_at')
          .eq('id', user.id)
          .single();

        // Redirect based on onboarding status
        if (!userData?.onboarded_at) {
          redirect('/onboarding/household');
        } else {
          redirect('/dashboard');
        }
      }
    }

    console.error('Email verification error:', error);
  }

  redirect('/login?error=verification_failed');
}
```

---

**1.2 Update Middleware**

**File:** `src/middleware.ts`

Add onboarding status check:

```typescript
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Public routes - allow access
  const publicPaths = ['/login', '/register', '/confirm-signup', '/auth'];
  if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return response;
  }

  // Onboarding routes - allow authenticated users only
  if (request.nextUrl.pathname.startsWith('/onboarding')) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return response;
  }

  // Dashboard and protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check onboarding completion
    const { data: userData } = await supabase
      .from('users')
      .select('onboarded_at')
      .eq('id', user.id)
      .single();

    if (!userData?.onboarded_at) {
      return NextResponse.redirect(new URL('/onboarding/household', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
```

---

**1.3 Create Onboarding Auth Helper**

**File:** `src/lib/auth/server-auth.ts`

Add new helper:

```typescript
/**
 * Require user to NOT be onboarded (for onboarding pages)
 *
 * Redirects to dashboard if already onboarded
 * Redirects to login if not authenticated
 */
export async function requireNotOnboarded() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const userData = await getUserData();

  if (userData?.onboarded_at) {
    redirect('/dashboard'); // Already onboarded
  }

  return user;
}
```

---

### Phase 2: Onboarding Pages (4-6 hours)

**2.1 Onboarding Layout**

**File:** `src/app/(auth)/onboarding/layout.tsx`

```typescript
import { requireNotOnboarded } from '@/lib/auth/server-auth';
import { redirect } from 'next/navigation';

export default async function OnboardingLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Require authenticated but not yet onboarded
  await requireNotOnboarded();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-2xl">
        {children}
      </div>
    </div>
  );
}
```

---

**2.2 Step 1: Household Name**

**File:** `src/app/(auth)/onboarding/household/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { updateHouseholdName } from './actions';

export default function HouseholdSetupPage() {
  const router = useRouter();
  const [householdName, setHouseholdName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await updateHouseholdName(householdName);

      if (result.success) {
        router.push('/onboarding/location');
      } else {
        setError(result.error || 'Failed to update household name');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome! Let's set up your household</CardTitle>
        <CardDescription>
          Step 1 of 5: Give your household a name
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="householdName">Household Name</Label>
            <Input
              id="householdName"
              type="text"
              placeholder="e.g., The Smith Family, Sarah's Finances"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              required
              minLength={2}
              maxLength={50}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground mt-1">
              This helps identify your household in the app
            </p>
          </div>

          {error && (
            <div className="text-destructive text-sm">{error}</div>
          )}

          <div className="flex justify-between">
            <div /> {/* Spacer for flex layout */}
            <Button type="submit" disabled={isLoading || !householdName.trim()}>
              {isLoading ? 'Saving...' : 'Next'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

**File:** `src/app/(auth)/onboarding/household/actions.ts`

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, getUserData } from '@/lib/auth/server-auth';
import type { AuthResult } from '@/lib/auth/types';

export async function updateHouseholdName(name: string): Promise<AuthResult> {
  if (!name || name.trim().length < 2) {
    return { success: false, error: 'Household name must be at least 2 characters' };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const userData = await getUserData();
  if (!userData) {
    return { success: false, error: 'User profile not found' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('families')
    .update({ name: name.trim() })
    .eq('id', userData.familyId);

  if (error) {
    console.error('Error updating household name:', error);
    return { success: false, error: 'Failed to update household name' };
  }

  return { success: true };
}
```

---

**2.3 Step 2: Location (Country Selection)**

**File:** `src/app/(auth)/onboarding/location/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateCountry } from './actions';

const COUNTRIES = [
  { code: 'US', name: 'United States', currency: 'USD', dateFormat: '%m-%d-%Y' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', dateFormat: '%d-%m-%Y' },
  { code: 'CA', name: 'Canada', currency: 'CAD', dateFormat: '%Y-%m-%d' },
  { code: 'AU', name: 'Australia', currency: 'AUD', dateFormat: '%d-%m-%Y' },
  { code: 'DE', name: 'Germany', currency: 'EUR', dateFormat: '%d.%m.%Y' },
  { code: 'FR', name: 'France', currency: 'EUR', dateFormat: '%d/%m/%Y' },
  { code: 'JP', name: 'Japan', currency: 'JPY', dateFormat: '%Y/%m/%d' },
  { code: 'IN', name: 'India', currency: 'INR', dateFormat: '%d-%m-%Y' },
  // Add more countries as needed
];

export default function LocationSetupPage() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const country = COUNTRIES.find(c => c.code === selectedCountry);
    if (!country) {
      setError('Please select a country');
      setIsLoading(false);
      return;
    }

    try {
      const result = await updateCountry({
        country: country.code,
        currency: country.currency,
        dateFormat: country.dateFormat
      });

      if (result.success) {
        router.push('/onboarding/preferences');
      } else {
        setError(result.error || 'Failed to update location');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCountryData = COUNTRIES.find(c => c.code === selectedCountry);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where are you located?</CardTitle>
        <CardDescription>
          Step 2 of 5: This helps us set default currency and formats
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="country">Country</Label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(country => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCountryData && (
            <div className="bg-muted p-4 rounded-md space-y-2">
              <h3 className="font-semibold">Default settings for {selectedCountryData.name}:</h3>
              <ul className="text-sm space-y-1">
                <li>Currency: {selectedCountryData.currency}</li>
                <li>Date format: {selectedCountryData.dateFormat}</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                You can customize these on the next step
              </p>
            </div>
          )}

          {error && (
            <div className="text-destructive text-sm">{error}</div>
          )}

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/onboarding/household')}
              disabled={isLoading}
            >
              Back
            </Button>
            <Button type="submit" disabled={isLoading || !selectedCountry}>
              {isLoading ? 'Saving...' : 'Next'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

**File:** `src/app/(auth)/onboarding/location/actions.ts`

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserData } from '@/lib/auth/server-auth';
import type { AuthResult } from '@/lib/auth/types';

interface UpdateCountryData {
  country: string;
  currency: string;
  dateFormat: string;
}

export async function updateCountry(data: UpdateCountryData): Promise<AuthResult> {
  const userData = await getUserData();
  if (!userData) {
    return { success: false, error: 'User not found' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('families')
    .update({
      country: data.country,
      currency: data.currency,
      date_format: data.dateFormat
    })
    .eq('id', userData.familyId);

  if (error) {
    console.error('Error updating country:', error);
    return { success: false, error: 'Failed to update location settings' };
  }

  return { success: true };
}
```

---

**2.4 Step 3: Currency & Date Format Customization**

**File:** `src/app/(auth)/onboarding/preferences/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updatePreferences, getCurrentSettings } from './actions';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
];

const DATE_FORMATS = [
  { format: '%m-%d-%Y', label: 'MM-DD-YYYY', example: '01-31-2025' },
  { format: '%d-%m-%Y', label: 'DD-MM-YYYY', example: '31-01-2025' },
  { format: '%Y-%m-%d', label: 'YYYY-MM-DD', example: '2025-01-31' },
  { format: '%d/%m/%Y', label: 'DD/MM/YYYY', example: '31/01/2025' },
  { format: '%m/%d/%Y', label: 'MM/DD/YYYY', example: '01/31/2025' },
];

export default function PreferencesPage() {
  const router = useRouter();
  const [currency, setCurrency] = useState('');
  const [dateFormat, setDateFormat] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const settings = await getCurrentSettings();
      if (settings) {
        setCurrency(settings.currency);
        setDateFormat(settings.dateFormat);
      }
      setIsLoading(false);
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const result = await updatePreferences({ currency, dateFormat });

      if (result.success) {
        router.push('/onboarding/theme');
      } else {
        setError(result.error || 'Failed to update preferences');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const selectedDateFormat = DATE_FORMATS.find(df => df.format === dateFormat);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customize Your Preferences</CardTitle>
        <CardDescription>
          Step 3 of 5: Fine-tune currency and date display
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(curr => (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.name} ({curr.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              This will be the default currency for your accounts
            </p>
          </div>

          <div>
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select value={dateFormat} onValueChange={setDateFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Select date format" />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMATS.map(df => (
                  <SelectItem key={df.format} value={df.format}>
                    {df.label} (e.g., {df.example})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDateFormat && (
              <p className="text-sm text-muted-foreground mt-1">
                Example: {selectedDateFormat.example}
              </p>
            )}
          </div>

          {error && (
            <div className="text-destructive text-sm">{error}</div>
          )}

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/onboarding/location')}
              disabled={isSaving}
            >
              Back
            </Button>
            <Button type="submit" disabled={isSaving || !currency || !dateFormat}>
              {isSaving ? 'Saving...' : 'Next'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

**File:** `src/app/(auth)/onboarding/preferences/actions.ts`

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserData } from '@/lib/auth/server-auth';
import type { AuthResult } from '@/lib/auth/types';

interface PreferencesData {
  currency: string;
  dateFormat: string;
}

export async function updatePreferences(data: PreferencesData): Promise<AuthResult> {
  const userData = await getUserData();
  if (!userData) {
    return { success: false, error: 'User not found' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('families')
    .update({
      currency: data.currency,
      date_format: data.dateFormat
    })
    .eq('id', userData.familyId);

  if (error) {
    console.error('Error updating preferences:', error);
    return { success: false, error: 'Failed to update preferences' };
  }

  return { success: true };
}

export async function getCurrentSettings() {
  const userData = await getUserData();
  if (!userData) return null;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('families')
    .select('currency, date_format')
    .eq('id', userData.familyId)
    .single();

  if (error) {
    console.error('Error fetching settings:', error);
    return null;
  }

  return {
    currency: data.currency,
    dateFormat: data.date_format
  };
}
```

---

**2.5 Step 4: Theme Selection**

**File:** `src/app/(auth)/onboarding/theme/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Sun, Moon, Monitor } from 'lucide-react';
import { updateTheme } from './actions';

const THEMES = [
  {
    value: 'light',
    label: 'Light',
    description: 'Bright and clear interface',
    icon: Sun
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Easy on the eyes in low light',
    icon: Moon
  },
  {
    value: 'system',
    label: 'System',
    description: 'Matches your device settings',
    icon: Monitor
  }
];

export default function ThemePage() {
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState('system');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await updateTheme(selectedTheme);

      if (result.success) {
        router.push('/onboarding/complete');
      } else {
        setError(result.error || 'Failed to update theme');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Your Theme</CardTitle>
        <CardDescription>
          Step 4 of 5: Select how you want the app to look
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <RadioGroup value={selectedTheme} onValueChange={setSelectedTheme}>
            <div className="space-y-3">
              {THEMES.map(theme => {
                const Icon = theme.icon;
                return (
                  <label
                    key={theme.value}
                    className={`flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                      selectedTheme === theme.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={theme.value} id={theme.value} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <span className="font-semibold">{theme.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {theme.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </RadioGroup>

          {error && (
            <div className="text-destructive text-sm">{error}</div>
          )}

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/onboarding/preferences')}
              disabled={isLoading}
            >
              Back
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Next'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

**File:** `src/app/(auth)/onboarding/theme/actions.ts`

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server-auth';
import type { AuthResult } from '@/lib/auth/types';

export async function updateTheme(theme: string): Promise<AuthResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('users')
    .update({ theme })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating theme:', error);
    return { success: false, error: 'Failed to update theme' };
  }

  // Update set_onboarding_preferences_at timestamp
  await supabase
    .from('users')
    .update({ set_onboarding_preferences_at: new Date().toISOString() })
    .eq('id', user.id);

  return { success: true };
}
```

---

**2.6 Step 5: Complete Onboarding**

**File:** `src/app/(auth)/onboarding/complete/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { completeOnboarding, getOnboardingSummary } from './actions';

export default function CompletePage() {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      const data = await getOnboardingSummary();
      setSummary(data);
      setIsLoading(false);
    }
    loadSummary();
  }, []);

  const handleComplete = async () => {
    setIsCompleting(true);

    const result = await completeOnboarding();

    if (result.success) {
      // Redirect to dashboard
      router.push('/dashboard');
    } else {
      setIsCompleting(false);
      alert(result.error || 'Failed to complete onboarding');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
          <CardTitle>You're All Set!</CardTitle>
        </div>
        <CardDescription>
          Step 5 of 5: Your account is ready to use
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted p-4 rounded-lg space-y-3">
          <h3 className="font-semibold">Your Settings:</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Household:</dt>
              <dd className="font-medium">{summary?.householdName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Country:</dt>
              <dd className="font-medium">{summary?.country}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Currency:</dt>
              <dd className="font-medium">{summary?.currency}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Date Format:</dt>
              <dd className="font-medium">{summary?.dateFormat}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Theme:</dt>
              <dd className="font-medium capitalize">{summary?.theme}</dd>
            </div>
          </dl>
        </div>

        <p className="text-sm text-muted-foreground">
          You can change these settings anytime from your profile.
        </p>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/onboarding/theme')}
            disabled={isCompleting}
          >
            Back
          </Button>
          <Button onClick={handleComplete} disabled={isCompleting}>
            {isCompleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completing...
              </>
            ) : (
              'Go to Dashboard'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

**File:** `src/app/(auth)/onboarding/complete/actions.ts`

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, getUserData } from '@/lib/auth/server-auth';
import type { AuthResult } from '@/lib/auth/types';

export async function completeOnboarding(): Promise<AuthResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  // Set onboarded_at timestamp
  const { error } = await supabase
    .from('users')
    .update({ onboarded_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    console.error('Error completing onboarding:', error);
    return { success: false, error: 'Failed to complete onboarding' };
  }

  return { success: true };
}

export async function getOnboardingSummary() {
  const userData = await getUserData();
  if (!userData) return null;

  const supabase = await createClient();

  const { data: familyData } = await supabase
    .from('families')
    .select('name, country, currency, date_format')
    .eq('id', userData.familyId)
    .single();

  const { data: userPrefs } = await supabase
    .from('users')
    .select('theme')
    .eq('id', userData.id)
    .single();

  return {
    householdName: familyData?.name,
    country: familyData?.country,
    currency: familyData?.currency,
    dateFormat: familyData?.date_format,
    theme: userPrefs?.theme
  };
}
```

---

### Phase 3: Security & Data Cleanup (2 hours)

**3.1 Remove SSN from Registration**

**Option A: Remove SSN Collection (Recommended)**

Update `src/lib/authFormSchema.ts`:

```typescript
export const authFormSchema = (type: string) =>
  z.object({
    // Remove ssn field entirely
    firstName: type === 'sign-in' ? z.string().optional() : z.string().min(3),
    lastName: type === 'sign-in' ? z.string().optional() : z.string().min(3),
    // ... other fields ...
    // ssn: REMOVED
    email: z.string().email(),
    password: z.string().min(8)
  });
```

Update `src/app/(auth)/register/page.tsx`:
- Remove SSN input field from Step 1

Update `src/app/(auth)/register/actions.ts`:
```typescript
// Remove ssn from metadata
data: {
  first_name: firstName,
  last_name: lastName,
  phone_number: phoneNumber,
  birthdate: dateOfBirth,
  address: address1,
  city: city,
  state: state,
  postal_code: postalCode,
  // ssn: ssn,  // REMOVED
}
```

**Option B: Encrypt SSN (If Required)**

If SSN is legally required, implement encryption:

1. Create encryption utility: `src/lib/encryption.ts`
2. Encrypt SSN before storing
3. Decrypt only when absolutely necessary
4. Consider moving to separate `sensitive_data` table with encryption at rest

---

**3.2 Simplify Registration Form (Optional)**

Consider removing non-essential fields from registration:

**Keep:**
- Email
- Password
- First Name
- Last Name

**Move to Onboarding or Remove:**
- Phone (collect in settings later)
- Address (collect when needed for specific features)
- Date of Birth (collect when needed)
- SSN (remove or collect when needed)

This aligns registration with User Story 1.1 requirements.

---

### Phase 4: Testing (1 hour)

**4.1 Manual Testing Checklist**

- [ ] New user can register with email/password
- [ ] User receives verification email
- [ ] Email verification link works
- [ ] After verification, user redirected to `/onboarding/household`
- [ ] Can progress through all 5 onboarding steps
- [ ] Can go back to previous steps
- [ ] Settings are saved correctly at each step
- [ ] Onboarding completion sets `onboarded_at`
- [ ] After completion, user redirected to `/dashboard`
- [ ] Subsequent logins skip onboarding, go straight to dashboard
- [ ] Middleware prevents accessing dashboard without onboarding
- [ ] Cannot access onboarding pages if already onboarded

**4.2 Database Verification**

After completing onboarding, verify:

```sql
-- Check users table
SELECT id, email, first_name, last_name, onboarded_at, theme
FROM users
WHERE email = 'test@example.com';

-- Check families table
SELECT id, name, country, currency, date_format, timezone
FROM families
WHERE id = (SELECT family_id FROM users WHERE email = 'test@example.com');
```

Expected:
- `users.onboarded_at` should have timestamp
- `families` should have user-selected values (not hardcoded defaults)

---

## Database Schema Review

### Existing Schema ✅

All required fields already exist:

**families table:**
```sql
name          VARCHAR      -- Household name (user-customizable)
currency      VARCHAR      -- User-selected currency
locale        VARCHAR      -- User-selected locale
country       VARCHAR      -- User-selected country
timezone      VARCHAR      -- User-selected or auto-detected
date_format   VARCHAR      -- User-selected format
```

**users table:**
```sql
onboarded_at                   TIMESTAMP  -- Onboarding completion
set_onboarding_preferences_at  TIMESTAMP  -- Preferences step completion
set_onboarding_goals_at        TIMESTAMP  -- Goals step completion (future)
goals                          TEXT[]     -- Financial goals (future)
theme                          VARCHAR    -- UI theme preference
```

### No Schema Changes Required ✅

The database is already prepared for onboarding. We just need to:
1. Populate these fields during onboarding flow
2. Add logic to check `onboarded_at` for routing

---

## File Structure

```
src/app/(auth)/onboarding/
├── layout.tsx                    # Onboarding layout (requireNotOnboarded)
├── household/
│   ├── page.tsx                  # Step 1: Household name
│   └── actions.ts                # Update families.name
├── location/
│   ├── page.tsx                  # Step 2: Country selection
│   └── actions.ts                # Update families.country, currency, date_format
├── preferences/
│   ├── page.tsx                  # Step 3: Currency & date format customization
│   └── actions.ts                # Update families.currency, date_format
├── theme/
│   ├── page.tsx                  # Step 4: Theme selection
│   └── actions.ts                # Update users.theme, set_onboarding_preferences_at
└── complete/
    ├── page.tsx                  # Step 5: Summary & completion
    └── actions.ts                # Set users.onboarded_at, redirect to dashboard

src/lib/auth/
└── server-auth.ts                # Add requireNotOnboarded() helper

src/middleware.ts                 # Add onboarding status checks

src/app/auth/callback/
└── route.ts                      # Update to check onboarded_at

Total New Files: 11 files
```

---

## Implementation Phases

### Phase 1: Routing & Middleware (Day 1, 2 hours)

**Tasks:**
1. Update auth callback to check `onboarded_at`
2. Add onboarding checks to middleware
3. Create `requireNotOnboarded()` helper
4. Test redirect logic

**Deliverable:** Users redirected to onboarding after email verification

---

### Phase 2: Onboarding Pages (Day 1-2, 4-6 hours)

**Tasks:**
1. Create onboarding layout
2. Implement Step 1: Household name
3. Implement Step 2: Location/country
4. Implement Step 3: Currency & date format
5. Implement Step 4: Theme
6. Implement Step 5: Completion

**Deliverable:** Functional 5-step onboarding wizard

---

### Phase 3: Security & Cleanup (Day 2, 2 hours)

**Tasks:**
1. Remove or encrypt SSN
2. Optionally simplify registration form
3. Review data storage locations
4. Update documentation

**Deliverable:** Secure, production-ready registration

---

### Phase 4: Testing (Day 2, 1 hour)

**Tasks:**
1. Manual testing of complete flow
2. Database verification
3. Edge case testing
4. Bug fixes

**Deliverable:** Tested, working onboarding flow

---

## Testing Strategy

### Test Cases

**1. New User Registration**
- Register → Verify Email → Onboarding → Dashboard
- All settings saved correctly
- `onboarded_at` timestamp set

**2. Onboarding Interruption**
- Start onboarding → Close browser
- Log back in → Resume onboarding
- Middleware redirects to onboarding

**3. Existing User Login**
- User with `onboarded_at` set
- Login → Direct to dashboard
- No onboarding redirect

**4. Back Button Navigation**
- Can go back through onboarding steps
- Data persisted on each step
- Can change previous selections

**5. Direct URL Access**
- Try accessing `/dashboard` without onboarding → Redirect
- Try accessing `/onboarding` when onboarded → Redirect to dashboard
- Try accessing `/onboarding` without auth → Redirect to login

---

## Success Criteria

### Functional Requirements ✅

- [ ] User redirected to onboarding after email verification
- [ ] Can complete all 5 onboarding steps
- [ ] Can navigate back through steps
- [ ] Settings saved correctly in database
- [ ] `onboarded_at` set on completion
- [ ] Redirected to dashboard after completion
- [ ] Middleware enforces onboarding completion
- [ ] Existing users skip onboarding

### Data Requirements ✅

- [ ] `families.name` is user-provided (not auto-generated)
- [ ] `families.country` is user-selected (not hardcoded)
- [ ] `families.currency` is user-selected (not hardcoded)
- [ ] `families.date_format` is user-selected (not hardcoded)
- [ ] `users.theme` is user-selected (not hardcoded)
- [ ] `users.onboarded_at` is set after completion
- [ ] `users.set_onboarding_preferences_at` is set

### Security Requirements ✅

- [ ] SSN removed or encrypted
- [ ] Onboarding pages require authentication
- [ ] Cannot access dashboard without onboarding
- [ ] Cannot access onboarding if already completed

### UX Requirements ✅

- [ ] Clear progress indication (Step X of 5)
- [ ] Back button works on all steps
- [ ] Settings summary shown before completion
- [ ] Loading states during async operations
- [ ] Error messages displayed clearly

---

## Rollout Plan

### Stage 1: Development
- Implement all phases
- Test locally with test accounts
- Verify database updates

### Stage 2: Staging
- Deploy to staging environment
- Test complete registration flow
- Verify email delivery
- Test edge cases

### Stage 3: Production (With Safety)
- **Gradual Rollout:**
  - Existing users: Not affected (already have `onboarded_at` or bypass logic)
  - New users only: Go through onboarding
- **Monitoring:**
  - Track onboarding completion rates
  - Monitor for errors in onboarding flow
  - Track time to complete onboarding
- **Rollback Plan:**
  - Feature flag to disable onboarding requirement
  - Allow skipping onboarding if issues arise

---

## Future Enhancements

### Additional Onboarding Steps (Post-MVP)

**Financial Goals (User Story 1.2 Extended)**
- Collect user's financial goals
- Store in `users.goals` array
- Set `users.set_onboarding_goals_at`

**Account Setup**
- Guide user to connect first bank account
- Link to Plaid integration
- Optional: Import historical data

**Budget Setup**
- Create initial budget
- Set spending limits per category
- Configure budget period

**Notifications**
- Email preferences
- Push notification settings
- Alert thresholds

### Settings Management

**Profile Settings Page** (`/settings/profile`)
- Edit first name, last name
- Update email
- Change password

**Household Settings Page** (`/settings/household`)
- Edit household name
- Add/remove family members
- Manage invitations

**Preferences Page** (`/settings/preferences`)
- Change country, currency
- Update date format, timezone
- Toggle theme
- Set default time period

### Analytics

Track onboarding metrics:
- Completion rate per step
- Drop-off points
- Time to complete
- Most common settings choices

---

## Appendix

### Country & Currency Data

For full implementation, consider using:
- **Countries:** ISO 3166-1 alpha-2 codes
- **Currencies:** ISO 4217 currency codes
- **Timezones:** IANA timezone database
- **Date Formats:** strftime format strings

Can use libraries like:
- `countries-list` for country data
- `currency-list` for currency data
- `timezone-list` for timezone data

### UI Components Needed

All required shadcn/ui components:
- ✅ Button
- ✅ Card
- ✅ Input
- ✅ Label
- ✅ Select
- ✅ RadioGroup
- Icons from `lucide-react`

### References

- User Story Documentation: `/documentation/user-stories/story-mapping.md`
- Auth Migration Status: `/documentation/auth/supabase-migration-status.md`
- Registration Code: `src/app/(auth)/register/`
- Auth Callback: `src/app/auth/callback/route.ts`
- Auth Helpers: `src/lib/auth/server-auth.ts`

---

## Implementation Timeline

**Total Estimated Time:** 8-12 hours

- **Phase 1 (Routing):** 2 hours
- **Phase 2 (Pages):** 4-6 hours
- **Phase 3 (Security):** 2 hours
- **Phase 4 (Testing):** 1 hour

**Recommended Schedule:**
- **Day 1:** Phases 1 & 2 (Morning: Routing, Afternoon: Pages 1-3)
- **Day 2:** Phases 2, 3 & 4 (Morning: Pages 4-5, Afternoon: Security & Testing)

---

## Next Actions

1. **Review this plan** with stakeholders
2. **Confirm SSN handling** - Remove or encrypt?
3. **Approve UI mockups** for onboarding pages
4. **Create implementation branch** (`feature/user-onboarding`)
5. **Begin Phase 1** - Routing & middleware
6. **Daily progress reviews** during implementation
7. **QA testing** before production deployment

---

**Document Version:** 1.0
**Last Updated:** 2025-01-12
**Author:** Generated from Agent Analysis
**Status:** Ready for Implementation
