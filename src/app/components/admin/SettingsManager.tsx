'use client';

import { useSettings } from '@/app/context/SettingsContext';
import { Add, Cancel, Delete, Edit, Save } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { goalCashIn } from '../../(DashboardLayout)/distribusi/goalCashIn';
// Static goalProfit data removed - only using settings from Supabase

// Goals API types
interface GoalFromApi {
  id: number;
  period_id: number;
  scope: string;
  goal_type: string;
  target_value: number;
  description: string;
  created_at: string;
  agent_key: string;
  weight: number | null;
  period_start_date?: string;
  period_end_date?: string;
  agent_name: string | null;
  period_type?: 'month' | 'year' | 'quarter';
  period?: string; // e.g. "February 2026", "Q1 2026", "2026"
}

interface AgentFromApi {
  id: number;
  name: string;
}

interface GoalPeriodFromApi {
  id: number;
  period_type: 'month' | 'quarter' | 'year';
  year: number;
  quarter: number | null;
  month: number | null;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface GoalProfitEntry {
  agent: string;
  monthYear: string;
  value: number;
}

interface GoalCashInEntry {
  agent: string;
  monthYear: string;
  value: number;
}

interface AgentGoalProfits {
  [agent: string]: {
    [monthYear: string]: number;
  };
}

interface AgentGoalCashIns {
  [agent: string]: {
    [monthYear: string]: number;
  };
}

interface GoalProgressItem {
  id: number;
  period_id: number;
  scope: string;
  goal_type: string;
  target_value: number;
  description: string | null;
  agent_key: string;
  agent_name: string | null;
  weight: number | null;
  progress: {
    id: number;
    actual_value: number;
    recorded_at: string;
    notes?: string;
  };
}

interface BonusFromApi {
  id: number;
  agent_id: number;
  period_id: number;
  bonus_amount: number;
  created_at: string;
  agent_name: string;
  period_title: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const MONTH_OPTIONS = [
  { value: '', label: 'All months' },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(2000, i)),
  })),
];

