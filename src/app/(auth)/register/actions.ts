'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AuthResult, SignupData } from '@/lib/auth/types';

/**
 * Server action for user registration implementing the full 3-step flow:
 * 1. Create Supabase auth user with metadata
 * 2. Create family record for household management
 * 3. Create users table record linking auth to family
 *
 * This ensures proper multi-tenant data isolation and user profile setup.
 */
export async function signupAction(
  data: SignupData
): Promise<AuthResult | never> {
  const {
    email,
    password,
    firstName,
    lastName,
    phoneNumber,
    dateOfBirth,
    address1,
    city,
    state,
    postalCode,
    ssn
  } = data;

  // Validate required fields
  if (!email || !password || !firstName || !lastName) {
    return {
      success: false,
      error: 'Email, password, first name, and last name are required.'
    };
  }

  const supabase = await createClient();

  try {
    // STEP 1: Create Supabase auth user with metadata
    console.log('📝 Creating Supabase auth user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`,
        data: {
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          birthdate: dateOfBirth,
          address: address1,
          city: city,
          state: state,
          postal_code: postalCode,
          // Note: Consider encrypting SSN or storing in separate secure table in production
          ssn: ssn
        }
      }
    });

    if (authError) {
      console.error('❌ Auth signup error:', authError);
      return {
        success: false,
        error: authError.message || 'Failed to create account. Please try again.'
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to create user account.'
      };
    }

    const authUserId = authData.user.id;
    console.log('✅ Auth user created:', authUserId);

    // STEP 2: Create family record
    console.log('📝 Creating family record...');
    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .insert({
        name: `${firstName}'s Household`,
        currency: 'USD',
        locale: 'en',
        country: 'US',
        timezone: 'America/New_York',
        date_format: '%m-%d-%Y'
      })
      .select()
      .single();

    if (familyError) {
      console.error('❌ Family creation error:', familyError);
      return {
        success: false,
        error: 'Failed to create family record. Please try again or contact support.'
      };
    }

    const familyId = familyData.id;
    console.log('✅ Family created:', familyId);

    // STEP 3: Create users table record linking auth user to family
    console.log('📝 Creating user profile record...');
    const { error: userError } = await supabase.from('users').insert({
      id: authUserId, // Same UUID as auth.users for easy joins
      family_id: familyId,
      email: email,
      first_name: firstName,
      last_name: lastName,
      role: 'admin', // First user in family is admin
      active: true,
      theme: 'system',
      default_period: 'last_30_days',
      onboarded_at: null // Will be set after onboarding flow completes
    });

    if (userError) {
      console.error('❌ User profile creation error:', userError);
      return {
        success: false,
        error: 'Failed to create user profile. Please contact support.'
      };
    }

    console.log('✅ User profile created');
    console.log('🎉 Registration completed successfully:', {
      userId: authUserId,
      familyId: familyId,
      email: email
    });

    // Redirect to email confirmation page
    redirect('/confirm-signup');
  } catch (error) {
    console.error('💥 Unexpected error during signup:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred during registration.'
    };
  }
}
