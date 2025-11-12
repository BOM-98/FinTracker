/**
 * Auth Layout - for authentication and onboarding routes
 *
 * This layout wraps:
 * - /login, /register, /confirm-signup (public auth pages)
 * - /onboarding/* (protected onboarding pages)
 *
 * Note: We don't add any redirect logic here because:
 * - Middleware handles dashboard → onboarding redirects
 * - Child layouts handle their own protection (onboarding requires auth)
 * - Login/register pages can be accessed by anyone (middleware allows)
 */
export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
