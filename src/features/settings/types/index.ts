export interface UserSettings {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  theme: 'light' | 'dark' | 'system';
  family_id: string;
}

export interface FamilySettings {
  id: string;
  name: string;
  country: string;
  currency: string;
  date_format: string;
  timezone?: string;
  locale?: string;
}

export interface SettingsData {
  user: UserSettings;
  family: FamilySettings;
}
