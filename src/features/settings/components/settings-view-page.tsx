import { Separator } from '@/components/ui/separator';
import { getSettings } from '../actions/settings-actions';
import { ProfileSection } from './profile-section';
import { HouseholdSection } from './household-section';
import { PreferencesSection } from './preferences-section';
import { ThemeSection } from './theme-section';

export default async function SettingsViewPage() {
  const settings = await getSettings();

  return (
    <div className="flex w-full flex-col gap-8 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Separator />

      {/* Settings Sections */}
      <div className="grid gap-8 lg:max-w-4xl">
        {/* Profile Section */}
        <ProfileSection
          defaultValues={{
            first_name: settings.user.first_name,
            last_name: settings.user.last_name
          }}
          email={settings.user.email}
        />

        {/* Household Section */}
        <HouseholdSection
          defaultValues={{
            name: settings.family.name
          }}
        />

        {/* Preferences Section */}
        <PreferencesSection
          defaultValues={{
            country: settings.family.country,
            currency: settings.family.currency,
            date_format: settings.family.date_format
          }}
        />

        {/* Theme Section */}
        <ThemeSection
          defaultValues={{
            theme: settings.user.theme
          }}
        />
      </div>
    </div>
  );
}
