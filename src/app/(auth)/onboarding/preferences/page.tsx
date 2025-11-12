'use client';

import { useState, useEffect } from 'react';
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
import { updatePreferences, getCurrentSettings } from './actions';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' }
];

const DATE_FORMATS = [
  { format: '%m-%d-%Y', label: 'MM-DD-YYYY', example: '01-31-2025' },
  { format: '%d-%m-%Y', label: 'DD-MM-YYYY', example: '31-01-2025' },
  { format: '%Y-%m-%d', label: 'YYYY-MM-DD', example: '2025-01-31' },
  { format: '%d/%m/%Y', label: 'DD/MM/YYYY', example: '31/01/2025' },
  { format: '%m/%d/%Y', label: 'MM/DD/YYYY', example: '01/31/2025' }
];

export default function PreferencesPage() {
  const router = useRouter();
  const [currency, setCurrency] = useState('');
  const [dateFormat, setDateFormat] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const settings = await getCurrentSettings();
      if (settings) {
        setCurrency(settings.currency);
        setDateFormat(settings.dateFormat);
      }
      setIsLoading(false);
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const result = await updatePreferences({ currency, dateFormat });

      if (result.success) {
        router.push('/onboarding/theme');
      } else {
        setError(result.error || 'Failed to update preferences');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div>Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const selectedDateFormat = DATE_FORMATS.find(
    (df) => df.format === dateFormat
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customize Your Preferences</CardTitle>
        <CardDescription>
          Step 3 of 5: Fine-tune currency and date display
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.name} ({curr.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              This will be the default currency for your accounts
            </p>
          </div>

          <div>
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select value={dateFormat} onValueChange={setDateFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Select date format" />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMATS.map((df) => (
                  <SelectItem key={df.format} value={df.format}>
                    {df.label} (e.g., {df.example})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDateFormat && (
              <p className="text-sm text-muted-foreground mt-1">
                Example: {selectedDateFormat.example}
              </p>
            )}
          </div>

          {error && <div className="text-destructive text-sm">{error}</div>}

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/onboarding/location')}
              disabled={isSaving}
            >
              Back
            </Button>
            <Button type="submit" disabled={isSaving || !currency || !dateFormat}>
              {isSaving ? 'Saving...' : 'Next'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
