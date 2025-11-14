'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Sun, Moon, Laptop } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { updateTheme } from '../actions/settings-actions';
import { themeSchema, type ThemeFormValues } from '../utils/form-schemas';
import { cn } from '@/lib/utils';

interface ThemeSectionProps {
  defaultValues: ThemeFormValues;
}

const THEMES = [
  {
    value: 'light',
    label: 'Light',
    description: 'Bright and clear',
    icon: Sun
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Easy on eyes in low light',
    icon: Moon
  },
  {
    value: 'system',
    label: 'System',
    description: 'Matches device settings',
    icon: Laptop
  }
] as const;

export function ThemeSection({ defaultValues }: ThemeSectionProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ThemeFormValues>({
    resolver: zodResolver(themeSchema),
    defaultValues
  });

  function onSubmit(data: ThemeFormValues) {
    startTransition(async () => {
      const result = await updateTheme(data);

      if (result.success) {
        toast.success('Theme updated successfully');
        // Optionally trigger theme change in real-time
        if (typeof window !== 'undefined') {
          document.documentElement.classList.toggle('dark', data.theme === 'dark');
        }
      } else {
        toast.error(result.error || 'Failed to update theme');
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
        <CardDescription>
          Choose how the app looks and feels. Select a theme or sync with your
          device settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                    >
                      {THEMES.map((theme) => {
                        const Icon = theme.icon;
                        const isSelected = field.value === theme.value;

                        return (
                          <FormItem key={theme.value}>
                            <FormLabel className="cursor-pointer">
                              <FormControl>
                                <RadioGroupItem
                                  value={theme.value}
                                  className="sr-only"
                                />
                              </FormControl>
                              <div
                                className={cn(
                                  'flex flex-col items-center gap-3 rounded-lg border-2 border-muted p-6 transition-all hover:border-primary/50',
                                  isSelected && 'border-primary bg-primary/5'
                                )}
                              >
                                <Icon
                                  className={cn(
                                    'h-8 w-8',
                                    isSelected
                                      ? 'text-primary'
                                      : 'text-muted-foreground'
                                  )}
                                />
                                <div className="text-center">
                                  <div
                                    className={cn(
                                      'font-medium',
                                      isSelected && 'text-primary'
                                    )}
                                  >
                                    {theme.label}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {theme.description}
                                  </div>
                                </div>
                              </div>
                            </FormLabel>
                          </FormItem>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
