// Static goalProfit data removed - only using settings from Supabase

export interface GoalLookupOptions {
  agentKey: string;
  month: string;
  year: string;
  settings?: {
    goal_profit?: Record<string, Record<string, number>>;
  } | null;
}

/**
 * Robust goal profit lookup that handles case sensitivity and format differences
 * between settings and static data
 */
export const getGoalProfit = (options: GoalLookupOptions): number => {
  const { agentKey, month, year, settings } = options;
  
  if (!month || !year) {
    console.warn('Goal profit lookup: Missing month or year');
    return 0;
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthIndex = parseInt(month) - 1;
  if (monthIndex < 0 || monthIndex >= 12) {
    console.warn('Goal profit lookup: Invalid month index', { month, monthIndex });
    return 0;
  }
  
  const monthName = monthNames[monthIndex];
  const settingsMonthYear = `${monthName} ${year}`;
  const staticMonthYear = `${monthName.toLowerCase()} ${year}`;
  
  console.log('Goal Profit Lookup Debug:', {
    agentKey,
    month,
    year,
    monthName,
    settingsMonthYear,
    staticMonthYear,
    hasSettings: !!settings?.goal_profit,
    settingsKeys: settings?.goal_profit ? Object.keys(settings.goal_profit) : 'No settings'
  });

  // First try to get from configurable settings
  if (settings?.goal_profit) {
    console.log('Settings goal_profit structure:', {
      availableAgents: Object.keys(settings.goal_profit),
      agentHasSettings: !!settings.goal_profit[agentKey],
      agentSettings: settings.goal_profit[agentKey] ? Object.keys(settings.goal_profit[agentKey]) : 'No settings for agent',
      lookingForSettingsFormat: settingsMonthYear,
      lookingForStaticFormat: staticMonthYear,
      agentData: settings.goal_profit[agentKey] || 'No data for this agent'
    });
    
    // Try exact agent match with settings format (capitalized month)
    if (settings.goal_profit[agentKey] && settings.goal_profit[agentKey][settingsMonthYear]) {
      console.log('Found goal profit in settings for agent:', { 
        agentKey, 
        monthYear: settingsMonthYear, 
        value: settings.goal_profit[agentKey][settingsMonthYear] 
      });
      return settings.goal_profit[agentKey][settingsMonthYear];
    }
    
    // Try exact agent match with static format (lowercase month) in settings
    if (settings.goal_profit[agentKey] && settings.goal_profit[agentKey][staticMonthYear]) {
      console.log('Found goal profit in settings for agent (lowercase month):', { 
        agentKey, 
        monthYear: staticMonthYear, 
        value: settings.goal_profit[agentKey][staticMonthYear] 
      });
      return settings.goal_profit[agentKey][staticMonthYear];
    }
    
    // Try case-insensitive agent match with settings format
    const caseInsensitiveAgent = Object.keys(settings.goal_profit).find(
      key => key.toLowerCase() === agentKey.toLowerCase()
    );
    if (caseInsensitiveAgent && settings.goal_profit[caseInsensitiveAgent][settingsMonthYear]) {
      console.log('Found goal profit in settings (case-insensitive):', { 
        originalAgent: agentKey,
        matchedAgent: caseInsensitiveAgent,
        monthYear: settingsMonthYear, 
        value: settings.goal_profit[caseInsensitiveAgent][settingsMonthYear] 
      });
      return settings.goal_profit[caseInsensitiveAgent][settingsMonthYear];
    }
    
    // Try case-insensitive agent match with static format in settings
    if (caseInsensitiveAgent && settings.goal_profit[caseInsensitiveAgent][staticMonthYear]) {
      console.log('Found goal profit in settings (case-insensitive, lowercase month):', { 
        originalAgent: agentKey,
        matchedAgent: caseInsensitiveAgent,
        monthYear: staticMonthYear, 
        value: settings.goal_profit[caseInsensitiveAgent][staticMonthYear] 
      });
      return settings.goal_profit[caseInsensitiveAgent][staticMonthYear];
    }
    
    // Fallback to NATIONAL if agent not found in settings (try both formats)
    if (settings.goal_profit['NATIONAL'] && settings.goal_profit['NATIONAL'][settingsMonthYear]) {
      console.log('Using NATIONAL goal profit from settings:', { 
        monthYear: settingsMonthYear, 
        value: settings.goal_profit['NATIONAL'][settingsMonthYear] 
      });
      return settings.goal_profit['NATIONAL'][settingsMonthYear];
    }
    
    if (settings.goal_profit['NATIONAL'] && settings.goal_profit['NATIONAL'][staticMonthYear]) {
      console.log('Using NATIONAL goal profit from settings (lowercase month):', { 
        monthYear: staticMonthYear, 
        value: settings.goal_profit['NATIONAL'][staticMonthYear] 
      });
      return settings.goal_profit['NATIONAL'][staticMonthYear];
    }
  }
  
  // No fallback to static data - only use settings from Supabase
  console.log('No goal profit found in settings, returning 0');
  
  console.warn('No goal profit found for:', { 
    agentKey, 
    monthYear: settingsMonthYear, 
    staticMonthYear, 
    availableSettingsAgents: settings?.goal_profit ? Object.keys(settings.goal_profit) : 'No settings'
  });
  return 0;
};

/**
 * Get profit goals for chart range (for monthly chart)
 */
export const getProfitGoalsForChart = (options: GoalLookupOptions): Record<string, number> => {
  const { agentKey, settings } = options;
  
  if (!settings?.goal_profit) return {};
  
  // Try exact agent match
  if (settings.goal_profit[agentKey]) {
    console.log('Profit goals for chart (exact match):', { agentKey, goals: settings.goal_profit[agentKey] });
    return settings.goal_profit[agentKey];
  }
  
  // Try case-insensitive agent match
  const caseInsensitiveAgent = Object.keys(settings.goal_profit).find(
    key => key.toLowerCase() === agentKey.toLowerCase()
  );
  if (caseInsensitiveAgent) {
    console.log('Profit goals for chart (case-insensitive):', { 
      originalAgent: agentKey,
      matchedAgent: caseInsensitiveAgent,
      goals: settings.goal_profit[caseInsensitiveAgent] 
    });
    return settings.goal_profit[caseInsensitiveAgent];
  }
  
  // Fallback to NATIONAL
  const nationalGoals = settings.goal_profit['NATIONAL'] || {};
  console.log('Profit goals for chart (NATIONAL fallback):', { agentKey, goals: nationalGoals });
  return nationalGoals;
};
