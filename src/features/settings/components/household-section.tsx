'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTransition } from 'react';
import { toast } from 'sonner';

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
import { Input } from '@/components/ui/input';

import { updateHousehold } from '../actions/settings-actions';
import {
  householdSchema,
  type HouseholdFormValues
} from '../utils/form-schemas';

interface HouseholdSectionProps {
  defaultValues: HouseholdFormValues;
}

export function HouseholdSection({ defaultValues }: HouseholdSectionProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<HouseholdFormValues>({
    resolver: zodResolver(householdSchema),
    defaultValues
  });

  function onSubmit(data: HouseholdFormValues) {
    startTransition(async () => {
      const result = await updateHousehold(data);

      if (result.success) {
        toast.success('Household name updated successfully');
      } else {
        toast.error(result.error || 'Failed to update household name');
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Household</CardTitle>
        <CardDescription>
          Manage your household name. This name is shared with all members of
          your household.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Household Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="The Smith Family, Sarah's Finances"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    This is the name that identifies your household in the app.
                  </p>
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
