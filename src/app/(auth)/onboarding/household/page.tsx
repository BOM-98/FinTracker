'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
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
        <CardTitle>Welcome! Let&apos;s set up your household</CardTitle>
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

          {error && <div className="text-destructive text-sm">{error}</div>}

          <div className="flex justify-between">
            <div /> {/* Spacer for flex layout */}
            <Button
              type="submit"
              disabled={isLoading || !householdName.trim()}
            >
              {isLoading ? 'Saving...' : 'Next'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
