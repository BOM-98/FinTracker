import { z } from 'zod';

/**
 * Simplified authentication form schema
 *
 * Sign-up now only collects essential information:
 * - First Name, Last Name (for personalization)
 * - Email, Password (for authentication)
 *
 * Additional user information (phone, address, preferences) is collected
 * during the onboarding flow or can be added later in profile settings.
 *
 * SECURITY: SSN has been removed - it was stored in plain text in user_metadata
 * which is a security risk. If SSN is legally required, implement proper encryption.
 */
export const authFormSchema = (type: string) =>
  z.object({
    // Sign-up fields
    firstName: type === 'sign-in' ? z.string().optional() : z.string().min(2).max(50),
    lastName: type === 'sign-in' ? z.string().optional() : z.string().min(2).max(50),
    // Authentication fields (required for both sign-in and sign-up)
    email: z.string().email(),
    password: z.string().min(8)
  });
