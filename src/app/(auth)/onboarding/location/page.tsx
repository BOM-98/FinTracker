'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { updateCountry } from './actions';

const COUNTRIES = [
  { code: 'US', name: 'United States', currency: 'USD', dateFormat: '%m-%d-%Y' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', dateFormat: '%d-%m-%Y' },
  { code: 'CA', name: 'Canada', currency: 'CAD', dateFormat: '%Y-%m-%d' },
  { code: 'AU', name: 'Australia', currency: 'AUD', dateFormat: '%d-%m-%Y' },
  { code: 'DE', name: 'Germany', currency: 'EUR', dateFormat: '%d.%m.%Y' },
  { code: 'FR', name: 'France', currency: 'EUR', dateFormat: '%d/%m/%Y' },
  { code: 'JP', name: 'Japan', currency: 'JPY', dateFormat: '%Y/%m/%d' },
  { code: 'IN', name: 'India', currency: 'INR', dateFormat: '%d-%m-%Y' }
];

export default function LocationSetupPage() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const country = COUNTRIES.find((c) => c.code === selectedCountry);
    if (!country) {
      setError('Please select a country');
      setIsLoading(false);
      return;
    }

    try {
      const result = await updateCountry({
        country: country.code,
        currency: country.currency,
        dateFormat: country.dateFormat
      });

      if (result.success) {
        router.push('/onboarding/preferences');
      } else {
        setError(result.error || 'Failed to update location');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCountryData = COUNTRIES.find((c) => c.code === selectedCountry);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where are you located?</CardTitle>
        <CardDescription>
          Step 2 of 5: This helps us set default currency and formats
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="country">Country</Label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCountryData && (
            <div className="bg-muted p-4 rounded-md space-y-2">
              <h3 className="font-semibold">
                Default settings for {selectedCountryData.name}:
              </h3>
              <ul className="text-sm space-y-1">
                <li>Currency: {selectedCountryData.currency}</li>
                <li>Date format: {selectedCountryData.dateFormat}</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                You can customize these on the next step
              </p>
            </div>
          )}

          {error && <div className="text-destructive text-sm">{error}</div>}

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/onboarding/household')}
              disabled={isLoading}
            >
              Back
            </Button>
            <Button type="submit" disabled={isLoading || !selectedCountry}>
              {isLoading ? 'Saving...' : 'Next'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
