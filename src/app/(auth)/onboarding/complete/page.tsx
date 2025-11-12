'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { completeOnboarding, getOnboardingSummary } from './actions';

interface OnboardingSummary {
  householdName: string;
  country: string;
  currency: string;
  dateFormat: string;
  theme: string;
}

export default function CompletePage() {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);
  const [summary, setSummary] = useState<OnboardingSummary | null>(null);
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
          <CardTitle>You&apos;re All Set!</CardTitle>
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
