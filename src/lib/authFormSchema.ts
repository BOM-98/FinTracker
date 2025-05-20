import { isValidPhoneNumber } from '@/components/ui/phone-input';
import { z } from 'zod';

export const authFormSchema = (type: string) =>
  z.object({
    // sign up
    firstName: type === 'sign-in' ? z.string().optional() : z.string().min(3),
    lastName: type === 'sign-in' ? z.string().optional() : z.string().min(3),
    address1: type === 'sign-in' ? z.string().optional() : z.string().max(50),
    city: type === 'sign-in' ? z.string().optional() : z.string().max(50),
    state:
      type === 'sign-in' ? z.string().optional() : z.string().min(2).max(30),
    postalCode:
      type === 'sign-in' ? z.string().optional() : z.string().min(3).max(6),
    dateOfBirth: type === 'sign-in' ? z.string().optional() : z.string().min(3),
    ssn: type === 'sign-in' ? z.string().optional() : z.string().min(3),
    phoneNumber:
      type === 'sign-in'
        ? z.string().optional()
        : z
            .string()
            .refine(isValidPhoneNumber, {
              message:
                'Invalid phone number. Please include country code (e.g., +1).'
            })
            .refine((value) => value.startsWith('+'), {
              message:
                'Phone number must start with + and include country code.'
            }),
    // both
    email: z.string().email(),
    password: z.string().min(8)
  });
