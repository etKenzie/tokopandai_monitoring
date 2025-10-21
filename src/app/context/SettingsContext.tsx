'use client';

import { supabase } from '@/lib/supabaseClient';
import { AppSetting, SettingsContextType, SettingsData } from '@/types/settings';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const { user, roles } = useAuth();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = roles.includes('admin');

  const fetchSettings = useCallback(async () => {
    console.log('SettingsContext fetchSettings called:', {
      hasUser: !!user,
      userRoles: roles,
      isAdmin
    });
    
    if (!user) {
      console.log('No user, setting settings to null');
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all settings that the user has access to
      let query = supabase
        .from('app_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('key', { ascending: true });

      // For now, let all users access all settings to debug the issue
      // TODO: Restrict this back to only public + goal_profit + goal_cash_in once working
      // query = query.or('is_public.eq.true,key.in.(goal_profit,goal_cash_in)');

      console.log('Settings query for user:', {
        isAdmin,
        userRoles: roles,
        accessingAllSettings: true
      });

      const { data, error: fetchError } = await query;

      console.log('Settings query result:', {
        data,
        error: fetchError,
        dataLength: data?.length || 0
      });

      if (fetchError) {
        console.error('Error fetching settings:', fetchError);
        setError(fetchError.message);
        return;
      }

      // Transform settings array into SettingsData object
      const settingsData: SettingsData = {
        target_date: '2025-10-03', // default
        goal_profit: {}, // default
        goal_cash_in: {} // default
      };

      data?.forEach((setting: AppSetting) => {
        if (setting.key === 'target_date') {
          settingsData.target_date = setting.value;
        } else if (setting.key === 'goal_profit') {
          settingsData.goal_profit = setting.value;
        } else if (setting.key === 'goal_cash_in') {
          settingsData.goal_cash_in = setting.value;
        }
      });

      setSettings(settingsData);
      
      // Debug logging for settings access
      console.log('Settings loaded:', {
        isAdmin,
        userRoles: roles,
        settingsKeys: Object.keys(settingsData),
        hasGoalProfit: !!settingsData.goal_profit && Object.keys(settingsData.goal_profit).length > 0,
        hasGoalCashIn: !!settingsData.goal_cash_in && Object.keys(settingsData.goal_cash_in).length > 0,
        goalProfitAgents: settingsData.goal_profit ? Object.keys(settingsData.goal_profit) : 'No goal_profit data'
      });
    } catch (err) {
      console.error('Unexpected error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  const updateSetting = useCallback(async (key: string, value: any) => {
    if (!user || !isAdmin) {
      throw new Error('Only admins can update settings');
    }

    try {
      setError(null);

      // First, try to update the existing record
      const { data: updateData, error: updateError } = await supabase
        .from('app_settings')
        .update({
          value,
          updated_by: user.id
        })
        .eq('key', key)
        .select()
        .single();

      if (updateError) {
        // If update fails (record doesn't exist), try to insert
        if (updateError.code === 'PGRST116') {
          console.log(`Setting ${key} not found, creating new record`);
          const { data: insertData, error: insertError } = await supabase
            .from('app_settings')
            .insert({
              key,
              value,
              created_by: user.id,
              updated_by: user.id
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error inserting setting:', insertError);
            throw new Error(insertError.message);
          }
        } else {
          console.error('Error updating setting:', updateError);
          throw new Error(updateError.message);
        }
      }

      // Update local state
      setSettings(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [key]: value
        };
      });

      console.log(`Setting ${key} updated successfully`);
    } catch (err) {
      console.error('Error updating setting:', err);
      setError(err instanceof Error ? err.message : 'Failed to update setting');
      throw err;
    }
  }, [user, isAdmin]);

  const refreshSettings = useCallback(async () => {
    await fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const value: SettingsContextType = {
    settings,
    loading,
    error,
    updateSetting,
    refreshSettings,
    isAdmin
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
