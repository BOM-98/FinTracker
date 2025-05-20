'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignupStore } from '@/hooks/useSignupStore';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { z } from 'zod';
import { confirmSignUp } from '@aws-amplify/auth';

const ConfirmSignUpPage = () => {
  const router = useRouter();
  const { email, clearEmail } = useSignupStore();

  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // If no email is in the store, redirect to /sign-up
  useEffect(() => {
    if (isMounted && !email) {
      console.warn('No email found. Redirecting to /sign-up...');
      router.push('/register');
    }
  }, [email, router, isMounted]);

  const ConfirmSignUpSchema = z.object({
    email: z.string().email('Must be a valid email.'),
    code: z.string().nonempty('Confirmation code is required.')
  });

  const handleConfirmSignUpAction = async (data: {
    email: string;
    code: string;
  }) => {
    // 2) Parse & validate data
    const { email, code } = ConfirmSignUpSchema.parse(data);

    // 3) Actually call confirmSignUp with Amplify
    const result = await confirmSignUp({
      username: email,
      confirmationCode: code
    });

    return result; // or return some custom success object
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email) {
      setErrorMessage('Email address is missing. Please go back to sign up.');
      return;
    }

    if (!code.trim()) {
      setErrorMessage('Confirmation code is required.');
      return;
    }

    setLoading(true);
    try {
      // 2) Instead of calling confirmSignUp directly, call your server action
      await handleConfirmSignUpAction({ email: email!, code });

      console.log('Confirm sign-up success');
      clearEmail(); // clear out the email from Zustand

      // Navigate to login
      router.push('/login');
    } catch (err: any) {
      console.error('Error confirming sign-up:', err);
      setErrorMessage(err.message || 'Error confirming sign-up.');
    } finally {
      setLoading(false);
    }
  };

  // Render placeholder or nothing until mounted and email logic has run
  if (!isMounted) {
    // Render a loading state or null during the initial client render pass
    // This ensures the client renders the same as the server initially
    // A skeleton matching the layout could also be used for better UX.
    return null; // Or <SomeLoadingSkeleton />;
  }

  // If mounted but email is missing (should have been redirected, but as a safeguard)
  if (!email) {
    // Or redirect again, or show an error message. Returning null prevents rendering the form.
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
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={1.5}
                      stroke='currentColor'
                      className='h-6 w-6'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                  </div>
                  <h1 className='text-2xl font-bold'>Confirm Your Account</h1>
                  <p className='text-muted-foreground text-balance'>
                    We have sent a verification code to <br />
                    <strong>{email}</strong>. Please enter it below.
                  </p>
                </div>

                {errorMessage && (
                  <div className='border-destructive/50 bg-destructive/10 text-destructive mb-2 rounded-md border p-3 text-center text-sm'>
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className='space-y-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='confirmation-code' className='sr-only'>
                      Confirmation Code
                    </Label>
                    <Input
                      id='confirmation-code'
                      type='text'
                      placeholder='Enter 6-digit code'
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <Button
                    type='submit'
                    disabled={loading || !isMounted || !email}
                    className='w-full'
                  >
                    {loading ? (
                      <>
                        <Loader2 size={20} className='animate-spin' /> &nbsp;
                        Verifying...
                      </>
                    ) : (
                      'Verify Account'
                    )}
                  </Button>
                </form>

                <div className='mt-4 text-center text-sm'>
                  Did not get your code?{' '}
                  <Link
                    href='/login'
                    className='hover:text-primary underline underline-offset-4'
                  >
                    Resend
                  </Link>
                </div>
              </div>
            </div>
            <div className='bg-muted relative hidden md:block'>
              <div className='flex h-full w-full items-center justify-center p-10'>
                <p className='text-muted-foreground'>
                  Consider adding a relevant image or graphic here.
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
