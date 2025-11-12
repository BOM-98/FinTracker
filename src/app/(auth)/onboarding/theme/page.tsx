'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sun, Moon, Monitor } from 'lucide-react';
import { updateTheme } from './actions';

const THEMES = [
  {
    value: 'light',
    label: 'Light',
    description: 'Bright and clear interface',
    icon: Sun
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Easy on the eyes in low light',
    icon: Moon
  },
  {
    value: 'system',
    label: 'System',
    description: 'Matches your device settings',
    icon: Monitor
  }
];

export default function ThemePage() {
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState('system');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await updateTheme(selectedTheme);

      if (result.success) {
        router.push('/onboarding/complete');
      } else {
        setError(result.error || 'Failed to update theme');
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
        <CardTitle>Choose Your Theme</CardTitle>
        <CardDescription>
          Step 4 of 5: Select how you want the app to look
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <RadioGroup value={selectedTheme} onValueChange={setSelectedTheme}>
            <div className="space-y-3">
              {THEMES.map((theme) => {
                const Icon = theme.icon;
                return (
                  <label
                    key={theme.value}
                    className={`flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                      selectedTheme === theme.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={theme.value} id={theme.value} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <span className="font-semibold">{theme.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {theme.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </RadioGroup>

          {error && <div className="text-destructive text-sm">{error}</div>}

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/onboarding/preferences')}
              disabled={isLoading}
            >
              Back
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Next'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
