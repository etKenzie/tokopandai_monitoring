import { goalProfit } from '@/app/(DashboardLayout)/distribusi/goalProfit';

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
    hasSettings: !!settings?.goal_profit
  });

  // First try to get from configurable settings
  if (settings?.goal_profit) {
    console.log('Settings goal_profit structure:', {
      availableAgents: Object.keys(settings.goal_profit),
      agentHasSettings: !!settings.goal_profit[agentKey],
      agentSettings: settings.goal_profit[agentKey] ? Object.keys(settings.goal_profit[agentKey]) : 'No settings for agent'
    });
    
    // Try exact agent match
    if (settings.goal_profit[agentKey] && settings.goal_profit[agentKey][settingsMonthYear]) {
      console.log('Found goal profit in settings for agent:', { 
        agentKey, 
        monthYear: settingsMonthYear, 
        value: settings.goal_profit[agentKey][settingsMonthYear] 
      });
      return settings.goal_profit[agentKey][settingsMonthYear];
    }
    
    // Try case-insensitive agent match
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
    
    // Fallback to NATIONAL if agent not found in settings
    if (settings.goal_profit['NATIONAL'] && settings.goal_profit['NATIONAL'][settingsMonthYear]) {
      console.log('Using NATIONAL goal profit from settings:', { 
        monthYear: settingsMonthYear, 
        value: settings.goal_profit['NATIONAL'][settingsMonthYear] 
      });
      return settings.goal_profit['NATIONAL'][settingsMonthYear];
    }
  }
  
  // Fallback to static goalProfit data if settings not available
  console.log('Goal Profit Lookup (fallback to static):', { 
    agentKey, 
    monthYear: staticMonthYear, 
    availableAgents: Object.keys(goalProfit),
    staticDataStructure: goalProfit[agentKey] ? Object.keys(goalProfit[agentKey]) : 'Agent not found'
  });
  
  // Try exact agent match in static data
  if (goalProfit[agentKey] && goalProfit[agentKey][staticMonthYear]) {
    console.log('Found goal profit for agent (static):', { 
      agentKey, 
      monthYear: staticMonthYear, 
      value: goalProfit[agentKey][staticMonthYear] 
    });
    return goalProfit[agentKey][staticMonthYear];
  }
  
  // Try case-insensitive agent match in static data
  const caseInsensitiveStaticAgent = Object.keys(goalProfit).find(
    key => key.toLowerCase() === agentKey.toLowerCase()
  );
  if (caseInsensitiveStaticAgent && goalProfit[caseInsensitiveStaticAgent][staticMonthYear]) {
    console.log('Found goal profit for agent (static, case-insensitive):', { 
      originalAgent: agentKey,
      matchedAgent: caseInsensitiveStaticAgent,
      monthYear: staticMonthYear, 
      value: goalProfit[caseInsensitiveStaticAgent][staticMonthYear] 
    });
    return goalProfit[caseInsensitiveStaticAgent][staticMonthYear];
  }
  
  // Fallback to NATIONAL if agent not found
  if (goalProfit['NATIONAL'] && goalProfit['NATIONAL'][staticMonthYear]) {
    console.log('Using NATIONAL goal profit (static):', { 
      monthYear: staticMonthYear, 
      value: goalProfit['NATIONAL'][staticMonthYear] 
    });
    return goalProfit['NATIONAL'][staticMonthYear];
  }
  
  console.warn('No goal profit found for:', { 
    agentKey, 
    monthYear: settingsMonthYear, 
    staticMonthYear, 
    availableAgents: Object.keys(goalProfit),
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
