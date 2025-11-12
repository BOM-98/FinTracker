'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import CustomInput from '@/components/ui/custom-input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { authFormSchema } from '@/lib/authFormSchema';
import { signupAction } from './actions';

const SignUp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formSchema = authFormSchema('sign-up');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: ''
    }
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signupAction({
        email: data.email,
        password: data.password,
        firstName: data.firstName!,
        lastName: data.lastName!
      });

      // If we get here without redirect, there was an error
      if (!result.success) {
        setError(result.error || 'Registration failed. Please try again.');
      }
      // Note: On success, the action will redirect to /confirm-signup
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className={cn('flex w-full max-w-2xl flex-col gap-6')}>
        <Card className="overflow-hidden">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <Link
                    href="/"
                    className="mb-4 flex cursor-pointer items-center gap-1"
                  >
                    <Image
                      src="/icons/logo.svg"
                      width={34}
                      height={34}
                      alt="App logo"
                    />
                    <h1 className="text-26 font-ibm-plex-serif text-black-1 font-bold">
                      Wealth AI
                    </h1>
                  </Link>
                  <h1 className="text-2xl font-bold">Create an account</h1>
                  <p className="text-muted-foreground text-balance">
                    Enter your details below to create your account
                  </p>
                </div>

                {error && (
                  <div className="border-destructive/50 bg-destructive/10 text-destructive mb-4 rounded-md border p-3 text-center text-sm">
                    {error}
                  </div>
                )}

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                      <CustomInput
                        control={form.control}
                        name="firstName"
                        label="First Name"
                        placeholder="ex: John"
                      />
                      <CustomInput
                        control={form.control}
                        name="lastName"
                        label="Last Name"
                        placeholder="ex: Doe"
                      />
                    </div>
                    <div className="grid gap-2">
                      <CustomInput
                        control={form.control}
                        name="email"
                        label="Email"
                        placeholder="ex: john@doe.com"
                      />
                    </div>
                    <div className="grid gap-2">
                      <CustomInput
                        control={form.control}
                        name="password"
                        label="Password"
                        placeholder="Enter your password"
                      />
                    </div>

                    <div className="flex flex-col gap-4 pt-4">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 size={20} className="animate-spin" />{' '}
                            &nbsp; Loading...
                          </>
                        ) : (
                          'Sign Up'
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
                <div className="mt-4 text-center text-sm">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="hover:text-primary underline underline-offset-4"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
            <div className="bg-muted relative hidden md:block">
              <div className="flex h-full w-full items-center justify-center p-10">
                <p className="text-muted-foreground">
                  Consider adding a relevant image or graphic here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="text-muted-foreground hover:[&_a]:text-primary text-center text-xs text-balance [&_a]:underline [&_a]:underline-offset-4">
          By clicking continue, you agree to our{' '}
          <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
};

export default SignUp;