const SettingsManager = () => {
  const { settings, loading, error, updateSetting, isAdmin } = useSettings();
  const [targetDate, setTargetDate] = useState('');
  const [goalProfitData, setGoalProfitData] = useState<AgentGoalProfits>({});
  const [goalCashInData, setGoalCashInData] = useState<AgentGoalCashIns>({});
  const [editingEntry, setEditingEntry] = useState<GoalProfitEntry | null>(null);
  const [editingCashInEntry, setEditingCashInEntry] = useState<GoalCashInEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cashInDialogOpen, setCashInDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [expandedCashInAgents, setExpandedCashInAgents] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingCashIn, setIsEditingCashIn] = useState(false);

  // Goals overview from API
  const [goalsFromApi, setGoalsFromApi] = useState<GoalFromApi[]>([]);
  const [agentsFromApi, setAgentsFromApi] = useState<AgentFromApi[]>([]);
  const [goalTypesFromApi, setGoalTypesFromApi] = useState<string[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalsError, setGoalsError] = useState<string | null>(null);
  const [goalsScope, setGoalsScope] = useState<string>('');
  const [goalsAgentId, setGoalsAgentId] = useState<string>('');
  const [goalsGoalType, setGoalsGoalType] = useState<string>(''); // required; set from filters when loaded
  const [goalsMonth, setGoalsMonth] = useState<string>(''); // 1-12 or ''
  const [goalsYear, setGoalsYear] = useState<string>(() => String(new Date().getFullYear()));
  const [activeTab, setActiveTab] = useState(0); // 0 = Goals, 1 = Settings, 2 = Periods, 3 = Goal progress, 4 = Bonus
  const [progressMonth, setProgressMonth] = useState<string>(() => String(new Date().getMonth() + 1));
  const [progressYear, setProgressYear] = useState<string>(() => String(new Date().getFullYear()));
  const [progressGoalType, setProgressGoalType] = useState<string>('');
  const [progressPeriods, setProgressPeriods] = useState<GoalPeriodFromApi[]>([]);
  const [progressGoals, setProgressGoals] = useState<GoalProgressItem[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressEditOpen, setProgressEditOpen] = useState(false);
  const [progressEditId, setProgressEditId] = useState<number | null>(null);
  const [progressEditActualValue, setProgressEditActualValue] = useState(0);
  const [progressEditNotes, setProgressEditNotes] = useState('');
  const [progressEditSaving, setProgressEditSaving] = useState(false);
  const [periodsFromApi, setPeriodsFromApi] = useState<GoalPeriodFromApi[]>([]);
  const [periodsPageYear, setPeriodsPageYear] = useState<string>(() => String(new Date().getFullYear()));
  const [periodsPageList, setPeriodsPageList] = useState<GoalPeriodFromApi[]>([]);
  const [periodsPageLoading, setPeriodsPageLoading] = useState(false);
  const [periodEditOpen, setPeriodEditOpen] = useState(false);
  const [periodEditId, setPeriodEditId] = useState<number | null>(null);
  const [periodEditStartDate, setPeriodEditStartDate] = useState('');
  const [periodEditEndDate, setPeriodEditEndDate] = useState('');
  const [periodEditSaving, setPeriodEditSaving] = useState(false);
  const [periodCreateOpen, setPeriodCreateOpen] = useState(false);
  const [periodCreateSaving, setPeriodCreateSaving] = useState(false);
  const [periodCreateForm, setPeriodCreateForm] = useState({
    period_type: 'month' as 'month' | 'quarter' | 'year',
    year: new Date().getFullYear(),
    quarter: 1,
    month: 1,
    start_date: '',
    end_date: '',
  });
  const [periodDeleteConfirmId, setPeriodDeleteConfirmId] = useState<number | null>(null);
  const [periodDeleteSaving, setPeriodDeleteSaving] = useState(false);
  const [createGoalOpen, setCreateGoalOpen] = useState(false);
  const [createGoalSaving, setCreateGoalSaving] = useState(false);
  const [createGoalError, setCreateGoalError] = useState<string | null>(null);
  const [createGoalForm, setCreateGoalForm] = useState<{
    period_id: number;
    period_label: string;
    scope: 'national' | 'agent';
    agent_name: string;
    goal_type: string;
    target_value: number;
    description: string;
    weight?: number; // only used when scope is agent
  }>({
    period_id: 0,
    period_label: '',
    scope: 'agent',
    agent_name: '',
    goal_type: '',
    target_value: 0,
    description: '',
    weight: 0.5,
  });
  const [periodSelectAnchor, setPeriodSelectAnchor] = useState<null | HTMLElement>(null);
  const [editGoalOpen, setEditGoalOpen] = useState(false);
  const [editGoalId, setEditGoalId] = useState<number | null>(null);
  const [editGoalTargetValue, setEditGoalTargetValue] = useState(0);
  const [editGoalDescription, setEditGoalDescription] = useState('');
  const [editGoalWeight, setEditGoalWeight] = useState<number | null>(null);
  const [editGoalSaving, setEditGoalSaving] = useState(false);
  const [editGoalError, setEditGoalError] = useState<string | null>(null);
  const [editGoalDeleteConfirmOpen, setEditGoalDeleteConfirmOpen] = useState(false);
  const [editGoalDeleting, setEditGoalDeleting] = useState(false);
  const [bonusYear, setBonusYear] = useState<string>(() => String(new Date().getFullYear()));
  const [bonuses, setBonuses] = useState<BonusFromApi[]>([]);
  const [bonusLoading, setBonusLoading] = useState(false);
  const [bonusPeriods, setBonusPeriods] = useState<GoalPeriodFromApi[]>([]);
  const [bonusEditOpen, setBonusEditOpen] = useState(false);
  const [bonusEditId, setBonusEditId] = useState<number | null>(null);
  const [bonusEditAmount, setBonusEditAmount] = useState(0);
  const [bonusEditSaving, setBonusEditSaving] = useState(false);
  const [bonusDeleteConfirmOpen, setBonusDeleteConfirmOpen] = useState(false);
  const [bonusDeleting, setBonusDeleting] = useState(false);
  const [bonusEditError, setBonusEditError] = useState<string | null>(null);
  const [bonusCreateOpen, setBonusCreateOpen] = useState(false);
  const [bonusCreateSaving, setBonusCreateSaving] = useState(false);
  const [bonusCreateError, setBonusCreateError] = useState<string | null>(null);
  const [bonusCreateForm, setBonusCreateForm] = useState({ agent_id: 0, period_id: 0, period_label: '', bonus_amount: 0 });
  const [periodPickerFor, setPeriodPickerFor] = useState<'goal' | 'bonus' | null>(null);

  // Available agents from settings data
  const availableAgents = settings?.goal_profit ? Object.keys(settings.goal_profit).sort() : [];

  // Available months/years
  const availableMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const availableYears = ['2024', '2025', '2026'];

  const getMonthYearOptions = () => {
    const options: string[] = [];
    availableYears.forEach(year => {
      availableMonths.forEach(month => {
        options.push(`${month} ${year}`);
      });
    });
    return options;
  };

  // Fetch goals filters (agents + goal_types) for the selected year
  const fetchGoalsFilters = useCallback(async (year: string) => {
    if (!API_BASE || !year) return;
    try {
      const res = await fetch(`${API_BASE}/api/goals/filters?year=${encodeURIComponent(year)}`);
      const json = await res.json();
      if (json?.data) {
        const agents = json.data.agents ?? [];
        const goalTypes = json.data.goal_types ?? [];
        setAgentsFromApi(agents);
        setGoalTypesFromApi(goalTypes);
        setGoalsGoalType((prev) => {
          if (goalTypes.length && !goalTypes.includes(prev)) return goalTypes[0];
          return prev;
        });
      }
    } catch (e) {
      console.error('Failed to fetch goals filters:', e);
    }
  }, []);

  // Fetch goals; year and goal_type are required
  const fetchGoals = useCallback(async () => {
    if (!API_BASE || !goalsGoalType) return;
    const year = goalsYear || String(new Date().getFullYear());
    setGoalsLoading(true);
    setGoalsError(null);
    try {
      const params = new URLSearchParams();
      params.set('year', year);
      params.set('goal_type', goalsGoalType);
      if (goalsScope) params.set('scope', goalsScope);
      if (goalsAgentId) params.set('agent_id', goalsAgentId);
      if (goalsMonth) params.set('month', String(goalsMonth)); // integer 1-12
      const url = `${API_BASE}/api/goals?${params.toString()}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json?.data?.goals) setGoalsFromApi(json.data.goals);
      else setGoalsFromApi([]);
      if (json?.code !== 200) setGoalsError(json?.message || 'Failed to load goals');
    } catch (e) {
      setGoalsError('Failed to load goals');
      setGoalsFromApi([]);
    } finally {
      setGoalsLoading(false);
    }
  }, [goalsScope, goalsAgentId, goalsGoalType, goalsMonth, goalsYear]);

  const fetchGoalsPeriods = useCallback(async () => {
    if (!API_BASE) return;
    try {
      const res = await fetch(`${API_BASE}/api/goals/periods`);
      const json = await res.json();
      if (Array.isArray(json?.data)) setPeriodsFromApi(json.data);
      else setPeriodsFromApi([]);
    } catch (e) {
      console.error('Failed to fetch periods:', e);
    }
  }, []);

  useEffect(() => {
    fetchGoalsFilters(goalsYear);
  }, [goalsYear, fetchGoalsFilters]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  useEffect(() => {
    if (createGoalOpen || bonusCreateOpen) fetchGoalsPeriods();
  }, [createGoalOpen, bonusCreateOpen, fetchGoalsPeriods]);

  const fetchPeriodsPage = useCallback(async (year: string) => {
    if (!API_BASE || !year) return;
    setPeriodsPageLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/goals/periods?year=${encodeURIComponent(year)}`);
      const json = await res.json();
      if (Array.isArray(json?.data)) setPeriodsPageList(json.data);
      else setPeriodsPageList([]);
    } catch (e) {
      console.error('Failed to fetch periods:', e);
      setPeriodsPageList([]);
    } finally {
      setPeriodsPageLoading(false);
    }
  }, []);

  const openPeriodEdit = (p: GoalPeriodFromApi) => {
    setPeriodEditId(p.id);
    setPeriodEditStartDate(p.start_date ? p.start_date.slice(0, 10) : '');
    setPeriodEditEndDate(p.end_date ? p.end_date.slice(0, 10) : '');
    setPeriodEditOpen(true);
  };

  const handlePeriodEditSubmit = async () => {
    if (!API_BASE || periodEditId == null) return;
    setPeriodEditSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/goals/periods/${periodEditId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_date: periodEditStartDate, end_date: periodEditEndDate }),
      });
      const json = await res.json();
      if (json?.code === 200) {
        setPeriodEditOpen(false);
        fetchPeriodsPage(periodsPageYear);
        fetchGoalsPeriods();
      }
    } finally {
      setPeriodEditSaving(false);
    }
  };

  const handlePeriodCreateSubmit = async () => {
    if (!API_BASE) return;
    setPeriodCreateSaving(true);
    try {
      const body = {
        period_type: periodCreateForm.period_type,
        year: periodCreateForm.year,
        quarter: periodCreateForm.period_type === 'year' ? null : (periodCreateForm.quarter || null),
        month: periodCreateForm.period_type === 'month' ? (periodCreateForm.month ?? null) : null,
        start_date: periodCreateForm.start_date,
        end_date: periodCreateForm.end_date,
      };
      const res = await fetch(`${API_BASE}/api/goals/periods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json?.code === 200) {
        setPeriodCreateOpen(false);
        setPeriodCreateForm({ period_type: 'month', year: new Date().getFullYear(), quarter: 1, month: 1, start_date: '', end_date: '' });
        fetchPeriodsPage(periodsPageYear);
        fetchGoalsPeriods();
      }
    } finally {
      setPeriodCreateSaving(false);
    }
  };

  const handlePeriodDelete = async () => {
    if (!API_BASE || periodDeleteConfirmId == null) return;
    setPeriodDeleteSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/goals/periods/${periodDeleteConfirmId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json?.code === 200) {
        setPeriodDeleteConfirmId(null);
        fetchPeriodsPage(periodsPageYear);
        fetchGoalsPeriods();
      }
    } finally {
      setPeriodDeleteSaving(false);
    }
  };

  const formatDateDisplay = (iso: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  };

  const formatPeriodPageTitle = (p: GoalPeriodFromApi) => {
    if (p.period_type === 'month' && p.month != null) {
      return new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(2000, p.month - 1)) + ' ' + p.year;
    }
    if (p.period_type === 'quarter' && p.quarter != null) return `Q${p.quarter} ${p.year}`;
    if (p.period_type === 'year') return `Year ${p.year}`;
    return `Period ${p.id}`;
  };

  useEffect(() => {
    if (activeTab === 2 && periodsPageYear) fetchPeriodsPage(periodsPageYear);
  }, [activeTab, periodsPageYear, fetchPeriodsPage]);

  const fetchGoalProgress = useCallback(async (month: string, year: string, goalType: string) => {
    if (!API_BASE || !month || !year || !goalType) return;
    setProgressLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/goals/progress?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}&goal_type=${encodeURIComponent(goalType)}`);
      const json = await res.json();
      if (json?.data) {
        setProgressPeriods(json.data.periods ?? []);
        setProgressGoals(json.data.goals ?? []);
      } else {
        setProgressPeriods([]);
        setProgressGoals([]);
      }
    } catch (e) {
      console.error('Failed to fetch goal progress:', e);
      setProgressPeriods([]);
      setProgressGoals([]);
    } finally {
      setProgressLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 3 && progressYear) fetchGoalsFilters(progressYear);
  }, [activeTab, progressYear, fetchGoalsFilters]);

  useEffect(() => {
    if (activeTab === 3 && progressMonth && progressYear && progressGoalType) fetchGoalProgress(progressMonth, progressYear, progressGoalType);
  }, [activeTab, progressMonth, progressYear, progressGoalType, fetchGoalProgress]);

  const fetchBonuses = useCallback(async (year: string) => {
    if (!API_BASE || !year) return;
    setBonusLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/bonus?year=${encodeURIComponent(year)}`);
      const json = await res.json();
      if (json?.data?.bonuses) {
        setBonuses(json.data.bonuses);
      } else {
        setBonuses([]);
      }
    } catch (e) {
      console.error('Failed to fetch bonuses:', e);
      setBonuses([]);
    } finally {
      setBonusLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 4 && bonusYear) fetchBonuses(bonusYear);
  }, [activeTab, bonusYear, fetchBonuses]);

  const fetchBonusPeriods = useCallback(async (year: string) => {
    if (!API_BASE || !year) return;
    try {
      const res = await fetch(`${API_BASE}/api/goals/periods?year=${encodeURIComponent(year)}`);
      const json = await res.json();
      setBonusPeriods(json?.data?.periods ?? []);
    } catch (e) {
      console.error('Failed to fetch periods for bonus:', e);
      setBonusPeriods([]);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 4 && bonusYear) {
      fetchGoalsFilters(bonusYear);
      fetchBonusPeriods(bonusYear);
    }
  }, [activeTab, bonusYear, fetchGoalsFilters, fetchBonusPeriods]);

  const openEditBonus = (b: BonusFromApi) => {
    setBonusEditId(b.id);
    setBonusEditAmount(b.bonus_amount);
    setBonusEditError(null);
    setBonusEditOpen(true);
  };

  const handleBonusEditSubmit = async () => {
    if (!API_BASE || bonusEditId == null) return;
    setBonusEditSaving(true);
    setBonusEditError(null);
    try {
      const res = await fetch(`${API_BASE}/api/bonus/${bonusEditId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bonus_amount: Number(bonusEditAmount) || 0 }),
      });
      const json = await res.json();
      if (json?.code === 200) {
        setBonusEditOpen(false);
        fetchBonuses(bonusYear);
      } else {
        setBonusEditError(json?.message || 'Failed to update bonus');
      }
    } catch (e) {
      setBonusEditError('Failed to update bonus');
    } finally {
      setBonusEditSaving(false);
    }
  };

  const handleBonusDelete = async () => {
    if (!API_BASE || bonusEditId == null) return;
    setBonusDeleting(true);
    setBonusEditError(null);
    try {
      const res = await fetch(`${API_BASE}/api/bonus/${bonusEditId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json?.code === 200) {
        setBonusDeleteConfirmOpen(false);
        setBonusEditOpen(false);
        fetchBonuses(bonusYear);
      } else {
        setBonusEditError(json?.message || 'Failed to delete bonus');
      }
    } catch (e) {
      setBonusEditError('Failed to delete bonus');
    } finally {
      setBonusDeleting(false);
    }
  };

  const handleBonusCreateSubmit = async () => {
    if (!API_BASE || !bonusCreateForm.agent_id || !bonusCreateForm.period_id) return;
    setBonusCreateSaving(true);
    setBonusCreateError(null);
    try {
      const res = await fetch(`${API_BASE}/api/bonus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: Number(bonusCreateForm.agent_id),
          period_id: Number(bonusCreateForm.period_id),
          bonus_amount: Number(bonusCreateForm.bonus_amount) || 0,
        }),
      });
      const json = await res.json();
      if (json?.code === 200) {
        setBonusCreateOpen(false);
        fetchBonuses(bonusYear);
      } else {
        setBonusCreateError(json?.message || 'Failed to create bonus');
      }
    } catch (e) {
      setBonusCreateError('Failed to create bonus');
    } finally {
      setBonusCreateSaving(false);
    }
  };

  const progressPeriodById = useMemo(() => {
    const map: Record<number, GoalPeriodFromApi> = {};
    progressPeriods.forEach((p) => { map[p.id] = p; });
    return map;
  }, [progressPeriods]);

  const progressByType = useMemo(() => {
    const year: GoalProgressItem[] = [];
    const quarter: GoalProgressItem[] = [];
    const month: GoalProgressItem[] = [];
    progressGoals.forEach((g) => {
      const p = progressPeriodById[g.period_id];
      if (!p) return;
      if (p.period_type === 'year') year.push(g);
      else if (p.period_type === 'quarter') quarter.push(g);
      else month.push(g);
    });
    const byAgent = (list: GoalProgressItem[]) => {
      const national = list.filter((x) => x.scope === 'national');
      const agent: Record<string, GoalProgressItem[]> = {};
      list.filter((x) => x.scope === 'agent').forEach((x) => {
        const key = x.agent_name || x.agent_key || 'Unknown';
        if (!agent[key]) agent[key] = [];
        agent[key].push(x);
      });
      return { national, agent };
    };
    return {
      year: byAgent(year),
      quarter: byAgent(quarter),
      month: byAgent(month),
    };
  }, [progressGoals, progressPeriodById]);

  const openProgressEdit = (g: GoalProgressItem) => {
    if (!g.progress) return;
    setProgressEditId(g.progress.id);
    setProgressEditActualValue(g.progress.actual_value ?? 0);
    setProgressEditNotes(g.progress.notes ?? '');
    setProgressEditOpen(true);
  };

  const handleProgressEditSubmit = async () => {
    if (!API_BASE || progressEditId == null) return;
    setProgressEditSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/goals/progress/${progressEditId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actual_value: Number(progressEditActualValue) || 0,
          notes: progressEditNotes || '',
        }),
      });
      const json = await res.json();
      if (json?.code === 200) {
        setProgressEditOpen(false);
        fetchGoalProgress(progressMonth, progressYear, progressGoalType);
      }
    } finally {
      setProgressEditSaving(false);
    }
  };

  const periodsByType = useMemo(() => {
    const year: GoalPeriodFromApi[] = [];
    const quarter: GoalPeriodFromApi[] = [];
    const month: GoalPeriodFromApi[] = [];
    periodsPageList.forEach((p) => {
      if (p.period_type === 'year') year.push(p);
      else if (p.period_type === 'quarter') quarter.push(p);
      else month.push(p);
    });
    quarter.sort((a, b) => (a.quarter ?? 0) - (b.quarter ?? 0));
    month.sort((a, b) => (a.month ?? 0) - (b.month ?? 0));
    return { year, quarter, month };
  }, [periodsPageList]);

  // Group goals: national and by agent; within each, split by period_type (year, quarter, month)
  const { nationalByType, agentByType } = useMemo(() => {
    const national = goalsFromApi.filter(g => g.scope === 'national');
    const agent = goalsFromApi.filter(g => g.scope === 'agent');
    const byType = (list: GoalFromApi[]) => {
      const year: GoalFromApi[] = [];
      const quarter: GoalFromApi[] = [];
      const month: GoalFromApi[] = [];
      list.forEach(g => {
        const t = g.period_type || 'month';
        if (t === 'year') year.push(g);
        else if (t === 'quarter') quarter.push(g);
        else month.push(g);
      });
      const sortByDateOrId = (x: GoalFromApi, y: GoalFromApi) =>
        (x.period_start_date && y.period_start_date)
          ? new Date(x.period_start_date).getTime() - new Date(y.period_start_date).getTime()
          : (x.period_id - y.period_id);
      quarter.sort(sortByDateOrId);
      month.sort(sortByDateOrId);
      return { year, quarter, month };
    };
    const nationalByType = byType(national);
    const byAgent: Record<string, { year: GoalFromApi[]; quarter: GoalFromApi[]; month: GoalFromApi[] }> = {};
    agent.forEach(g => {
      const key = g.agent_name || g.agent_key || 'Unknown';
      if (!byAgent[key]) byAgent[key] = { year: [], quarter: [], month: [] };
      const t = g.period_type || 'month';
      if (t === 'year') byAgent[key].year.push(g);
      else if (t === 'quarter') byAgent[key].quarter.push(g);
      else byAgent[key].month.push(g);
    });
    const sortByDateOrId = (a: GoalFromApi, b: GoalFromApi) =>
      (a.period_start_date && b.period_start_date)
        ? new Date(a.period_start_date).getTime() - new Date(b.period_start_date).getTime()
        : (a.period_id - b.period_id);
    Object.keys(byAgent).forEach(k => {
      byAgent[k].quarter.sort(sortByDateOrId);
      byAgent[k].month.sort(sortByDateOrId);
    });
    return { nationalByType, agentByType: byAgent };
  }, [goalsFromApi]);

  // Group periods by year, then by type (month, quarter, year) for create-goal period picker
  const periodsByYear = useMemo(() => {
    const byYear: Record<number, { month: GoalPeriodFromApi[]; quarter: GoalPeriodFromApi[]; year: GoalPeriodFromApi[] }> = {};
    periodsFromApi.forEach((p) => {
      if (!byYear[p.year]) byYear[p.year] = { month: [], quarter: [], year: [] };
      if (p.period_type === 'month') byYear[p.year].month.push(p);
      else if (p.period_type === 'quarter') byYear[p.year].quarter.push(p);
      else if (p.period_type === 'year') byYear[p.year].year.push(p);
    });
    const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);
    years.forEach((y) => {
      byYear[y].month.sort((a, b) => (a.month ?? 0) - (b.month ?? 0));
      byYear[y].quarter.sort((a, b) => (a.quarter ?? 0) - (b.quarter ?? 0));
    });
    return { byYear, years };
  }, [periodsFromApi]);

  const formatPeriodLabel = (p: GoalPeriodFromApi) => {
    if (p.period_type === 'month' && p.month) {
      return new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(2000, p.month - 1)) + ' ' + p.year;
    }
    if (p.period_type === 'quarter' && p.quarter) return `Q${p.quarter} ${p.year}`;
    if (p.period_type === 'year') return String(p.year);
    return `Period ${p.id}`;
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

  const getPeriodLabel = (g: GoalFromApi) =>
    g.period ?? (g.period_start_date && g.period_end_date
      ? `${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(g.period_start_date))} – ${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(g.period_end_date))}`
      : '—');

  const isCurrentGoal = (g: GoalFromApi) => {
    const type = g.period_type || 'month';
    if (type === 'year') return false; // no highlight for year
    const now = new Date();
    const currentYear = now.getFullYear();
    const period = (g.period || '').trim();
    if (type === 'quarter') {
      const q = Math.ceil((now.getMonth() + 1) / 3);
      return period === `Q${q} ${currentYear}`;
    }
    const currentMonthLabel = new Intl.DateTimeFormat('en', { month: 'long' }).format(now) + ' ' + currentYear;
    return period === currentMonthLabel;
  };

  const handleCreateGoalSubmit = async () => {
    if (!API_BASE || !createGoalForm.period_id || !createGoalForm.goal_type) return;
    setCreateGoalSaving(true);
    setCreateGoalError(null);
    try {
      const body: Record<string, unknown> = {
        period_id: createGoalForm.period_id,
        scope: createGoalForm.scope,
        goal_type: createGoalForm.goal_type,
        target_value: Number(createGoalForm.target_value) || 0,
        description: createGoalForm.description || '',
      };
      if (createGoalForm.scope === 'agent') {
        body.agent_name = createGoalForm.agent_name || '';
        body.weight = Number(createGoalForm.weight) ?? 0.5;
      }
      const res = await fetch(`${API_BASE}/api/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json?.code === 200) {
        setCreateGoalOpen(false);
        fetchGoals();
      } else {
        setCreateGoalError(json?.message || 'Failed to create goal');
      }
    } catch (e) {
      setCreateGoalError('Failed to create goal');
    } finally {
      setCreateGoalSaving(false);
    }
  };

  const openEditGoal = (g: GoalFromApi) => {
    setEditGoalId(g.id);
    setEditGoalTargetValue(g.target_value);
    setEditGoalDescription(g.description || '');
    setEditGoalWeight(g.weight ?? null);
    setEditGoalError(null);
    setEditGoalOpen(true);
  };

  const handleEditGoalSubmit = async () => {
    if (!API_BASE || editGoalId == null) return;
    setEditGoalSaving(true);
    setEditGoalError(null);
    try {
      const res = await fetch(`${API_BASE}/api/goals/${editGoalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_value: Number(editGoalTargetValue) || 0,
          description: editGoalDescription || '',
          ...(editGoalWeight != null && { weight: Number(editGoalWeight) }),
        }),
      });
      const json = await res.json();
      if (json?.code === 200) {
        setEditGoalOpen(false);
        fetchGoals();
      } else {
        setEditGoalError(json?.message || 'Failed to update goal');
      }
    } catch (e) {
      setEditGoalError('Failed to update goal');
    } finally {
      setEditGoalSaving(false);
    }
  };

  const handleEditGoalDelete = async () => {
    if (!API_BASE || editGoalId == null) return;
    setEditGoalDeleting(true);
    setEditGoalError(null);
    try {
      const res = await fetch(`${API_BASE}/api/goals/${editGoalId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json?.code === 200) {
        setEditGoalDeleteConfirmOpen(false);
        setEditGoalOpen(false);
        fetchGoals();
      } else {
        setEditGoalError(json?.message || 'Failed to delete goal');
      }
    } catch (e) {
      setEditGoalError('Failed to delete goal');
    } finally {
      setEditGoalDeleting(false);
    }
  };

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setTargetDate(settings.target_date || '2025-10-03');
      setGoalProfitData(settings.goal_profit || {});
      setGoalCashInData(settings.goal_cash_in || {});
    }
  }, [settings]);

  const toggleAgentExpansion = (agent: string) => {
    const newExpanded = new Set(expandedAgents);
    if (newExpanded.has(agent)) {
      newExpanded.delete(agent);
    } else {
      newExpanded.add(agent);
    }
    setExpandedAgents(newExpanded);
  };

  const toggleCashInAgentExpansion = (agent: string) => {
    const newExpanded = new Set(expandedCashInAgents);
    if (newExpanded.has(agent)) {
      newExpanded.delete(agent);
    } else {
      newExpanded.add(agent);
    }
    setExpandedCashInAgents(newExpanded);
  };

  const getAgentList = () => {
    return Object.keys(goalProfitData).sort();
  };

  const getCashInAgentList = () => {
    return Object.keys(goalCashInData).sort();
  };

  const getAgentMonths = (agent: string) => {
    return Object.entries(goalProfitData[agent] || {}).sort(([a], [b]) => {
      // Sort by month/year
      const dateA = new Date(a + ' 01');
      const dateB = new Date(b + ' 01');
      return dateA.getTime() - dateB.getTime();
    });
  };

  const getCashInAgentMonths = (agent: string) => {
    return Object.entries(goalCashInData[agent] || {}).sort(([a], [b]) => {
      // Sort by month/year
      const dateA = new Date(a + ' 01');
      const dateB = new Date(b + ' 01');
      return dateA.getTime() - dateB.getTime();
    });
  };

  const handleTargetDateChange = async () => {
    if (!targetDate) return;
    
    try {
      setSaving(true);
      await updateSetting('target_date', targetDate);
    } catch (err) {
      console.error('Failed to update target date:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddGoalProfit = () => {
    setEditingEntry({
      agent: '',
      monthYear: '',
      value: 0
    });
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleEditGoalProfit = (agent: string, monthYear: string, value: number) => {
    setEditingEntry({
      agent,
      monthYear,
      value
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleSaveGoalProfit = async () => {
    if (!editingEntry || !editingEntry.agent || !editingEntry.monthYear) return;

    try {
      setSaving(true);
      
      // Update local state
      const updatedData = { ...goalProfitData };
      if (!updatedData[editingEntry.agent]) {
        updatedData[editingEntry.agent] = {};
      }
      updatedData[editingEntry.agent][editingEntry.monthYear] = editingEntry.value;
      setGoalProfitData(updatedData);

      await updateSetting('goal_profit', updatedData);
      setDialogOpen(false);
      setEditingEntry(null);
    } catch (err) {
      console.error('Failed to save goal profit:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoalProfit = async (agent: string, monthYear: string) => {
    try {
      setSaving(true);
      
      const updatedData = { ...goalProfitData };
      if (updatedData[agent]) {
        delete updatedData[agent][monthYear];
        // If agent has no more months, remove the agent
        if (Object.keys(updatedData[agent]).length === 0) {
          delete updatedData[agent];
        }
      }
      setGoalProfitData(updatedData);

      await updateSetting('goal_profit', updatedData);
    } catch (err) {
      console.error('Failed to delete goal profit:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAgent = async (agent: string) => {
    try {
      setSaving(true);
      
      const updatedData = { ...goalProfitData };
      delete updatedData[agent];
      setGoalProfitData(updatedData);

      await updateSetting('goal_profit', updatedData);
    } catch (err) {
      console.error('Failed to delete agent:', err);
    } finally {
      setSaving(false);
    }
  };

  // Cash-In Goal handlers
  const handleAddGoalCashIn = () => {
    setEditingCashInEntry({
      agent: '',
      monthYear: '',
      value: 0
    });
    setIsEditingCashIn(false);
    setCashInDialogOpen(true);
  };

  const handleEditGoalCashIn = (agent: string, monthYear: string, value: number) => {
    setEditingCashInEntry({
      agent,
      monthYear,
      value
    });
    setIsEditingCashIn(true);
    setCashInDialogOpen(true);
  };

  const handleSaveGoalCashIn = async () => {
    if (!editingCashInEntry || !editingCashInEntry.agent || !editingCashInEntry.monthYear) return;

    try {
      setSaving(true);
      
      // Update local state
      const updatedData = { ...goalCashInData };
      if (!updatedData[editingCashInEntry.agent]) {
        updatedData[editingCashInEntry.agent] = {};
      }
      updatedData[editingCashInEntry.agent][editingCashInEntry.monthYear] = editingCashInEntry.value;
      setGoalCashInData(updatedData);

      await updateSetting('goal_cash_in', updatedData);
      setCashInDialogOpen(false);
      setEditingCashInEntry(null);
    } catch (err) {
      console.error('Failed to save goal cash-in:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoalCashIn = async (agent: string, monthYear: string) => {
    try {
      setSaving(true);
      
      const updatedData = { ...goalCashInData };
      if (updatedData[agent]) {
        delete updatedData[agent][monthYear];
        // If agent has no more months, remove the agent
        if (Object.keys(updatedData[agent]).length === 0) {
          delete updatedData[agent];
        }
      }
      setGoalCashInData(updatedData);

      await updateSetting('goal_cash_in', updatedData);
    } catch (err) {
      console.error('Failed to delete goal cash-in:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCashInAgent = async (agent: string) => {
    try {
      setSaving(true);
      
      const updatedData = { ...goalCashInData };
      delete updatedData[agent];
      setGoalCashInData(updatedData);

      await updateSetting('goal_cash_in', updatedData);
    } catch (err) {
      console.error('Failed to delete cash-in agent:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleImportStaticCashInData = async () => {
    try {
      setSaving(true);
      
      // Convert the static goalCashIn data to the format expected by settings
      const staticData: AgentGoalCashIns = {};
      Object.entries(goalCashIn).forEach(([agent, months]) => {
        staticData[agent] = Object.assign({}, months);
      });
      
      setGoalCashInData(staticData);
      await updateSetting('goal_cash_in', staticData);
    } catch (err) {
      console.error('Failed to import static cash-in data:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleImportStaticData = async () => {
    try {
      setSaving(true);
      
      // Note: Static data import removed - only using settings from Supabase
      console.log('Static data import is no longer available - using settings from Supabase only');
      
    } catch (err) {
      console.error('Failed to import static data:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <Alert severity="error">
        You don&apos;t have permission to access settings management.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Application Settings
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tab label="Goals" />
        <Tab label="Settings (Target date)" />
        <Tab label="Periods" />
        <Tab label="Goal progress" />
        <Tab label="Bonus" />
      </Tabs>

      {activeTab === 0 && (
        <Card>
          <CardHeader
            title="Goals Overview"
            subheader="View national and agent goals. Select year and goal type (required); other filters are optional."
            action={
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setCreateGoalForm({
                    period_id: 0,
                    period_label: '',
                    scope: 'agent',
                    agent_name: agentsFromApi[0]?.name ?? '',
                    goal_type: goalTypesFromApi[0] ?? '',
                    target_value: 0,
                    description: '',
                    weight: 0.5,
                  });
                  setCreateGoalError(null);
                  setCreateGoalOpen(true);
                }}
              >
                Create new goal
              </Button>
            }
          />
          <CardContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}>
              <TextField
                size="small"
                label="Year"
                type="number"
                value={goalsYear}
                onChange={(e) => setGoalsYear(e.target.value)}
                sx={{ minWidth: 90 }}
              />
              <FormControl size="small" sx={{ minWidth: 140 }} required>
                <InputLabel>Goal type</InputLabel>
                <Select
                  value={goalsGoalType}
                  label="Goal type"
                  onChange={(e) => setGoalsGoalType(e.target.value)}
                  displayEmpty
                >
                  {goalTypesFromApi.map((gt) => (
                    <MenuItem key={gt} value={gt}>
                      {gt}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Scope</InputLabel>
                <Select value={goalsScope} label="Scope" onChange={(e) => setGoalsScope(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="national">National</MenuItem>
                  <MenuItem value="agent">Agent</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Agent</InputLabel>
                <Select value={goalsAgentId} label="Agent" onChange={(e) => setGoalsAgentId(e.target.value)}>
                  <MenuItem value="">All agents</MenuItem>
                  {agentsFromApi.map((a) => (
                    <MenuItem key={a.id} value={String(a.id)}>{a.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Month</InputLabel>
                <Select
                  value={goalsMonth}
                  label="Month"
                  onChange={(e) => setGoalsMonth(e.target.value)}
                >
                  {MONTH_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value || 'all'} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {goalsError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setGoalsError(null)}>
                {goalsError}
              </Alert>
            )}

            {goalsLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={3}>
                {/* National — full width */}
                {(nationalByType.year.length > 0 || nationalByType.quarter.length > 0 || nationalByType.month.length > 0) && (
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                      National
                    </Typography>
                    {/* Year: full-width block */}
                    {nationalByType.year.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        {nationalByType.year.map((g) => (
                          <Box
                            key={g.id}
                            onClick={() => openEditGoal(g)}
                            sx={{
                              width: '100%',
                              py: 2,
                              px: 2,
                              borderRadius: 1,
                              border: '2px solid',
                              borderColor: isCurrentGoal(g) ? 'primary.main' : 'divider',
                              bgcolor: isCurrentGoal(g) ? 'primary.light' : 'action.hover',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'action.selected' },
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              YEAR {g.period || getPeriodLabel(g)} · {g.goal_type || '—'}
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                              {formatCurrency(g.target_value)}
                            </Typography>
                            {g.weight != null && (
                              <Typography variant="caption" color="text.secondary">Weight: {g.weight}</Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}
                    {/* Quarter: 3 smaller blocks */}
                    {nationalByType.quarter.length > 0 && (
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 2 }}>
                        {nationalByType.quarter.slice(0, 3).map((g, idx) => (
                          <Box
                            key={g.id}
                            onClick={() => openEditGoal(g)}
                            sx={{
                              py: 1.5,
                              px: 2,
                              borderRadius: 1,
                              border: '2px solid',
                              borderColor: isCurrentGoal(g) ? 'primary.main' : 'divider',
                              bgcolor: isCurrentGoal(g) ? 'primary.light' : 'background.default',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'action.selected' },
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              {getPeriodLabel(g)} · {g.goal_type || '—'}
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {formatCurrency(g.target_value)}
                            </Typography>
                            {g.weight != null && (
                              <Typography variant="caption" color="text.secondary" display="block">Weight: {g.weight}</Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}
                    {/* Month: table — Period first, highlight current */}
                    {nationalByType.month.length > 0 && (
                      <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                              <TableCell>Period</TableCell>
                              <TableCell>Goal type</TableCell>
                              <TableCell align="right">Target value</TableCell>
                              <TableCell align="right">Weight</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {nationalByType.month.map((g) => (
                              <TableRow
                                key={g.id}
                                hover
                                onClick={() => openEditGoal(g)}
                                sx={{
                                  cursor: 'pointer',
                                  ...(isCurrentGoal(g)
                                    ? { bgcolor: 'primary.light', borderLeft: '4px solid', borderColor: 'primary.main' }
                                    : {}),
                                }}
                              >
                                <TableCell sx={{ fontWeight: isCurrentGoal(g) ? 'bold' : 'normal' }}>
                                  {getPeriodLabel(g)}
                                </TableCell>
                                <TableCell>{g.goal_type || '—'}</TableCell>
                                <TableCell align="right">{formatCurrency(g.target_value)}</TableCell>
                                <TableCell align="right">{g.weight != null ? String(g.weight) : '—'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}

                {/* Agents — 2 columns */}
                {Object.keys(agentByType).length > 0 && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                    {Object.entries(agentByType).map(([agentName, types]) => (
                      <Box
                        key={agentName}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          p: 2,
                          bgcolor: 'background.paper',
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight="bold" color="secondary" gutterBottom>
                          {agentName}
                        </Typography>
                        {/* Year: full width of card */}
                        {types.year.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            {types.year.map((g) => (
                              <Box
                                key={g.id}
                                onClick={() => openEditGoal(g)}
                                sx={{
                                  width: '100%',
                                  py: 1.5,
                                  px: 2,
                                  borderRadius: 1,
                                  border: '2px solid',
                                  borderColor: isCurrentGoal(g) ? 'primary.main' : 'divider',
                                  bgcolor: isCurrentGoal(g) ? 'primary.light' : 'action.hover',
                                  cursor: 'pointer',
                                  '&:hover': { bgcolor: 'action.selected' },
                                }}
                              >
                                <Typography variant="caption" color="text.secondary">
                                  YEAR {g.period || getPeriodLabel(g)} · {g.goal_type || '—'}
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                  {formatCurrency(g.target_value)}
                                </Typography>
                                {g.weight != null && (
                                  <Typography variant="caption" color="text.secondary">Weight: {g.weight}</Typography>
                                )}
                              </Box>
                            ))}
                          </Box>
                        )}
                        {/* Quarter: 3 blocks */}
                        {types.quarter.length > 0 && (
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 2 }}>
                            {types.quarter.slice(0, 3).map((g, idx) => (
                              <Box
                                key={g.id}
                                onClick={() => openEditGoal(g)}
                                sx={{
                                  py: 1,
                                  px: 1.5,
                                  borderRadius: 1,
                                  border: '2px solid',
                                  borderColor: isCurrentGoal(g) ? 'primary.main' : 'divider',
                                  bgcolor: isCurrentGoal(g) ? 'primary.light' : 'background.default',
                                  cursor: 'pointer',
                                  '&:hover': { bgcolor: 'action.selected' },
                                }}
                              >
                                <Typography variant="caption" color="text.secondary">{getPeriodLabel(g)}</Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {formatCurrency(g.target_value)}
                                </Typography>
                                {g.weight != null && (
                                  <Typography variant="caption" color="text.secondary" display="block">Weight: {g.weight}</Typography>
                                )}
                              </Box>
                            ))}
                          </Box>
                        )}
                        {/* Month: table — Period first, highlight current */}
                        {types.month.length > 0 && (
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                  <TableCell>Period</TableCell>
                                  <TableCell>Goal type</TableCell>
                                  <TableCell align="right">Target</TableCell>
                                  <TableCell align="right">Weight</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {types.month.map((g) => (
                                  <TableRow
                                    key={g.id}
                                    hover
                                    onClick={() => openEditGoal(g)}
                                    sx={{
                                      cursor: 'pointer',
                                      ...(isCurrentGoal(g)
                                        ? { bgcolor: 'primary.light', borderLeft: '4px solid', borderColor: 'primary.main' }
                                        : {}),
                                    }}
                                  >
                                    <TableCell sx={{ fontWeight: isCurrentGoal(g) ? 'bold' : 'normal' }}>
                                      {getPeriodLabel(g)}
                                    </TableCell>
                                    <TableCell>{g.goal_type || '—'}</TableCell>
                                    <TableCell align="right">{formatCurrency(g.target_value)}</TableCell>
                                    <TableCell align="right">{g.weight != null ? String(g.weight) : '—'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}

                {nationalByType.year.length === 0 &&
                  nationalByType.quarter.length === 0 &&
                  nationalByType.month.length === 0 &&
                  Object.keys(agentByType).length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No goals found. Adjust filters or ensure the goals API returns data for the selected year.
                    </Typography>
                  )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create new goal dialog */}
      <Dialog open={createGoalOpen} onClose={() => setCreateGoalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create new goal</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Period
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={(e) => {
                  setPeriodPickerFor('goal');
                  setPeriodSelectAnchor(e.currentTarget);
                }}
                sx={{ justifyContent: 'space-between', textTransform: 'none' }}
              >
                {createGoalForm.period_label || 'Select period'}
              </Button>
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel>Scope</InputLabel>
              <Select
                value={createGoalForm.scope}
                label="Scope"
                onChange={(e) => {
                  const scope = e.target.value as 'national' | 'agent';
                  setCreateGoalForm((prev) => ({
                    ...prev,
                    scope,
                    weight: scope === 'national' ? undefined : (prev.weight ?? 0.5),
                  }));
                }}
              >
                <MenuItem value="national">National</MenuItem>
                <MenuItem value="agent">Agent</MenuItem>
              </Select>
            </FormControl>
            {createGoalForm.scope === 'agent' && (
              <FormControl fullWidth size="small">
                <InputLabel>Agent</InputLabel>
                <Select
                  value={createGoalForm.agent_name}
                  label="Agent"
                  onChange={(e) => setCreateGoalForm((prev) => ({ ...prev, agent_name: e.target.value }))}
                >
                  {agentsFromApi.map((a) => (
                    <MenuItem key={a.id} value={a.name}>{a.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <FormControl fullWidth size="small">
              <InputLabel>Goal type</InputLabel>
              <Select
                value={createGoalForm.goal_type}
                label="Goal type"
                onChange={(e) => setCreateGoalForm((prev) => ({ ...prev, goal_type: e.target.value }))}
              >
                {goalTypesFromApi.map((gt) => (
                  <MenuItem key={gt} value={gt}>{gt}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Target value"
              type="number"
              value={createGoalForm.target_value || ''}
              onChange={(e) => setCreateGoalForm((prev) => ({ ...prev, target_value: Number(e.target.value) || 0 }))}
              fullWidth
              size="small"
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Description"
              value={createGoalForm.description}
              onChange={(e) => setCreateGoalForm((prev) => ({ ...prev, description: e.target.value }))}
              fullWidth
              size="small"
            />
            {createGoalForm.scope === 'agent' && (
              <TextField
                label="Weight"
                type="number"
                value={createGoalForm.weight ?? 0.5}
                onChange={(e) => setCreateGoalForm((prev) => ({ ...prev, weight: Number(e.target.value) || 0.5 }))}
                fullWidth
                size="small"
                inputProps={{ min: 0, max: 1, step: 0.1 }}
              />
            )}
            {createGoalError && (
              <Alert severity="error" onClose={() => setCreateGoalError(null)}>
                {createGoalError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateGoalOpen(false)} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateGoalSubmit}
            disabled={createGoalSaving || !createGoalForm.period_id || !createGoalForm.goal_type}
            startIcon={createGoalSaving ? <CircularProgress size={16} /> : <Save />}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit goal dialog */}
      <Dialog open={editGoalOpen} onClose={() => setEditGoalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit goal</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Target value"
              type="number"
              value={editGoalTargetValue || ''}
              onChange={(e) => setEditGoalTargetValue(Number(e.target.value) || 0)}
              fullWidth
              size="small"
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Description"
              value={editGoalDescription}
              onChange={(e) => setEditGoalDescription(e.target.value)}
              fullWidth
              size="small"
              multiline
            />
            <TextField
              label="Weight"
              type="number"
              value={editGoalWeight ?? ''}
              onChange={(e) => setEditGoalWeight(e.target.value === '' ? null : Number(e.target.value))}
              fullWidth
              size="small"
              placeholder="Optional (e.g. 0.5)"
              inputProps={{ min: 0, max: 1, step: 0.1 }}
            />
            {editGoalError && (
              <Alert severity="error" onClose={() => setEditGoalError(null)}>
                {editGoalError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
          <Button
            color="error"
            onClick={() => setEditGoalDeleteConfirmOpen(true)}
            disabled={editGoalSaving}
          >
            Delete
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setEditGoalOpen(false)} startIcon={<Cancel />}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleEditGoalSubmit}
              disabled={editGoalSaving}
              startIcon={editGoalSaving ? <CircularProgress size={16} /> : <Save />}
            >
              Save
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Delete goal confirmation */}
      <Dialog
        open={editGoalDeleteConfirmOpen}
        onClose={() => !editGoalDeleting && setEditGoalDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete goal?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this goal? This cannot be undone.</Typography>
          {editGoalError && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setEditGoalError(null)}>
              {editGoalError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditGoalDeleteConfirmOpen(false)} disabled={editGoalDeleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleEditGoalDelete}
            disabled={editGoalDeleting}
            startIcon={editGoalDeleting ? <CircularProgress size={16} /> : <Delete />}
          >
            {editGoalDeleting ? 'Deleting…' : 'Yes, delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={periodSelectAnchor}
        open={Boolean(periodSelectAnchor)}
        onClose={() => { setPeriodSelectAnchor(null); setPeriodPickerFor(null); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { maxHeight: 400, minWidth: 420 } }}
      >
        {periodsByYear.years.map((year) => {
          const row = periodsByYear.byYear[year];
          if (!row) return null;
          const maxRows = Math.max(row.month.length, row.quarter.length, row.year.length, 1);
          return (
            <Box key={year} sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                {year}
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ width: '33%' }}>Month</TableCell>
                    <TableCell sx={{ width: '33%' }}>Quarter</TableCell>
                    <TableCell sx={{ width: '33%' }}>Year</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from({ length: maxRows }, (_, i) => (
                    <TableRow key={`${year}-${i}`}>
                      <TableCell padding="none" sx={{ verticalAlign: 'top' }}>
                        {row.month[i] ? (
                          <MenuItem
                            dense
                            onClick={() => {
                              const p = row.month[i];
                              if (periodPickerFor === 'bonus') {
                                setBonusCreateForm((prev) => ({ ...prev, period_id: p.id, period_label: formatPeriodLabel(p) }));
                              } else {
                                setCreateGoalForm((prev) => ({ ...prev, period_id: p.id, period_label: formatPeriodLabel(p) }));
                              }
                              setPeriodSelectAnchor(null);
                              setPeriodPickerFor(null);
                            }}
                          >
                            <ListItemText primary={formatPeriodLabel(row.month[i])} />
                          </MenuItem>
                        ) : null}
                      </TableCell>
                      <TableCell padding="none" sx={{ verticalAlign: 'top' }}>
                        {row.quarter[i] ? (
                          <MenuItem
                            dense
                            onClick={() => {
                              const p = row.quarter[i];
                              if (periodPickerFor === 'bonus') {
                                setBonusCreateForm((prev) => ({ ...prev, period_id: p.id, period_label: formatPeriodLabel(p) }));
                              } else {
                                setCreateGoalForm((prev) => ({ ...prev, period_id: p.id, period_label: formatPeriodLabel(p) }));
                              }
                              setPeriodSelectAnchor(null);
                              setPeriodPickerFor(null);
                            }}
                          >
                            <ListItemText primary={formatPeriodLabel(row.quarter[i])} />
                          </MenuItem>
                        ) : null}
                      </TableCell>
                      <TableCell padding="none" sx={{ verticalAlign: 'top' }}>
                        {row.year[i] ? (
                          <MenuItem
                            dense
                            onClick={() => {
                              const p = row.year[i];
                              if (periodPickerFor === 'bonus') {
                                setBonusCreateForm((prev) => ({ ...prev, period_id: p.id, period_label: formatPeriodLabel(p) }));
                              } else {
                                setCreateGoalForm((prev) => ({ ...prev, period_id: p.id, period_label: formatPeriodLabel(p) }));
                              }
                              setPeriodSelectAnchor(null);
                              setPeriodPickerFor(null);
                            }}
                          >
                            <ListItemText primary={formatPeriodLabel(row.year[i])} />
                          </MenuItem>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          );
        })}
      </Menu>

      {activeTab === 1 && (
      <Grid container spacing={3}>
        {/* Target Date Setting - first in Settings tab */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader title="Target Date" />
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Set the target date for calculating days remaining in the sales overview.
              </Typography>
              <Box display="flex" gap={2} alignItems="center" mt={2}>
                <TextField
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  size="small"
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={handleTargetDateChange}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                >
                  Save
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Goal Profit Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader 
              title="Goal Profit Targets"
              action={
                <Box display="flex" gap={1}>
                  {/* <Button
                    variant="outlined"
                    onClick={handleImportStaticData}
                    disabled={saving}
                    size="small"
                  >
                    Import Static Data
                  </Button> */}
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAddGoalProfit}
                    size="small"
                  >
                    Add Target
                  </Button>
                </Box>
              }
            />
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Set profit goals for different agents and months.
              </Typography>
              
              <Box mt={2}>
                {getAgentList().length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    No goal profit targets set.
                  </Typography>
                ) : (
                  <Box display="flex" flexDirection="column" gap={2}>
                    {getAgentList().map((agent) => {
                      const months = getAgentMonths(agent);
                      const isExpanded = expandedAgents.has(agent);
                      const totalValue = months.reduce((sum, [, value]) => sum + value, 0);
                      
                      return (
                        <Box key={agent} border={1} borderColor="divider" borderRadius={1}>
                          {/* Agent Header */}
                          <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            p={2}
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': { backgroundColor: 'action.hover' }
                            }}
                            onClick={() => toggleAgentExpansion(agent)}
                          >
                            <Box display="flex" alignItems="center" gap={2}>
                              <Typography variant="h6" fontWeight="bold">
                                {agent}
                              </Typography>
                              <Chip 
                                label={`${months.length} months`} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                              <Typography variant="body2" color="textSecondary">
                                Total: {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'IDR',
                                  minimumFractionDigits: 0,
                                }).format(totalValue)}
                              </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" color="textSecondary">
                                {isExpanded ? '▼' : '▶'}
                              </Typography>
                              <Tooltip title="Delete Agent">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteAgent(agent);
                                  }}
                                  color="error"
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                          
                          {/* Agent Months */}
                          {isExpanded && (
                            <Box p={2} pt={0}>
                              <Box display="flex" flexDirection="column" gap={1}>
                                {months.map(([monthYear, value]) => (
                                  <Box
                                    key={`${agent}-${monthYear}`}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    p={1.5}
                                    border={1}
                                    borderColor="divider"
                                    borderRadius={1}
                                    sx={{ backgroundColor: 'background.paper' }}
                                  >
                                    <Box display="flex" alignItems="center" gap={2}>
                                      <Typography variant="body2" fontWeight="medium" minWidth="120px">
                                        {monthYear}
                                      </Typography>
                                      <Typography variant="body2" fontWeight="bold">
                                        {new Intl.NumberFormat('en-US', {
                                          style: 'currency',
                                          currency: 'IDR',
                                          minimumFractionDigits: 0,
                                        }).format(value)}
                                      </Typography>
                                    </Box>
                                    <Box>
                                      <Tooltip title="Edit">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleEditGoalProfit(agent, monthYear, value)}
                                        >
                                          <Edit />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Delete">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleDeleteGoalProfit(agent, monthYear)}
                                          color="error"
                                        >
                                          <Delete />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Goal Cash-In Settings - in Settings tab */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader 
              title="Cash In Goal Targets"
              action={
                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAddGoalCashIn}
                    size="small"
                  >
                    Add Target
                  </Button>
                </Box>
              }
            />
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Set cash-in goals for different agents and months.
              </Typography>
              
              <Box mt={2}>
                {getCashInAgentList().length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    No cash-in goal targets set.
                  </Typography>
                ) : (
                  <Box display="flex" flexDirection="column" gap={2}>
                    {getCashInAgentList().map((agent) => {
                      const months = getCashInAgentMonths(agent);
                      const isExpanded = expandedCashInAgents.has(agent);
                      const totalValue = months.reduce((sum, [, value]) => sum + value, 0);
                      
                      return (
                        <Box key={agent} border={1} borderColor="divider" borderRadius={1}>
                          {/* Agent Header */}
                          <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            p={2}
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': { backgroundColor: 'action.hover' }
                            }}
                            onClick={() => toggleCashInAgentExpansion(agent)}
                          >
                            <Box display="flex" alignItems="center" gap={2}>
                              <Typography variant="h6" fontWeight="bold">
                                {agent}
                              </Typography>
                              <Chip 
                                label={`${months.length} months`} 
                                size="small" 
                                color="secondary" 
                                variant="outlined"
                              />
                              <Typography variant="body2" color="textSecondary">
                                Total: {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'IDR',
                                  minimumFractionDigits: 0,
                                }).format(totalValue)}
                              </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" color="textSecondary">
                                {isExpanded ? '▼' : '▶'}
                              </Typography>
                              <Tooltip title="Delete Agent">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCashInAgent(agent);
                                  }}
                                  color="error"
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                          
                          {/* Agent Months */}
                          {isExpanded && (
                            <Box p={2} pt={0}>
                              <Box display="flex" flexDirection="column" gap={1}>
                                {months.map(([monthYear, value]) => (
                                  <Box
                                    key={`${agent}-${monthYear}`}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    p={1.5}
                                    border={1}
                                    borderColor="divider"
                                    borderRadius={1}
                                    sx={{ backgroundColor: 'background.paper' }}
                                  >
                                    <Box display="flex" alignItems="center" gap={2}>
                                      <Typography variant="body2" fontWeight="medium" minWidth="120px">
                                        {monthYear}
                                      </Typography>
                                      <Typography variant="body2" fontWeight="bold">
                                        {new Intl.NumberFormat('en-US', {
                                          style: 'currency',
                                          currency: 'IDR',
                                          minimumFractionDigits: 0,
                                        }).format(value)}
                                      </Typography>
                                    </Box>
                                    <Box>
                                      <Tooltip title="Edit">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleEditGoalCashIn(agent, monthYear, value)}
                                        >
                                          <Edit />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Delete">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleDeleteGoalCashIn(agent, monthYear)}
                                          color="error"
                                        >
                                          <Delete />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      )}

      {/* Periods tab */}
      {activeTab === 2 && (
        <Card>
          <CardHeader
            title="Goal periods"
            subheader="View and manage goal periods. Filter by year, then edit dates or create new periods."
            action={
              <Button variant="contained" startIcon={<Add />} onClick={() => setPeriodCreateOpen(true)}>
                Create period
              </Button>
            }
          />
          <CardContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}>
              <TextField
                size="small"
                label="Year"
                type="number"
                value={periodsPageYear}
                onChange={(e) => setPeriodsPageYear(e.target.value)}
                sx={{ minWidth: 100 }}
              />
            </Box>
            {periodsPageLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={3}>
                {/* Year: full-width tiles */}
                {periodsByType.year.length > 0 && (
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                      Year
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {periodsByType.year.map((p) => (
                        <Box
                          key={p.id}
                          onClick={() => openPeriodEdit(p)}
                          sx={{
                            width: '100%',
                            py: 2,
                            px: 2,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'action.hover',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.selected' },
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight="bold">
                            {formatPeriodPageTitle(p)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateDisplay(p.start_date)} – {formatDateDisplay(p.end_date)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Quarter: tiles in a row */}
                {periodsByType.quarter.length > 0 && (
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" color="secondary" gutterBottom>
                      Quarters
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                      {periodsByType.quarter.map((p) => (
                        <Box
                          key={p.id}
                          onClick={() => openPeriodEdit(p)}
                          sx={{
                            py: 1.5,
                            px: 2,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.default',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.selected' },
                          }}
                        >
                          <Typography variant="body1" fontWeight="bold">
                            {formatPeriodPageTitle(p)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateDisplay(p.start_date)} – {formatDateDisplay(p.end_date)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Month: table, click row to edit */}
                {periodsByType.month.length > 0 && (
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Months
                    </Typography>
                    <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell>Period</TableCell>
                            <TableCell>Start date</TableCell>
                            <TableCell>End date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {periodsByType.month.map((p) => (
                            <TableRow
                              key={p.id}
                              hover
                              onClick={() => openPeriodEdit(p)}
                              sx={{ cursor: 'pointer' }}
                            >
                              <TableCell sx={{ fontWeight: 500 }}>{formatPeriodPageTitle(p)}</TableCell>
                              <TableCell>{formatDateDisplay(p.start_date)}</TableCell>
                              <TableCell>{formatDateDisplay(p.end_date)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Box>
            )}
            {!periodsPageLoading && periodsPageList.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                No periods found for this year.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Goal progress tab */}
      {activeTab === 3 && (
        <Card>
          <CardHeader
            title="Goal progress"
            subheader="View progress toward goals by month, year, and goal type. All filters are required."
          />
          <CardContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 140 }} required>
                <InputLabel>Month</InputLabel>
                <Select
                  value={progressMonth}
                  label="Month"
                  onChange={(e) => setProgressMonth(e.target.value)}
                >
                  {MONTH_OPTIONS.filter((o) => o.value).map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Year"
                type="number"
                value={progressYear}
                onChange={(e) => setProgressYear(e.target.value)}
                sx={{ minWidth: 100 }}
                required
              />
              <FormControl size="small" sx={{ minWidth: 160 }} required>
                <InputLabel>Goal type</InputLabel>
                <Select
                  value={progressGoalType}
                  label="Goal type"
                  onChange={(e) => setProgressGoalType(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Select goal type
                  </MenuItem>
                  {goalTypesFromApi.map((gt) => (
                    <MenuItem key={gt} value={gt}>{gt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            {!progressGoalType ? (
              <Typography variant="body2" color="text.secondary">
                Select month, year, and goal type (all required) to view progress.
              </Typography>
            ) : progressLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={3}>
                {(() => {
                  const ProgressBlock = ({ g, periodLabel }: { g: GoalProgressItem; periodLabel: string }) => {
                    const actual = g.progress?.actual_value ?? 0;
                    const target = g.target_value || 1;
                    const pct = Math.min(100, Math.round((actual / target) * 100));
                    return (
                      <Box
                        onClick={() => openProgressEdit(g)}
                        sx={{
                          p: 2,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.paper',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.selected' },
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {periodLabel} · {g.goal_type || '—'}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, gap: 2 }}>
                          <Typography variant="body2">
                            {formatCurrency(actual)} / {formatCurrency(g.target_value)}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {pct}%
                          </Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={pct} sx={{ mt: 1, height: 8, borderRadius: 1 }} />
                      </Box>
                    );
                  };
                  const periodLabelFor = (g: GoalProgressItem) => {
                    const p = progressPeriodById[g.period_id];
                    return p ? formatPeriodPageTitle(p) : `Period ${g.period_id}`;
                  };
                  return (
                    <>
                      {/* National — full width */}
                      {(progressByType.year.national.length > 0 || progressByType.quarter.national.length > 0 || progressByType.month.national.length > 0) && (
                        <Box sx={{ width: '100%' }}>
                          <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                            National
                          </Typography>
                          {progressByType.year.national.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              {progressByType.year.national.map((g) => (
                                <Box key={g.id} sx={{ mb: 2 }}>
                                  <ProgressBlock g={g} periodLabel={periodLabelFor(g)} />
                                </Box>
                              ))}
                            </Box>
                          )}
                          {progressByType.quarter.national.length > 0 && (
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
                              {progressByType.quarter.national.map((g) => (
                                <ProgressBlock key={g.id} g={g} periodLabel={periodLabelFor(g)} />
                              ))}
                            </Box>
                          )}
                          {progressByType.month.national.length > 0 && (
                            <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell>Period</TableCell>
                                    <TableCell>Goal type</TableCell>
                                    <TableCell>Actual / Target</TableCell>
                                    <TableCell align="right">Progress</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {progressByType.month.national.map((g) => {
                                    const actual = g.progress?.actual_value ?? 0;
                                    const target = g.target_value || 1;
                                    const pct = Math.min(100, Math.round((actual / target) * 100));
                                    return (
                                      <TableRow
                                        key={g.id}
                                        hover
                                        onClick={() => openProgressEdit(g)}
                                        sx={{ cursor: 'pointer' }}
                                      >
                                        <TableCell>{periodLabelFor(g)}</TableCell>
                                        <TableCell>{g.goal_type || '—'}</TableCell>
                                        <TableCell>{formatCurrency(actual)} / {formatCurrency(g.target_value)}</TableCell>
                                        <TableCell align="right">
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                                            <LinearProgress variant="determinate" value={pct} sx={{ width: 80, height: 6, borderRadius: 1 }} />
                                            <Typography variant="body2">{pct}%</Typography>
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          )}
                        </Box>
                      )}
                      {/* Agents — same layout as national: year/quarter tiles, month table */}
                      {(() => {
                        const agentNames = new Set<string>([
                          ...Object.keys(progressByType.year.agent),
                          ...Object.keys(progressByType.quarter.agent),
                          ...Object.keys(progressByType.month.agent),
                        ]);
                        if (agentNames.size === 0) return null;
                        return (
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                            {Array.from(agentNames).map((agentName) => {
                              const yearList = progressByType.year.agent[agentName] ?? [];
                              const quarterList = progressByType.quarter.agent[agentName] ?? [];
                              const monthList = progressByType.month.agent[agentName] ?? [];
                              const hasAny = yearList.length > 0 || quarterList.length > 0 || monthList.length > 0;
                              if (!hasAny) return null;
                              return (
                                <Box
                                  key={agentName}
                                  sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    p: 2,
                                    bgcolor: 'background.paper',
                                  }}
                                >
                                  <Typography variant="subtitle2" fontWeight="bold" color="secondary" gutterBottom>
                                    {agentName}
                                  </Typography>
                                  {yearList.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                      {yearList.map((g) => (
                                        <Box key={g.id} sx={{ mb: 2 }}>
                                          <ProgressBlock g={g} periodLabel={periodLabelFor(g)} />
                                        </Box>
                                      ))}
                                    </Box>
                                  )}
                                  {quarterList.length > 0 && (
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 2, mb: 2 }}>
                                      {quarterList.map((g) => (
                                        <ProgressBlock key={g.id} g={g} periodLabel={periodLabelFor(g)} />
                                      ))}
                                    </Box>
                                  )}
                                  {monthList.length > 0 && (
                                    <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                      <Table size="small">
                                        <TableHead>
                                          <TableRow sx={{ bgcolor: 'action.hover' }}>
                                            <TableCell>Period</TableCell>
                                            <TableCell>Goal type</TableCell>
                                            <TableCell>Actual / Target</TableCell>
                                            <TableCell align="right">Progress</TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {monthList.map((g) => {
                                            const actual = g.progress?.actual_value ?? 0;
                                            const target = g.target_value || 1;
                                            const pct = Math.min(100, Math.round((actual / target) * 100));
                                            return (
                                              <TableRow
                                                key={g.id}
                                                hover
                                                onClick={() => openProgressEdit(g)}
                                                sx={{ cursor: 'pointer' }}
                                              >
                                                <TableCell>{periodLabelFor(g)}</TableCell>
                                                <TableCell>{g.goal_type || '—'}</TableCell>
                                                <TableCell>{formatCurrency(actual)} / {formatCurrency(g.target_value)}</TableCell>
                                                <TableCell align="right">
                                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                                                    <LinearProgress variant="determinate" value={pct} sx={{ width: 80, height: 6, borderRadius: 1 }} />
                                                    <Typography variant="body2">{pct}%</Typography>
                                                  </Box>
                                                </TableCell>
                                              </TableRow>
                                            );
                                          })}
                                        </TableBody>
                                      </Table>
                                    </TableContainer>
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                        );
                      })()}
                      {progressGoals.length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                          No goal progress for this month and year. Select another month/year or ensure goals exist.
                        </Typography>
                      )}
                    </>
                  );
                })()}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bonus tab */}
      {activeTab === 4 && (
        <Card>
          <CardHeader
            title="Bonus"
            subheader="View bonuses by year, grouped by agent. Click a row to edit or delete."
            action={
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setBonusCreateForm({
                    agent_id: agentsFromApi[0]?.id ?? 0,
                    period_id: 0,
                    period_label: '',
                    bonus_amount: 0,
                  });
                  setBonusCreateError(null);
                  setBonusCreateOpen(true);
                }}
              >
                Create new bonus
              </Button>
            }
          />
          <CardContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}>
              <TextField
                size="small"
                label="Year"
                type="number"
                value={bonusYear}
                onChange={(e) => setBonusYear(e.target.value)}
                sx={{ minWidth: 100 }}
              />
            </Box>
            {bonusLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {(() => {
                  const byAgent: Record<string, BonusFromApi[]> = {};
                  bonuses.forEach((b) => {
                    const name = b.agent_name || 'Unknown';
                    if (!byAgent[name]) byAgent[name] = [];
                    byAgent[name].push(b);
                  });
                  const agentNames = Object.keys(byAgent).sort();
                  return agentNames.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No bonuses for this year. Select another year or ensure the bonus API returns data.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                      {agentNames.map((agentName) => {
                        const list = byAgent[agentName];
                        const sorted = [...list].sort((a, b) => {
                          const isYear = (t: string) => /Year\s+\d+/.test(t);
                          const qMatch = /Q(\d+)/;
                          const aIsYear = isYear(a.period_title);
                          const bIsYear = isYear(b.period_title);
                          if (aIsYear && !bIsYear) return -1;
                          if (!aIsYear && bIsYear) return 1;
                          if (aIsYear && bIsYear) return 0;
                          const aQ = parseInt(a.period_title.match(qMatch)?.[1] ?? '0', 10);
                          const bQ = parseInt(b.period_title.match(qMatch)?.[1] ?? '0', 10);
                          return aQ - bQ;
                        });
                        return (
                          <Card key={agentName} variant="outlined" sx={{ overflow: 'hidden' }}>
                            <CardContent sx={{ p: 0 }}>
                              <Typography variant="subtitle1" fontWeight="bold" color="secondary" sx={{ px: 2, py: 1.5, bgcolor: 'action.hover' }}>
                                {agentName}
                              </Typography>
                              <TableContainer>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                                      <TableCell>Period</TableCell>
                                      <TableCell align="right">Bonus</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {sorted.map((b) => (
                                      <TableRow
                                        key={b.id}
                                        hover
                                        onClick={() => openEditBonus(b)}
                                        sx={{ cursor: 'pointer' }}
                                      >
                                        <TableCell>{b.period_title}</TableCell>
                                        <TableCell align="right">{formatCurrency(b.bonus_amount)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Box>
                  );
                })()}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit bonus dialog */}
      <Dialog open={bonusEditOpen} onClose={() => setBonusEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit bonus</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Bonus amount"
              type="number"
              value={bonusEditAmount || ''}
              onChange={(e) => setBonusEditAmount(Number(e.target.value) || 0)}
              fullWidth
              size="small"
              inputProps={{ min: 0 }}
            />
            {bonusEditError && (
              <Alert severity="error" onClose={() => setBonusEditError(null)}>
                {bonusEditError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
          <Button
            color="error"
            onClick={() => setBonusDeleteConfirmOpen(true)}
            disabled={bonusEditSaving}
          >
            Delete
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setBonusEditOpen(false)} startIcon={<Cancel />}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleBonusEditSubmit}
              disabled={bonusEditSaving}
              startIcon={bonusEditSaving ? <CircularProgress size={16} /> : <Save />}
            >
              Save
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Delete bonus confirmation */}
      <Dialog
        open={bonusDeleteConfirmOpen}
        onClose={() => !bonusDeleting && setBonusDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete bonus?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this bonus? This cannot be undone.</Typography>
          {bonusEditError && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setBonusEditError(null)}>
              {bonusEditError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBonusDeleteConfirmOpen(false)} disabled={bonusDeleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleBonusDelete}
            disabled={bonusDeleting}
            startIcon={bonusDeleting ? <CircularProgress size={16} /> : <Delete />}
          >
            {bonusDeleting ? 'Deleting…' : 'Yes, delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create bonus dialog */}
      <Dialog open={bonusCreateOpen} onClose={() => setBonusCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create new bonus</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Agent</InputLabel>
              <Select
                value={bonusCreateForm.agent_id || ''}
                label="Agent"
                onChange={(e) => setBonusCreateForm((prev) => ({ ...prev, agent_id: Number(e.target.value) }))}
              >
                {agentsFromApi.map((a) => (
                  <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Period
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={(e) => {
                  setPeriodPickerFor('bonus');
                  setPeriodSelectAnchor(e.currentTarget);
                }}
                sx={{ justifyContent: 'space-between', textTransform: 'none' }}
              >
                {bonusCreateForm.period_label || 'Select period'}
              </Button>
            </Box>
            <TextField
              label="Bonus amount"
              type="number"
              value={bonusCreateForm.bonus_amount || ''}
              onChange={(e) => setBonusCreateForm((prev) => ({ ...prev, bonus_amount: Number(e.target.value) || 0 }))}
              fullWidth
              size="small"
              inputProps={{ min: 0 }}
            />
            {bonusCreateError && (
              <Alert severity="error" onClose={() => setBonusCreateError(null)}>
                {bonusCreateError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBonusCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleBonusCreateSubmit}
            disabled={bonusCreateSaving || !bonusCreateForm.agent_id || !bonusCreateForm.period_id}
            startIcon={bonusCreateSaving ? <CircularProgress size={16} /> : <Save />}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit progress dialog */}
      <Dialog open={progressEditOpen} onClose={() => setProgressEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit progress</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Actual value"
              type="number"
              value={progressEditActualValue || ''}
              onChange={(e) => setProgressEditActualValue(Number(e.target.value) || 0)}
              fullWidth
              size="small"
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Notes"
              value={progressEditNotes}
              onChange={(e) => setProgressEditNotes(e.target.value)}
              fullWidth
              size="small"
              multiline
              minRows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleProgressEditSubmit} disabled={progressEditSaving} startIcon={progressEditSaving ? <CircularProgress size={16} /> : <Save />}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit period dialog */}
      <Dialog open={periodEditOpen} onClose={() => setPeriodEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit period dates</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Start date"
              type="date"
              value={periodEditStartDate}
              onChange={(e) => setPeriodEditStartDate(e.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End date"
              type="date"
              value={periodEditEndDate}
              onChange={(e) => setPeriodEditEndDate(e.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
          <Button
            color="error"
            onClick={() => {
              if (periodEditId != null) setPeriodDeleteConfirmId(periodEditId);
              setPeriodEditOpen(false);
            }}
            disabled={periodEditSaving}
          >
            Delete
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setPeriodEditOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handlePeriodEditSubmit} disabled={periodEditSaving} startIcon={periodEditSaving ? <CircularProgress size={16} /> : <Save />}>
              Save
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Create period dialog */}
      <Dialog open={periodCreateOpen} onClose={() => setPeriodCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create new period</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <FormControl fullWidth size="small">
              <InputLabel>Period type</InputLabel>
              <Select
                value={periodCreateForm.period_type}
                label="Period type"
                onChange={(e) => setPeriodCreateForm((prev) => ({ ...prev, period_type: e.target.value as 'month' | 'quarter' | 'year' }))}
              >
                <MenuItem value="month">month</MenuItem>
                <MenuItem value="quarter">quarter</MenuItem>
                <MenuItem value="year">year</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Year"
              type="number"
              value={periodCreateForm.year || ''}
              onChange={(e) => setPeriodCreateForm((prev) => ({ ...prev, year: parseInt(e.target.value, 10) || new Date().getFullYear() }))}
              fullWidth
              size="small"
            />
            {(periodCreateForm.period_type === 'month' || periodCreateForm.period_type === 'quarter') && (
              <TextField
                label="Quarter (1-4)"
                type="number"
                value={periodCreateForm.quarter || ''}
                onChange={(e) => setPeriodCreateForm((prev) => ({ ...prev, quarter: parseInt(e.target.value, 10) || 1 }))}
                fullWidth
                size="small"
                inputProps={{ min: 1, max: 4 }}
              />
            )}
            {periodCreateForm.period_type === 'month' && (
              <TextField
                label="Month (1-12)"
                type="number"
                value={periodCreateForm.month ?? ''}
                onChange={(e) => setPeriodCreateForm((prev) => ({ ...prev, month: parseInt(e.target.value, 10) || 1 }))}
                fullWidth
                size="small"
                inputProps={{ min: 1, max: 12 }}
              />
            )}
            <TextField
              label="Start date"
              type="date"
              value={periodCreateForm.start_date}
              onChange={(e) => setPeriodCreateForm((prev) => ({ ...prev, start_date: e.target.value }))}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End date"
              type="date"
              value={periodCreateForm.end_date}
              onChange={(e) => setPeriodCreateForm((prev) => ({ ...prev, end_date: e.target.value }))}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPeriodCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePeriodCreateSubmit}
            disabled={periodCreateSaving || !periodCreateForm.start_date || !periodCreateForm.end_date}
            startIcon={periodCreateSaving ? <CircularProgress size={16} /> : <Save />}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete period confirmation */}
      <Dialog open={periodDeleteConfirmId != null} onClose={() => !periodDeleteSaving && setPeriodDeleteConfirmId(null)}>
        <DialogTitle>Delete period?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this period? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPeriodDeleteConfirmId(null)} disabled={periodDeleteSaving}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handlePeriodDelete} disabled={periodDeleteSaving} startIcon={periodDeleteSaving ? <CircularProgress size={16} /> : <Delete />}>
            {periodDeleteSaving ? 'Deleting…' : 'Yes, delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Goal Profit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit' : 'Add'} Goal Profit Target
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            {/* Agent Selection */}
            <FormControl fullWidth size="small">
              <InputLabel>Agent Name</InputLabel>
              <Select
                value={editingEntry?.agent || ''}
                label="Agent Name"
                onChange={(e: any) => setEditingEntry(prev => prev ? { ...prev, agent: e.target.value } : null)}
                disabled={isEditing}
              >
                {availableAgents.map((agent) => (
                  <MenuItem key={agent} value={agent}>
                    {agent}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Month Year Selection */}
            <FormControl fullWidth size="small">
              <InputLabel>Month Year</InputLabel>
              <Select
                value={editingEntry?.monthYear || ''}
                label="Month Year"
                onChange={(e: any) => setEditingEntry(prev => prev ? { ...prev, monthYear: e.target.value } : null)}
                disabled={isEditing}
              >
                {getMonthYearOptions().map((monthYear) => (
                  <MenuItem key={monthYear} value={monthYear}>
                    {monthYear}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Target Amount */}
            <TextField
              label="Target Amount"
              type="number"
              value={editingEntry?.value || 0}
              onChange={(e) => setEditingEntry(prev => prev ? { ...prev, value: parseFloat(e.target.value) || 0 } : null)}
              fullWidth
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveGoalProfit}
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <Save />}
            disabled={saving || !editingEntry?.agent || !editingEntry?.monthYear}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Goal Cash-In Dialog */}
      <Dialog open={cashInDialogOpen} onClose={() => setCashInDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditingCashIn ? 'Edit' : 'Add'} Cash In Goal Target
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            {/* Agent Selection */}
            <FormControl fullWidth size="small">
              <InputLabel>Agent Name</InputLabel>
              <Select
                value={editingCashInEntry?.agent || ''}
                label="Agent Name"
                onChange={(e: any) => setEditingCashInEntry(prev => prev ? { ...prev, agent: e.target.value } : null)}
                disabled={isEditingCashIn}
              >
                {availableAgents.map((agent) => (
                  <MenuItem key={agent} value={agent}>
                    {agent}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Month Year Selection */}
            <FormControl fullWidth size="small">
              <InputLabel>Month Year</InputLabel>
              <Select
                value={editingCashInEntry?.monthYear || ''}
                label="Month Year"
                onChange={(e: any) => setEditingCashInEntry(prev => prev ? { ...prev, monthYear: e.target.value } : null)}
                disabled={isEditingCashIn}
              >
                {getMonthYearOptions().map((monthYear) => (
                  <MenuItem key={monthYear} value={monthYear}>
                    {monthYear}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Target Amount */}
            <TextField
              label="Target Amount"
              type="number"
              value={editingCashInEntry?.value || 0}
              onChange={(e) => setEditingCashInEntry(prev => prev ? { ...prev, value: parseFloat(e.target.value) || 0 } : null)}
              fullWidth
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCashInDialogOpen(false)} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveGoalCashIn}
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <Save />}
            disabled={saving || !editingCashInEntry?.agent || !editingCashInEntry?.monthYear}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsManager;
