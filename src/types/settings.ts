export interface AppSetting {
  id: string;
  key: string;
  value: any;
  description?: string;
  category: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface SettingsData {
  target_date: string;
  goal_profit: Record<string, Record<string, number>>;
  goal_cash_in: Record<string, Record<string, number>>;
}

export interface SettingsContextType {
  settings: SettingsData | null;
  loading: boolean;
  error: string | null;
  updateSetting: (key: string, value: any) => Promise<void>;
  refreshSettings: () => Promise<void>;
  isAdmin: boolean;
}
