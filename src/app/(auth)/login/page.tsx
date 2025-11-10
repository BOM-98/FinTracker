'use client';

import React, { useState, useTransition } from 'react';
import { Fingerprint, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { loginAction } from './actions';

const LoginPage = () => {
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleToggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and Password required.');
      return;
    }

    startTransition(async () => {
      try {
        // Create FormData from form inputs
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        // Call the server action for login
        const result = await loginAction(formData);

        // Handle error response (redirect happens automatically on success)
        if (result && !result.success) {
          setError(result.error || 'Login failed. Please try again.');
        }
      } catch (err: any) {
        console.error('Login failed:', err);
        setError(err.message || 'An unexpected error occurred.');
      }
    });
  };

  return (
    <div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
      <div className={cn('flex w-full max-w-2xl flex-col gap-6')}>
        <Card className='overflow-hidden'>
          <CardContent className='grid p-0 md:grid-cols-2'>
            <div className='p-6 md:p-8'>
              <div className='flex flex-col gap-6'>
                <div className='flex flex-col items-center text-center'>
                  <div className='bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-2xl'>
                    <Fingerprint className='h-6 w-6' />
                  </div>
                  <h1 className='text-2xl font-bold'>Welcome back</h1>
                  <p className='text-muted-foreground text-balance'>
                    Please enter your details to log in
                  </p>
                </div>

                {error && (
                  <div className='border-destructive/50 bg-destructive/10 text-destructive mb-2 rounded-md border p-3 text-center text-sm'>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className='space-y-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                      id='email'
                      type='text'
                      placeholder='m@example.com'
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isPending}
                    />
                  </div>

                  <div className='grid gap-2'>
                    <div className='flex items-center'>
                      <Label htmlFor='password'>Password</Label>
                      <Link
                        href='#'
                        className='text-muted-foreground hover:text-primary ml-auto text-sm underline-offset-2 hover:underline'
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <div className='relative'>
                      <Input
                        id='password'
                        type={showPassword ? 'text' : 'password'}
                        placeholder='••••••••'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isPending}
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={handleToggleShowPassword}
                        className='text-muted-foreground hover:text-primary absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2'
                        aria-label='Toggle password visibility'
                        disabled={isPending}
                      >
                        {showPassword ? (
                          <EyeOff className='h-4 w-4' />
                        ) : (
                          <Eye className='h-4 w-4' />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button type='submit' disabled={isPending} className='w-full'>
                    {isPending ? (
                      <>
                        <Loader2 size={20} className='animate-spin' /> &nbsp;
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </Button>
                </form>

                <div className='mt-4 text-center text-sm'>
                  Don&apos;t have an account?{' '}
                  <Link
                    href='/register'
                    className='hover:text-primary underline underline-offset-4'
                  >
                    Create account
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

export default LoginPage;
