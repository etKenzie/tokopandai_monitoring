export interface GoalCashInLookupOptions {
  agentKey: string;
  month: string;
  year: string;
  settings?: {
    goal_cash_in?: Record<string, Record<string, number>>;
  } | null;
}

/**
 * Robust goal cash-in lookup that handles case sensitivity and format differences
 * between settings and static data
 */
export const getGoalCashIn = (options: GoalCashInLookupOptions): number => {
  const { agentKey, month, year, settings } = options;
  
  if (!month || !year) {
    console.warn('Goal cash-in lookup: Missing month or year');
    return 0;
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthIndex = parseInt(month) - 1;
  if (monthIndex < 0 || monthIndex >= 12) {
    console.warn('Goal cash-in lookup: Invalid month index', { month, monthIndex });
    return 0;
  }
  
  const monthName = monthNames[monthIndex];
  const settingsMonthYear = `${monthName} ${year}`;
  const staticMonthYear = `${monthName.toLowerCase()} ${year}`;
  
  console.log('Goal Cash-In Lookup Debug:', {
    agentKey,
    month,
    year,
    monthName,
    settingsMonthYear,
    staticMonthYear,
    hasSettings: !!settings?.goal_cash_in
  });

  // First try to get from configurable settings
  if (settings?.goal_cash_in) {
    console.log('Settings goal_cash_in structure:', {
      availableAgents: Object.keys(settings.goal_cash_in),
      agentHasSettings: !!settings.goal_cash_in[agentKey],
      agentSettings: settings.goal_cash_in[agentKey] ? Object.keys(settings.goal_cash_in[agentKey]) : 'No settings for agent'
    });
    
    // Try exact agent match with settings format (capitalized month)
    if (settings.goal_cash_in[agentKey] && settings.goal_cash_in[agentKey][settingsMonthYear]) {
      console.log('Found goal cash-in in settings for agent:', { 
        agentKey, 
        monthYear: settingsMonthYear, 
        value: settings.goal_cash_in[agentKey][settingsMonthYear] 
      });
      return settings.goal_cash_in[agentKey][settingsMonthYear];
    }
    
    // Try exact agent match with static format (lowercase month) in settings
    if (settings.goal_cash_in[agentKey] && settings.goal_cash_in[agentKey][staticMonthYear]) {
      console.log('Found goal cash-in in settings for agent (lowercase month):', { 
        agentKey, 
        monthYear: staticMonthYear, 
        value: settings.goal_cash_in[agentKey][staticMonthYear] 
      });
      return settings.goal_cash_in[agentKey][staticMonthYear];
    }
    
    // Try case-insensitive agent match with settings format
    const caseInsensitiveAgent = Object.keys(settings.goal_cash_in).find(
      key => key.toLowerCase() === agentKey.toLowerCase()
    );
    if (caseInsensitiveAgent && settings.goal_cash_in[caseInsensitiveAgent][settingsMonthYear]) {
      console.log('Found goal cash-in in settings (case-insensitive):', { 
        originalAgent: agentKey,
        matchedAgent: caseInsensitiveAgent,
        monthYear: settingsMonthYear, 
        value: settings.goal_cash_in[caseInsensitiveAgent][settingsMonthYear] 
      });
      return settings.goal_cash_in[caseInsensitiveAgent][settingsMonthYear];
    }
    
    // Try case-insensitive agent match with static format in settings
    if (caseInsensitiveAgent && settings.goal_cash_in[caseInsensitiveAgent][staticMonthYear]) {
      console.log('Found goal cash-in in settings (case-insensitive, lowercase month):', { 
        originalAgent: agentKey,
        matchedAgent: caseInsensitiveAgent,
        monthYear: staticMonthYear, 
        value: settings.goal_cash_in[caseInsensitiveAgent][staticMonthYear] 
      });
      return settings.goal_cash_in[caseInsensitiveAgent][staticMonthYear];
    }
    
    // Fallback to NATIONAL if agent not found in settings (try both formats)
    if (settings.goal_cash_in['NATIONAL'] && settings.goal_cash_in['NATIONAL'][settingsMonthYear]) {
      console.log('Using NATIONAL goal cash-in from settings:', { 
        monthYear: settingsMonthYear, 
        value: settings.goal_cash_in['NATIONAL'][settingsMonthYear] 
      });
      return settings.goal_cash_in['NATIONAL'][settingsMonthYear];
    }
    
    if (settings.goal_cash_in['NATIONAL'] && settings.goal_cash_in['NATIONAL'][staticMonthYear]) {
      console.log('Using NATIONAL goal cash-in from settings (lowercase month):', { 
        monthYear: staticMonthYear, 
        value: settings.goal_cash_in['NATIONAL'][staticMonthYear] 
      });
      return settings.goal_cash_in['NATIONAL'][staticMonthYear];
    }
  }
  
  // Fallback to static goalCashIn data if settings not available
  console.log('Goal Cash-In Lookup (fallback to static):', { 
    agentKey, 
    monthYear: staticMonthYear, 
    settingsAvailable: !!settings?.goal_cash_in
  });
  
  // Static fallback data (simplified version of goalCashIn)
  const staticGoalCashIn: Record<string, Record<string, number>> = {
    'national': {
      'january 2025': 200000000,
      'february 2025': 210000000,
      'march 2025': 220000000,
      'april 2025': 230000000,
      'may 2025': 240000000,
      'june 2025': 250000000,
      'july 2025': 260000000,
      'august 2025': 270000000,
      'september 2025': 280000000,
      'october 2025': 290000000,
      'november 2025': 300000000,
      'december 2025': 310000000,
    },
    'oki irawan': {
      'january 2025': 70000000,
      'february 2025': 75000000,
      'march 2025': 80000000,
      'april 2025': 85000000,
      'may 2025': 90000000,
      'june 2025': 95000000,
      'july 2025': 100000000,
      'august 2025': 105000000,
      'september 2025': 110000000,
      'october 2025': 115000000,
      'november 2025': 120000000,
      'december 2025': 125000000,
    },
    'rully juliandi': {
      'january 2025': 60000000,
      'february 2025': 65000000,
      'march 2025': 70000000,
      'april 2025': 75000000,
      'may 2025': 80000000,
      'june 2025': 85000000,
      'july 2025': 90000000,
      'august 2025': 95000000,
      'september 2025': 100000000,
      'october 2025': 105000000,
      'november 2025': 110000000,
      'december 2025': 115000000,
    },
    'mardi': {
      'january 2025': 20000000,
      'february 2025': 25000000,
      'march 2025': 30000000,
      'april 2025': 35000000,
      'may 2025': 40000000,
      'june 2025': 45000000,
      'july 2025': 50000000,
      'august 2025': 55000000,
      'september 2025': 60000000,
      'october 2025': 65000000,
      'november 2025': 70000000,
      'december 2025': 75000000,
    },
    'rifqi cassidy': {
      'august 2025': 20000000,
      'september 2025': 25000000,
      'october 2025': 30000000,
      'november 2025': 35000000,
      'december 2025': 40000000,
    },
    'others': {
      'january 2025': 20000000,
      'february 2025': 20000000,
      'march 2025': 20000000,
      'april 2025': 20000000,
      'may 2025': 20000000,
      'june 2025': 20000000,
      'july 2025': 20000000,
      'august 2025': 20000000,
      'september 2025': 20000000,
      'october 2025': 20000000,
      'november 2025': 20000000,
      'december 2025': 20000000,
    },
    'channel': {
      'january 2025': 20000000,
      'february 2025': 20000000,
      'march 2025': 20000000,
      'april 2025': 20000000,
      'may 2025': 20000000,
      'june 2025': 20000000,
      'july 2025': 20000000,
      'august 2025': 20000000,
      'september 2025': 20000000,
      'october 2025': 20000000,
      'november 2025': 20000000,
      'december 2025': 20000000,
    }
  };
  
  // Try exact agent match in static data
  const staticAgentKey = agentKey.toLowerCase();
  if (staticGoalCashIn[staticAgentKey] && staticGoalCashIn[staticAgentKey][staticMonthYear]) {
    console.log('Found goal cash-in for agent (static):', { 
      agentKey: staticAgentKey, 
      monthYear: staticMonthYear, 
      value: staticGoalCashIn[staticAgentKey][staticMonthYear] 
    });
    return staticGoalCashIn[staticAgentKey][staticMonthYear];
  }
  
  // Try case-insensitive agent match in static data
  const caseInsensitiveStaticAgent = Object.keys(staticGoalCashIn).find(
    key => key.toLowerCase() === staticAgentKey.toLowerCase()
  );
  if (caseInsensitiveStaticAgent && staticGoalCashIn[caseInsensitiveStaticAgent][staticMonthYear]) {
    console.log('Found goal cash-in for agent (static, case-insensitive):', { 
      originalAgent: agentKey,
      matchedAgent: caseInsensitiveStaticAgent,
      monthYear: staticMonthYear, 
      value: staticGoalCashIn[caseInsensitiveStaticAgent][staticMonthYear] 
    });
    return staticGoalCashIn[caseInsensitiveStaticAgent][staticMonthYear];
  }
  
  // Fallback to NATIONAL if agent not found
  if (staticGoalCashIn['national'] && staticGoalCashIn['national'][staticMonthYear]) {
    console.log('Using NATIONAL goal cash-in (static):', { 
      monthYear: staticMonthYear, 
      value: staticGoalCashIn['national'][staticMonthYear] 
    });
    return staticGoalCashIn['national'][staticMonthYear];
  }
  
  console.warn('No goal cash-in found for:', { 
    agentKey, 
    monthYear: settingsMonthYear, 
    staticMonthYear, 
    availableAgents: Object.keys(staticGoalCashIn),
    availableSettingsAgents: settings?.goal_cash_in ? Object.keys(settings.goal_cash_in) : 'No settings'
  });
  return 0;
};
