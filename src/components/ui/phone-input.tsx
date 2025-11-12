'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  getCountryCallingCode,
  parsePhoneNumberFromString,
  AsYouType, // For placeholder generation
  CountryCode as LibCountryCode, // Renamed to avoid conflict
  isValidPhoneNumber as RPNIsValidPhoneNumber, // Keep this for final validation if needed
  getCountries // Keep this for country list
} from 'libphonenumber-js/core'; // Using /core for more control, ensure metadata is loaded

// Country type alias
type Country = LibCountryCode;
import metadata from 'libphonenumber-js/metadata.min.json'; // Import metadata

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

// Types from react-phone-number-input that we might still want for consistency if we expose them
type RPNValue = string; // E.164 string

interface PhoneInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'value' | 'defaultValue' // defaultValue also handled internally
  > {
  value?: RPNValue; // Expects E.164 string
  onChange: (value?: RPNValue) => void; // Emits E.164 string
  defaultCountry?: Country;
  placeholder?: string; // This will be for the national number input
  disabled?: boolean;
}

interface CountrySelectProps {
  value?: Country;
  onChange: (value: Country) => void;
  disabled?: boolean;
  options: { value: Country; label: string }[];
}

const CountrySelectComponent: React.FC<CountrySelectProps> = ({
  // Renamed to avoid conflict with internal variable
  value,
  onChange,
  disabled,
  options
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn('justify-between rounded-r-none px-3', {
            'opacity-50': disabled
          })}
          disabled={disabled}
        >
          {value ? (
            <FlagUnicode country={value} />
          ) : (
            '🌐' // Globe icon
          )}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[300px] p-0'>
        <Command>
          <CommandInput placeholder='Search country...' />
          <CommandList>
            <ScrollArea className='h-[200px]'>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} (+${getCountryCallingCode(option.value, metadata)})`}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className='flex items-center gap-2'
                  >
                    <FlagUnicode country={option.value} />
                    <span className='flex-1 text-sm'>{option.label}</span>
                    <span className='text-foreground/50 text-sm'>
                      +{getCountryCallingCode(option.value, metadata)}
                    </span>
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4',
                        value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const FlagUnicode: React.FC<{ country: Country }> = ({ country }) => {
  const getUnicode = (countryCode: Country) => {
    if (!countryCode) return '';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    try {
      return String.fromCodePoint(...codePoints);
    } catch (e) {
      return countryCode; // fallback
    }
  };
  return (
    <span className='mr-2 flex items-center text-lg'>
      {getUnicode(country)}
    </span>
  );
};

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value: controlledValue,
      onChange,
      defaultCountry = 'US',
      placeholder,
      disabled,
      className,
      ...rest
    },
    ref
  ) => {
    const [selectedCountry, setSelectedCountry] = React.useState<
      Country | undefined
    >(defaultCountry);
    const [nationalNumber, setNationalNumber] = React.useState<string>('');

    const countryOptions = React.useMemo(
      () =>
        getCountries(metadata)
          .map((countryCode) => ({
            value: countryCode,
            label:
              new Intl.DisplayNames(['en'], { type: 'region' }).of(
                countryCode
              ) || countryCode
          }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      []
    );

    // Effect to parse controlledValue (E.164) into selectedCountry and nationalNumber
    React.useEffect(() => {
      if (controlledValue) {
        const phoneNumber = parsePhoneNumberFromString(
          controlledValue,
          metadata
        );
        if (phoneNumber && phoneNumber.country) {
          setSelectedCountry(phoneNumber.country);
          setNationalNumber(phoneNumber.nationalNumber);
        } else {
          // Reset if invalid or unparsable
          setSelectedCountry(defaultCountry);
          setNationalNumber('');
        }
      } else {
        // Reset when controlled value is cleared
        setSelectedCountry(defaultCountry);
        setNationalNumber('');
      }
    }, [controlledValue, defaultCountry]);

    // Effect to notify parent with E.164 number when internal parts change
    React.useEffect(() => {
      if (selectedCountry && nationalNumber) {
        const phoneNumber = parsePhoneNumberFromString(
          nationalNumber,
          selectedCountry,
          metadata
        );
        if (phoneNumber && phoneNumber.isValid()) {
          onChange(phoneNumber.format('E.164') as RPNValue);
        } else {
          onChange(undefined); // Or provide the partial non-E.164 number if desired
        }
      } else {
        onChange(undefined);
      }
    }, [selectedCountry, nationalNumber, onChange]);

    const handleNationalNumberChange = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      setNationalNumber(e.target.value.replace(/[^\d]/g, '')); // Allow only digits
    };

    const handleCountryChange = (newCountry: Country) => {
      setSelectedCountry(newCountry);
      // When country changes, re-evaluate the number (handled by useEffect above)
    };

    const nationalPlaceholder = React.useMemo(() => {
      if (placeholder) return placeholder;
      if (selectedCountry) {
        try {
          // Generate a placeholder for the national number format of the selected country
          const example = new AsYouType(selectedCountry, metadata).input('');
          // The above gives a formatted prefix, let's try to get a more generic one or simplify
          // This is tricky, as `libphonenumber-js` examples are full numbers.
          // For simplicity, let's return a generic one or allow override.
          // A common approach is to show something like "Phone number"
          // Or try to format an empty string with AsYouType for the country
          return (
            new AsYouType(selectedCountry, metadata).input('') || 'Enter number'
          );
        } catch (e) {
          return 'Enter number';
        }
      }
      return 'Enter number';
    }, [selectedCountry, placeholder]);

    return (
      <div className={cn('flex w-full items-center', className)}>
        <CountrySelectComponent
          value={selectedCountry}
          onChange={handleCountryChange}
          options={countryOptions}
          disabled={disabled}
        />
        <Input
          ref={ref} // Forward ref to the national number input
          type='tel'
          placeholder={nationalPlaceholder}
          value={nationalNumber}
          onChange={handleNationalNumberChange}
          className={cn('flex-grow rounded-l-none', { 'opacity-50': disabled })}
          disabled={disabled}
          {...rest} // Pass other standard input attributes
        />
      </div>
    );
  }
);
PhoneInput.displayName = 'PhoneInput';

// Expose a wrapped validator that includes metadata for the final E.164 string
const isValidPhoneNumber = (value: string | undefined | null): boolean => {
  if (!value) return false;
  return RPNIsValidPhoneNumber(value, metadata);
};

export { PhoneInput, isValidPhoneNumber };

// Updated helper to get a national placeholder for a given country
export function getPhoneNumberPlaceholder(
  countryCode?: LibCountryCode
): string | undefined {
  if (!countryCode) return 'Enter phone number';
  try {
    // This will return the formatting characters for the country, e.g. (___) ___-____ for US
    return new AsYouType(countryCode, metadata).input('');
  } catch {
    return 'Enter phone number';
  }
}
