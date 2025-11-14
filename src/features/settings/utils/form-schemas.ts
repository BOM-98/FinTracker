import * as z from 'zod';

// Profile section schema
export const profileSchema = z.object({
  first_name: z
    .string()
    .min(2, { message: 'First name must be at least 2 characters' })
    .max(50, { message: 'First name must be less than 50 characters' }),
  last_name: z
    .string()
    .min(2, { message: 'Last name must be at least 2 characters' })
    .max(50, { message: 'Last name must be less than 50 characters' })
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

// Household section schema
export const householdSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Household name must be at least 2 characters' })
    .max(100, { message: 'Household name must be less than 100 characters' })
});

export type HouseholdFormValues = z.infer<typeof householdSchema>;

// Preferences section schema
export const preferencesSchema = z.object({
  country: z.string().min(1, { message: 'Please select a country' }),
  currency: z.string().min(1, { message: 'Please select a currency' }),
  date_format: z.string().min(1, { message: 'Please select a date format' })
});

export type PreferencesFormValues = z.infer<typeof preferencesSchema>;

// Theme section schema
export const themeSchema = z.object({
  theme: z.enum(['light', 'dark', 'system'], {
    required_error: 'Please select a theme'
  })
});

export type ThemeFormValues = z.infer<typeof themeSchema>;
