/**
 * Shared Authentication Type Definitions
 *
 * Common types used across auth server actions and pages.
 * Centralized to avoid duplication and ensure consistency.
 */

/**
 * Standard result type for auth operations
 */
export type AuthResult = {
  success: boolean;
  error?: string;
};

/**
 * User signup data collected during registration
 */
export type SignupData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  ssn?: string;
};

/**
 * Result type for resending verification emails
 * (alias of AuthResult for semantic clarity)
 */
export type ResendVerificationResult = AuthResult;
