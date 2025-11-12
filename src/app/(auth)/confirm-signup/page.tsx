'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { resendVerificationEmail } from './actions';
import { createClient } from '@/lib/supabase/client';

const ConfirmSignUpPage = () => {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Get user email from Supabase session
    const getUserEmail = async () => {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user?.email) {
        setEmail(user.email);
      }
    };

    getUserEmail();
  }, []);

  const handleResendEmail = async () => {
    setErrorMessage('');
    setResendSuccess(false);
    setLoading(true);

    try {
      const result = await resendVerificationEmail();

      if (result.success) {
        setResendSuccess(true);
      } else {
        setErrorMessage(result.error || 'Failed to resend verification email');
      }
    } catch (err: any) {
      console.error('Error resending verification email:', err);
      setErrorMessage(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
      <div className={cn('flex w-full max-w-2xl flex-col gap-6')}>
        <Card className='overflow-hidden'>
          <CardContent className='grid p-0 md:grid-cols-2'>
            <div className='p-6 md:p-8'>
              <div className='flex flex-col gap-6'>
                <div className='flex flex-col items-center text-center'>
                  <div className='bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-2xl'>
                    <Mail className='h-6 w-6' />
                  </div>
                  <h1 className='text-2xl font-bold'>Check Your Email</h1>
                  <p className='text-muted-foreground text-balance'>
                    We&apos;ve sent a verification link to
                    {email && (
                      <>
                        <br />
                        <strong>{email}</strong>
                      </>
                    )}
                  </p>
                </div>

                <div className='bg-muted/50 rounded-lg border p-4'>
                  <div className='flex gap-3'>
                    <CheckCircle2 className='text-primary mt-0.5 h-5 w-5 flex-shrink-0' />
                    <div className='flex-1'>
                      <h3 className='mb-1 font-medium'>Next Steps</h3>
                      <ol className='text-muted-foreground list-inside list-decimal space-y-1 text-sm'>
                        <li>Check your email inbox</li>
                        <li>Click the verification link</li>
                        <li>You&apos;ll be redirected to your dashboard</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {resendSuccess && (
                  <div className='border-primary/50 bg-primary/10 text-primary rounded-md border p-3 text-center text-sm'>
                    Verification email sent successfully! Check your inbox.
                  </div>
                )}

                {errorMessage && (
                  <div className='border-destructive/50 bg-destructive/10 text-destructive rounded-md border p-3 text-center text-sm'>
                    {errorMessage}
                  </div>
                )}

                <div className='space-y-3'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleResendEmail}
                    disabled={loading || !email}
                    className='w-full'
                  >
                    {loading ? (
                      <>
                        <Loader2 size={20} className='animate-spin' /> &nbsp;
                        Sending...
                      </>
                    ) : (
                      'Resend Verification Email'
                    )}
                  </Button>

                  <div className='text-center text-sm'>
                    <Link
                      href='/login'
                      className='hover:text-primary text-muted-foreground underline underline-offset-4'
                    >
                      Back to Login
                    </Link>
                  </div>
                </div>

                <div className='bg-muted/30 rounded-lg p-3 text-center text-xs text-muted-foreground'>
                  <strong>Tip:</strong> Check your spam folder if you
                  don&apos;t see the email within a few minutes.
                </div>
              </div>
            </div>
            <div className='bg-muted relative hidden md:block'>
              <div className='flex h-full w-full flex-col items-center justify-center gap-4 p-10'>
                <div className='bg-primary/5 rounded-full p-8'>
                  <Mail className='text-primary h-16 w-16' />
                </div>
                <p className='text-center text-sm text-muted-foreground'>
                  Email verification helps keep your account secure and ensures
                  you can recover access if needed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConfirmSignUpPage;
