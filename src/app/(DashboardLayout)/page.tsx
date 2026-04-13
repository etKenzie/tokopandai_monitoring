"use client";

import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import PageContainer from "@/app/components/container/PageContainer";
import DashboardCard from '@/app/components/shared/DashboardCard';
import { useAuth } from '@/app/context/AuthContext';
import { useCheckRoles } from '@/app/hooks/useCheckRoles';
import { getAgentIdFromRole, getAgentNameFromRole, getPageRoles, getRestrictedRoles } from '@/config/roles';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha } from '@mui/material/styles';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

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
  individual_factor?: number;
  company_factor?: number;
  individual_multiplier?: number;
  company_multiplier?: number;
  multiplier?: number; // Keep for backward compatibility
  final_bonus_amount?: number;
}

interface BonusApiResponse {
  bonuses?: BonusFromApi[];
  company_multiplier?: number;
  company_factor?: number;
  current_company_factor?: number;
  current_company_multiplier?: number;
}

/** When period_id is used, factor/multiplier may only exist on bonus rows (not top-level). */
function resolveNationalCompanyMetrics(bonusData: BonusApiResponse): {
  companyFactor: number | null;
  companyMultiplier: number | null;
} {
  const list = bonusData.bonuses ?? [];
  let companyFactor: number | null = null;
  let factorRow: BonusFromApi | undefined;

  if (bonusData.current_company_factor != null) {
    companyFactor = bonusData.current_company_factor;
  } else if (bonusData.company_factor != null) {
    companyFactor = bonusData.company_factor;
  } else {
    factorRow =
      list.find((b) => b.company_factor != null) ??
      list.find((b) => !b.agent_name?.trim()) ??
      list[0];
    if (factorRow?.company_factor != null) companyFactor = factorRow.company_factor;
  }

  let companyMultiplier: number | null = null;
  if (bonusData.current_company_multiplier != null) {
    companyMultiplier = bonusData.current_company_multiplier;
  } else if (bonusData.company_multiplier != null) {
    companyMultiplier = bonusData.company_multiplier;
  } else if (
    factorRow &&
    (factorRow.company_multiplier != null || factorRow.multiplier != null)
  ) {
    companyMultiplier = factorRow.company_multiplier ?? factorRow.multiplier ?? null;
  } else {
    const row =
      list.find((b) => b.company_multiplier != null) ??
      list.find((b) => b.multiplier != null) ??
      list.find((b) => !b.agent_name?.trim()) ??
      list[0];
    if (row) {
      companyMultiplier = row.company_multiplier ?? row.multiplier ?? null;
    }
  }

  return { companyFactor, companyMultiplier };
}

interface BonusRule {
  id: number;
  rule_type: 'company' | 'individual';
  multiplier_group: string;
  min_factor: number;
  max_factor: number;
  multiplier: number;
  effective_from: string;
  effective_to: string | null;
}

interface BonusRulesResponse {
  rules?: BonusRule[];
}

/** GET /api/goals/guardrails?current=true — national guardrail snapshot (60+, EBITDA, fraud). */
interface GoalsGuardrailsData {
  overdue_status?: string;
  order_count?: number;
  total_invoice?: number;
  percentage_of_total_invoice?: number;
  overdue_60_plus_ok?: boolean;
  period_id?: number;
  national_goal_progress_percentage?: number;
  national_cash_in_progress_percentage?: number;
  period_type?: string;
  year?: number;
  quarter?: number;
  ebitda?: boolean;
  fraud?: boolean;
}

function formatCurrency(value: number): string {
  if (value >= 1e9) return (value / 1e9).toFixed(2) + 'M';
  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'J';
  if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
  return String(value);
}

function formatBonusAmount(value: number): string {
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function formatPeriodTitle(p: GoalPeriodFromApi): string {
  if (p.period_type === 'month' && p.month != null) {
    return new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(2000, p.month - 1)) + ' ' + p.year;
  }
  if (p.period_type === 'quarter' && p.quarter != null) return `Q${p.quarter} ${p.year}`;
  if (p.period_type === 'year') return `Year ${p.year}`;
  return `Period ${p.id}`;
}

/** Progress fill color: 0% → red, 100%+ → green (HSL hue 0 → 120; clamp input for color scale). */
function progressFillColor(pct: number): string {
  const clamped = Math.max(0, Math.min(100, pct));
  const hue = (clamped / 100) * 120;
  return `hsl(${hue}, 70%, 45%)`;
}

const GUARDRAIL_QUARTER_PCT_THRESHOLD = 80;
/** 60+ overdue: lower share of invoice is better; at or below this % the guardrail is OK. */
const GUARDRAIL_60_INVOICE_PCT_THRESHOLD = 7;
const NATIONAL_SUMMARY_CARD_HEIGHT = { xs: 178, sm: 192 };

/** Full-width horizontal progress; filled portion = value 0–100%; vertical line at threshold %. */
function GuardrailThresholdLinearBar({
  value,
  threshold,
  inverted,
}: {
  value: number;
  threshold: number;
  inverted: boolean;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  const isValid = inverted ? value <= threshold : value >= threshold;
  const thresholdPos = Math.min(100, Math.max(0, threshold));

  return (
    <Box sx={{ position: 'relative', height: 7, width: '100%', flexShrink: 0 }}>
      <LinearProgress
        variant="determinate"
        value={clamped}
        sx={{
          height: '100%',
          borderRadius: 0,
          backgroundColor: 'action.hover',
          '& .MuiLinearProgress-bar': {
            borderRadius: 0,
            backgroundColor: isValid ? 'success.main' : 'error.main',
          },
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: `${thresholdPos}%`,
          top: -2,
          bottom: -2,
          width: 2,
          bgcolor: 'text.primary',
          transform: 'translateX(-50%)',
          zIndex: 1,
          opacity: 0.9,
          pointerEvents: 'none',
          boxShadow: (theme) =>
            `0 0 0 1px ${alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.25 : 0.85)}`,
        }}
      />
    </Box>
  );
}

function goalProgressPercent(g: GoalProgressItem | undefined): number | null {
  if (!g) return null;
  const target = g.target_value || 0;
  if (target <= 0) return null;
  const actual = g.progress?.actual_value ?? 0;
  return (actual / target) * 100;
}

function goalMeetsQuarterThreshold(g: GoalProgressItem | undefined, thresholdPct: number): boolean | null {
  const p = goalProgressPercent(g);
  if (p === null) return null;
  return p >= thresholdPct;
}

export default function Dashboard() {
  const { roles } = useAuth();
  useCheckRoles(getPageRoles('AUTHENTICATED_ONLY'));
  const restrictedRoles = getRestrictedRoles();
  const isAdmin = roles.includes('admin');
  const hasRestrictedRole = roles.some((role: string) => restrictedRoles.includes(role));
  const userRoleForFiltering = roles.find((role: string) => restrictedRoles.includes(role));
  const agentIdForApi = !isAdmin && hasRestrictedRole && userRoleForFiltering
    ? getAgentIdFromRole(userRoleForFiltering)
    : undefined;
  const agentNameForDisplay = !isAdmin && hasRestrictedRole && userRoleForFiltering
    ? getAgentNameFromRole(userRoleForFiltering)
    : null;

  const [periods, setPeriods] = useState<GoalPeriodFromApi[]>([]);
  const [goals, setGoals] = useState<GoalProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bonuses, setBonuses] = useState<BonusFromApi[]>([]);
  const [bonusLoading, setBonusLoading] = useState(true);
  const [showAllocatedBonus, setShowAllocatedBonus] = useState(false);
  const [companyMultiplier, setCompanyMultiplier] = useState<number | null>(null);
  const [companyFactor, setCompanyFactor] = useState<number | null>(null);
  const [bonusRules, setBonusRules] = useState<BonusRule[]>([]);
  /** Quarter rows from GET /api/goals/periods (filter dropdown). */
  const [bonusQuarterPeriods, setBonusQuarterPeriods] = useState<GoalPeriodFromApi[]>([]);
  /** Default "Current" → `current=true`; numeric goal period `id` → `period_id` on progress/bonus/rules. */
  const [bonusQuarterSelection, setBonusQuarterSelection] = useState<'current' | number>('current');
  const [bonusPeriodsLoading, setBonusPeriodsLoading] = useState(true);
  const [bonusRulesLoading, setBonusRulesLoading] = useState(false);
  const [guardrailsData, setGuardrailsData] = useState<GoalsGuardrailsData | null>(null);
  const [guardrailsLoading, setGuardrailsLoading] = useState(false);
  const [guardrailsError, setGuardrailsError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!API_BASE) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (bonusQuarterSelection === 'current') {
        params.set('current', 'true');
      } else {
        params.set('period_id', String(bonusQuarterSelection));
      }
      if (agentIdForApi !== undefined) params.set('agent_id', String(agentIdForApi));
      const progressUrl = `${API_BASE}/api/goals/progress?${params.toString()}`;
      console.log('[Dashboard] GET /api/goals/progress', {
        url: progressUrl,
        query: params.toString(),
        period_id: bonusQuarterSelection === 'current' ? null : bonusQuarterSelection,
      });
      const res = await fetch(progressUrl, {
        cache: 'no-store',
      });
      const json = await res.json();
      console.log('[Dashboard] /api/goals/progress result:', {
        code: json?.code,
        goalsCount: json?.data?.goals?.length,
        periodsCount: json?.data?.periods?.length,
        data: json?.data,
      });
      if (json?.data) {
        setPeriods(json.data.periods ?? []);
        setGoals(json.data.goals ?? []);
      } else {
        setPeriods([]);
        setGoals([]);
      }
    } catch (e) {
      console.error('Failed to fetch goal progress:', e);
      setError('Failed to load goal progress.');
      setPeriods([]);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [agentIdForApi, bonusQuarterSelection]);

  useEffect(() => {
    if (!API_BASE) {
      setBonusPeriodsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setBonusPeriodsLoading(true);
      try {
        const periodsUrl = `${API_BASE}/api/goals/periods`;
        const res = await fetch(periodsUrl, { cache: 'no-store' });
        const json = await res.json();
        console.log('[Dashboard] GET /api/goals/periods result:', json);
        const all: GoalPeriodFromApi[] = Array.isArray(json?.data) ? json.data : [];
        const quarters = all
          .filter((p) => p.period_type === 'quarter')
          .sort(
            (a, b) =>
              new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
          );
        console.log('[Dashboard] Quarter filter options (from goals/periods):', quarters);
        if (!cancelled) {
          setBonusQuarterPeriods(quarters);
          setBonusQuarterSelection((prev) => {
            if (prev === 'current') return 'current';
            if (typeof prev === 'number' && quarters.some((q) => q.id === prev)) return prev;
            return 'current';
          });
        }
      } catch (e) {
        console.error('Failed to fetch /api/goals/periods:', e);
        if (!cancelled) {
          setBonusQuarterPeriods([]);
          setBonusQuarterSelection('current');
        }
      } finally {
        if (!cancelled) setBonusPeriodsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [API_BASE]);

  useEffect(() => {
    if (!API_BASE) {
      setGuardrailsData(null);
      setGuardrailsError(null);
      setGuardrailsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setGuardrailsLoading(true);
      setGuardrailsError(null);
      try {
        const params = new URLSearchParams();
        if (bonusQuarterSelection === 'current') {
          params.set('current', 'true');
        } else {
          params.set('period_id', String(bonusQuarterSelection));
        }
        const url = `${API_BASE}/api/goals/guardrails?${params.toString()}`;
        const res = await fetch(url, { cache: 'no-store' });
        const json = await res.json();
        if (cancelled) return;
        if (json?.code === 200 && json?.data && typeof json.data === 'object') {
          setGuardrailsData(json.data as GoalsGuardrailsData);
          setGuardrailsError(null);
        } else {
          setGuardrailsData(null);
          setGuardrailsError(json?.message || 'Could not load guardrails.');
        }
      } catch (e) {
        console.error('Failed to fetch /api/goals/guardrails:', e);
        if (!cancelled) {
          setGuardrailsData(null);
          setGuardrailsError('Failed to load guardrails.');
        }
      } finally {
        if (!cancelled) setGuardrailsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [API_BASE, bonusQuarterSelection]);

  const fetchBonuses = useCallback(async () => {
    if (!API_BASE) return;
    setBonusLoading(true);
    try {
      const params = new URLSearchParams();
      if (bonusQuarterSelection === 'current') {
        params.set('current', 'true');
      } else {
        params.set('period_id', String(bonusQuarterSelection));
      }
      if (agentIdForApi !== undefined) params.set('agent_id', String(agentIdForApi));
      const bonusUrl = `${API_BASE}/api/bonus?${params.toString()}`;
      console.log('[Dashboard] GET /api/bonus', {
        url: bonusUrl,
        query: params.toString(),
        period_id: bonusQuarterSelection === 'current' ? null : bonusQuarterSelection,
      });
      const res = await fetch(bonusUrl, { cache: 'no-store' });
      const json = await res.json();
      console.log('[Dashboard] /api/bonus result:', {
        code: json?.code,
        bonusesCount: json?.data?.bonuses?.length,
        data: json?.data,
      });
      if (json?.data) {
        const bonusData = json.data as BonusApiResponse;
        if (bonusData.bonuses) setBonuses(bonusData.bonuses);
        else setBonuses([]);
        const { companyFactor, companyMultiplier } = resolveNationalCompanyMetrics(bonusData);
        setCompanyFactor(companyFactor);
        setCompanyMultiplier(companyMultiplier);
      } else {
        setBonuses([]);
        setCompanyMultiplier(null);
        setCompanyFactor(null);
      }
    } catch (e) {
      console.error('Failed to fetch bonuses:', e);
      setBonuses([]);
      setCompanyMultiplier(null);
      setCompanyFactor(null);
    } finally {
      setBonusLoading(false);
    }
  }, [agentIdForApi, bonusQuarterSelection]);

  const fetchBonusRules = useCallback(async () => {
    if (!API_BASE) return;
    setBonusRulesLoading(true);
    try {
      const params = new URLSearchParams();
      if (bonusQuarterSelection === 'current') {
        params.set('current', 'true');
      } else {
        params.set('period_id', String(bonusQuarterSelection));
      }
      const rulesUrl = `${API_BASE}/api/bonus/rules?${params.toString()}`;
      console.log('[Dashboard] GET /api/bonus/rules', {
        url: rulesUrl,
        query: params.toString(),
        period_id: bonusQuarterSelection === 'current' ? null : bonusQuarterSelection,
      });
      const res = await fetch(rulesUrl, {
        cache: 'no-store',
      });
      const json = await res.json();
      console.log('[Dashboard] /api/bonus/rules result:', {
        code: json?.code,
        rulesCount: json?.data?.rules?.length,
        data: json?.data,
      });
      if (json?.data) {
        const rulesData = json.data as BonusRulesResponse;
        if (rulesData.rules) setBonusRules(rulesData.rules);
        else setBonusRules([]);
      } else {
        setBonusRules([]);
      }
    } catch (e) {
      console.error('Failed to fetch bonus rules:', e);
      setBonusRules([]);
    } finally {
      setBonusRulesLoading(false);
    }
  }, [bonusQuarterSelection]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  useEffect(() => {
    fetchBonuses();
  }, [fetchBonuses]);

  useEffect(() => {
    fetchBonusRules();
  }, [fetchBonusRules]);

  const selectedBonusPeriodLabel = useMemo(() => {
    if (bonusQuarterSelection === 'current') return null;
    const p = bonusQuarterPeriods.find((q) => q.id === bonusQuarterSelection);
    return p ? formatPeriodTitle(p) : null;
  }, [bonusQuarterSelection, bonusQuarterPeriods]);

  /** National section title includes selected quarter+year when filtering by period (e.g. "National — Q1 2026"). */
  const nationalScopeTitle = useMemo(
    () => (selectedBonusPeriodLabel ? `National — ${selectedBonusPeriodLabel}` : 'National'),
    [selectedBonusPeriodLabel]
  );

  const bonusQuarterFilterDisabled =
    bonusPeriodsLoading || loading || bonusLoading || bonusRulesLoading;

  const periodById = useMemo(() => {
    const map: Record<number, GoalPeriodFromApi> = {};
    periods.forEach((p) => { map[p.id] = p; });
    return map;
  }, [periods]);

  const byType = useMemo(() => {
    const year: GoalProgressItem[] = [];
    const quarter: GoalProgressItem[] = [];
    const month: GoalProgressItem[] = [];
    goals.forEach((g) => {
      const p = periodById[g.period_id];
      if (!p) return;
      if (p.period_type === 'year') year.push(g);
      else if (p.period_type === 'quarter') quarter.push(g);
      else month.push(g);
    });
    const byScope = (list: GoalProgressItem[]) => {
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
      year: byScope(year),
      quarter: byScope(quarter),
      month: byScope(month),
    };
  }, [goals, periodById]);

  const periodLabelFor = (g: GoalProgressItem) => {
    const p = periodById[g.period_id];
    return p ? formatPeriodTitle(p) : `Period ${g.period_id}`;
  };

  const getGoalsForPeriod = (list: GoalProgressItem[], periodType: 'quarter' | 'month' | 'year') =>
    list.filter((g) => periodById[g.period_id]?.period_type === periodType);

  /** Period title from first goal in list (e.g. "Q1 2026", "February 2026", "Year 2026") */
  const getPeriodTitleFromGoals = (list: GoalProgressItem[]): string => {
    if (list.length === 0) return '';
    const p = periodById[list[0].period_id];
    return p ? formatPeriodTitle(p) : '';
  };

  /** Big centered circular progress for profit (used in Quarter and Month cards). Grey track for unfilled part. */
  const ProfitCircularProgress = ({ g }: { g: GoalProgressItem }) => {
    const actual = g.progress?.actual_value ?? 0;
    const target = g.target_value || 1;
    const pct = Math.round((actual / target) * 100);
    const barPct = Math.min(100, Math.max(0, pct));
    const fillColor = progressFillColor(pct);
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 2 }}>
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          {/* Grey track (full circle) — unfilled part */}
          <CircularProgress
            variant="determinate"
            value={100}
            size={160}
            thickness={5}
            sx={{ position: 'absolute', color: 'grey.300' }}
          />
          {/* Colored progress — filled part (red → green by pct); ring caps at 100% for MUI */}
          <CircularProgress variant="determinate" value={barPct} size={160} thickness={5} sx={{ color: fillColor }} />
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h4" fontWeight="bold" sx={{ fontSize: '2rem' }}>{pct}%</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem', mt: 0.5 }}>profit</Typography>
          </Box>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1, fontSize: '1.1rem' }}>
          {formatCurrency(actual)} / {formatCurrency(g.target_value)}
        </Typography>
      </Box>
    );
  };

  /** One row for non-profit goals: goal type, actual/target, linear progress (fill color by pct: red → green) */
  const LinearGoalRow = ({ g }: { g: GoalProgressItem }) => {
    const actual = g.progress?.actual_value ?? 0;
    const target = g.target_value || 1;
    const pct = Math.round((actual / target) * 100);
    const barPct = Math.min(100, Math.max(0, pct));
    const fillColor = progressFillColor(pct);
    return (
      <Box
        sx={{
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          '&:last-of-type': { borderBottom: 0 },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>{g.goal_type || '—'}</Typography>
          <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
            {formatCurrency(actual)} / {formatCurrency(g.target_value)} · <strong>{pct}%</strong>
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={barPct}
          sx={{
            mt: 0.5,
            height: 6,
            borderRadius: 1,
            backgroundColor: 'grey.300',
            '& .MuiLinearProgress-bar': { backgroundColor: fillColor },
          }}
        />
      </Box>
    );
  };

  const nationalGoals = useMemo(() => (
    byType.quarter.national.concat(byType.month.national).concat(byType.year.national)
  ), [byType]);
  const agentNames = useMemo(() => Array.from(new Set([
    ...Object.keys(byType.quarter.agent),
    ...Object.keys(byType.month.agent),
    ...Object.keys(byType.year.agent),
  ])), [byType]);

  const isQuarterPeriod = (period_title: string) => /^Q\d+\s+\d+/.test(period_title);
  const isYearPeriod = (period_title: string) => /^Year\s+\d+/.test(period_title);

  /** Calculate next threshold and potential bonus for a given factor and rule type */
  const getNextThresholdInfo = (currentFactor: number, ruleType: 'company' | 'individual', bonusAmount: number) => {
    const relevantRules = bonusRules
      .filter(rule => rule.rule_type === ruleType)
      .sort((a, b) => a.min_factor - b.min_factor);
    
    // Find current rule
    const currentRule = relevantRules.find(rule => 
      currentFactor >= rule.min_factor && currentFactor <= rule.max_factor
    );
    
    if (!currentRule) return null;
    
    // Find next rule (higher multiplier)
    const currentIndex = relevantRules.indexOf(currentRule);
    const nextRule = relevantRules.slice(currentIndex + 1).find(rule => rule.multiplier > currentRule.multiplier);
    
    if (!nextRule) return null; // Already at highest tier
    
    const nextThreshold = nextRule.min_factor;
    const potentialBonus = bonusAmount * nextRule.multiplier;
    
    return {
      nextThreshold,
      nextMultiplier: nextRule.multiplier,
      potentialBonus,
    };
  };
  const bonusesByAgent = useMemo(() => {
    const byAgent: Record<string, { quarter: BonusFromApi[]; year: BonusFromApi[] }> = {};
    bonuses.forEach((b) => {
      const name = b.agent_name || 'Unknown';
      if (!byAgent[name]) byAgent[name] = { quarter: [], year: [] };
      if (isQuarterPeriod(b.period_title)) byAgent[name].quarter.push(b);
      else if (isYearPeriod(b.period_title)) byAgent[name].year.push(b);
    });
    return byAgent;
  }, [bonuses]);

  /** One card per period type. Quarter & Month: profit = big circular, others = linear. Year: all linear. Optional allocated bonus shown as "Alokasi Bonus". */
  const PeriodCard = ({
    periodType,
    periodTitle,
    goals,
    titleColor = 'primary',
    allocatedBonus,
    isNational = false,
    companyMultiplier,
  }: {
    periodType: 'quarter' | 'month' | 'year';
    periodTitle: string;
    goals: GoalProgressItem[];
    titleColor?: 'primary' | 'secondary';
    allocatedBonus?: BonusFromApi | null;
    isNational?: boolean;
    companyMultiplier?: number | null;
  }) => {
    const list = getGoalsForPeriod(goals, periodType);
    if (list.length === 0 && !allocatedBonus && !companyMultiplier) return null;
    const title = periodTitle || (periodType === 'quarter' ? 'Quarter' : periodType === 'month' ? 'Month' : 'Year');
    const isQuarterOrMonth = periodType === 'quarter' || periodType === 'month';
    const profitGoal = isQuarterOrMonth ? list.find((g) => (g.goal_type || '').toLowerCase() === 'profit') : null;
    const otherGoals = isQuarterOrMonth && profitGoal ? list.filter((g) => g.id !== profitGoal.id) : list;

    return (
      <Card variant="outlined" sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 1 }}>
            <Typography variant="h6" fontWeight="bold" color={titleColor}>
              {title}
            </Typography>
            {allocatedBonus && shouldShowBonus && (
              <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                <Typography variant="body2" fontWeight="medium" display="block">
                  {formatBonusAmount(allocatedBonus.bonus_amount)}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.1, lineHeight: 1.2, fontSize: '0.7rem' }}>
                  Alokasi Bonus
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {profitGoal && (
              <ProfitCircularProgress g={profitGoal} />
            )}
            {profitGoal && otherGoals.length > 0 && (
              <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mt: 1 }} />
            )}
            {otherGoals.map((g) => (
              <LinearGoalRow key={g.id} g={g} />
            ))}
            {/* Bonus details for agent cards - only when bonus toggle is on (not for quarter since it's shown at top) */}
            {allocatedBonus && !isNational && periodType !== 'quarter' && shouldShowBonus && (
              <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mt: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Bonus Details
                </Typography>
                {allocatedBonus.individual_factor !== undefined && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Individual Factor:</Typography>
                    <Typography variant="caption" fontWeight="medium">{allocatedBonus.individual_factor.toFixed(2)}</Typography>
                  </Box>
                )}
                {allocatedBonus.multiplier !== undefined && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Multiplier:</Typography>
                    <Typography variant="caption" fontWeight="medium">{allocatedBonus.multiplier.toFixed(2)}</Typography>
                  </Box>
                )}
                {allocatedBonus.final_bonus_amount !== undefined && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="medium">Final Bonus:</Typography>
                    <Typography variant="caption" fontWeight="bold" color="primary">
                      {formatBonusAmount(allocatedBonus.final_bonus_amount)}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            {/* Company multiplier for national card */}
            {isNational && companyMultiplier !== null && companyMultiplier !== undefined && (
              <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="medium">Company Multiplier:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    {companyMultiplier.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  /** When true, show Alokasi Bonus in tiles. Controlled by toggle for all users (default off). */
  const shouldShowBonus = showAllocatedBonus;

  /** Render Quarter, Month, Year cards in order; year at bottom. Allocated bonus shown inside each tile when present and shouldShowBonus (agents only). */
  const ScopeSection = ({
    scopeTitle,
    titleColor = 'primary',
    goals,
    agentBonuses,
    hideTitle = false,
    isNational = false,
    companyMultiplier,
    companyFactor,
    allBonuses,
    bonusRules: sectionBonusRules,
    guardrailsData: sectionGuardrailsData = null,
    guardrailsLoading: sectionGuardrailsLoading = false,
    guardrailsError: sectionGuardrailsError = null,
  }: {
    scopeTitle: string;
    titleColor?: 'primary' | 'secondary';
    goals: GoalProgressItem[];
    agentBonuses?: { quarter: BonusFromApi[]; year: BonusFromApi[] };
    hideTitle?: boolean;
    isNational?: boolean;
    companyMultiplier?: number | null;
    companyFactor?: number | null;
    allBonuses?: BonusFromApi[];
    bonusRules?: BonusRule[];
    guardrailsData?: GoalsGuardrailsData | null;
    guardrailsLoading?: boolean;
    guardrailsError?: string | null;
  }) => {
    const quarterList = getGoalsForPeriod(goals, 'quarter');
    const monthList = getGoalsForPeriod(goals, 'month');
    const yearList = getGoalsForPeriod(goals, 'year');
    // Always get bonus data if available, but only show "Alokasi Bonus" header when toggle is on
    const quarterBonus = agentBonuses?.quarter[0] ?? null;
    const yearBonus = agentBonuses?.year[0] ?? null;
    // Calculate next threshold info for Agents
    const agentNextInfo = !isNational && quarterBonus?.individual_factor !== undefined && quarterBonus?.bonus_amount !== undefined
      ? getNextThresholdInfo(quarterBonus.individual_factor, 'individual', quarterBonus.bonus_amount)
      : null;

    /** Goals API with period_id returns quarter rows only — hide month/year goal cards. */
    const isHistoricalQuarterView = bonusQuarterSelection !== 'current';
    const quarterPeriodTitle = isHistoricalQuarterView && selectedBonusPeriodLabel
      ? selectedBonusPeriodLabel
      : getPeriodTitleFromGoals(quarterList);

    const nationalQuarterProfitGoal = quarterList.find(
      (g) => (g.goal_type || '').toLowerCase() === 'profit'
    );
    const nationalQuarterCashInGoal = quarterList.find(
      (g) => (g.goal_type || '').toLowerCase() === 'cash-in'
    );
    const profitPct =
      typeof sectionGuardrailsData?.national_goal_progress_percentage === 'number'
        ? sectionGuardrailsData.national_goal_progress_percentage
        : goalProgressPercent(nationalQuarterProfitGoal);
    const profitOk =
      profitPct == null ? null : profitPct >= GUARDRAIL_QUARTER_PCT_THRESHOLD;
    const cashInPct =
      typeof sectionGuardrailsData?.national_cash_in_progress_percentage === 'number'
        ? sectionGuardrailsData.national_cash_in_progress_percentage
        : goalProgressPercent(nationalQuarterCashInGoal);
    const cashInOk =
      cashInPct == null ? null : cashInPct >= GUARDRAIL_QUARTER_PCT_THRESHOLD;
    const overdueOk = bonusQuarterSelection !== 'current'
      ? sectionGuardrailsData?.overdue_60_plus_ok === true
      : sectionGuardrailsData &&
          typeof sectionGuardrailsData.percentage_of_total_invoice === 'number'
        ? sectionGuardrailsData.percentage_of_total_invoice <= GUARDRAIL_60_INVOICE_PCT_THRESHOLD
        : sectionGuardrailsData?.overdue_60_plus_ok === true;
    const ebitdaOk = sectionGuardrailsData?.ebitda === true;
    const fraudOk = sectionGuardrailsData?.fraud === false;
    // Lock only on explicit failures; unknown values should not force factor/multiplier to zero.
    const hasNationalGuardrailFailure =
      profitOk === false ||
      cashInOk === false ||
      overdueOk === false ||
      ebitdaOk === false ||
      fraudOk === false;
    const allNationalGuardrailsPassed = !hasNationalGuardrailFailure;
    const effectiveCompanyFactor = isNational
      ? hasNationalGuardrailFailure
        ? 0
        : companyFactor
      : companyFactor;
    const effectiveCompanyMultiplier = isNational
      ? hasNationalGuardrailFailure
        ? 0
        : companyMultiplier
      : companyMultiplier;
    const shouldZeroAgentQuarterBonus = !isNational && hasNationalGuardrailFailure;
    const effectiveQuarterFinalBonus =
      shouldZeroAgentQuarterBonus && quarterBonus ? 0 : quarterBonus?.final_bonus_amount;

    // National: always show the bonus dashboard (factor / multiplier / rules) when any data exists — not gated by Bonus switch.
    // Agents: still require Bonus switch + quarter bonus row with final_bonus_amount.
    const showNationalBonusBlock =
      isNational &&
      (effectiveCompanyFactor != null ||
        effectiveCompanyMultiplier != null ||
        (sectionBonusRules?.length ?? 0) > 0);
    const showCurrentBonus = isNational
      ? showNationalBonusBlock
      : showAllocatedBonus && !!(quarterBonus && quarterBonus.final_bonus_amount !== undefined);

    // Calculate next threshold info for National
    const nationalBonusAmount = isNational && allBonuses
      ? (allBonuses.find((b) => b.company_factor !== undefined)?.bonus_amount ?? 0)
      : 0;
    const nationalNextInfo = isNational && effectiveCompanyFactor !== null && effectiveCompanyFactor !== undefined
      ? getNextThresholdInfo(effectiveCompanyFactor, 'company', nationalBonusAmount)
      : null;

    const guardrailTile = (
      label: string,
      body: ReactNode,
      statusLine?: ReactNode,
      statusOk?: boolean | null,
      fullBleedBottomBar?: ReactNode
    ) => (
      <Paper
        key={label}
        elevation={0}
        sx={{
          height: '100%',
          minHeight: NATIONAL_SUMMARY_CARD_HEIGHT,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          border: '1px solid',
          borderColor: (theme) =>
            statusOk === null
              ? theme.palette.divider
              : statusOk
                ? alpha(theme.palette.success.main, 0.28)
                : alpha(theme.palette.error.main, 0.28),
          bgcolor: (theme) =>
            statusOk === null
              ? alpha(theme.palette.grey[500], theme.palette.mode === 'dark' ? 0.08 : 0.04)
              : statusOk
                ? alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.12 : 0.07)
                : alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.12 : 0.07),
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.04)}`
              : `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.65)}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            bgcolor:
              statusOk === null
                ? 'transparent'
                : statusOk
                  ? 'success.main'
                  : 'error.main',
          },
        }}
      >
        <Stack
          spacing={1.25}
          sx={{
            flex: 1,
            pt: 3.5,
            px: 5,
            pb: fullBleedBottomBar != null ? 2.4 : 3,
            minHeight: 0,
          }}
        >
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: '1rem',
              fontWeight: 500,
              lineHeight: 1.2,
            }}
          >
            {label}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'stretch',
              flex: 1,
            }}
          >
            {body}
          </Box>
          {statusLine != null && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ lineHeight: 1.5, display: 'block', opacity: 0.92 }}
            >
              {statusLine}
            </Typography>
          )}
        </Stack>
        {fullBleedBottomBar != null ? (
          <Box sx={{ px: 0, pb: 3 }}>
            {fullBleedBottomBar}
          </Box>
        ) : null}
      </Paper>
    );

    const showGuardrailsInSection = isNational || !isAdmin;

    return (
      <Box sx={{ mb: 3, p: 2 }}>
        {!hideTitle && (
          <Typography variant="h6" fontWeight="bold" color={titleColor} gutterBottom sx={{ mb: 2 }}>
            {scopeTitle}
          </Typography>
        )}
        {/* Current Bonus display above Quarter and Month cards */}
        {showCurrentBonus && (
          <Box sx={{ textAlign: 'center', mb: 0, py: 3 }}>
            {isNational ? (
              <>
                {/* For National: Two column layout - Company Factor/Multiplier on left, Next Threshold on right */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  {/* Left Column: Company Factor and Company Multiplier */}
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                    {effectiveCompanyFactor !== null && effectiveCompanyFactor !== undefined && (
                      <Box sx={{ flex: 1, display: 'flex', minHeight: NATIONAL_SUMMARY_CARD_HEIGHT }}>
                        <DashboardCard>
                          <Box p={2} sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'center',
                            alignItems: 'flex-start',
                            height: '100%',
                          }}>
                            <Box
                              sx={{
                                fontSize: '1rem',
                                color: 'text.secondary',
                                mb: 2,
                                fontWeight: 500,
                                lineHeight: '1.2',
                                textAlign: 'left',
                                width: '100%',
                              }}
                            >
                              Company Factor
                            </Box>
                            <Box
                              sx={{
                                fontSize: '3.5rem',
                                fontWeight: 'bold',
                                color: 'text.primary',
                                lineHeight: '1.2',
                                textAlign: 'left',
                                width: '100%',
                              }}
                            >
                              {effectiveCompanyFactor.toFixed(2)}
                            </Box>
                          </Box>
                        </DashboardCard>
                      </Box>
                    )}
                    {effectiveCompanyMultiplier !== null && effectiveCompanyMultiplier !== undefined && (
                      <Box sx={{ flex: 1, display: 'flex', minHeight: NATIONAL_SUMMARY_CARD_HEIGHT }}>
                        <DashboardCard>
                          <Box p={2} sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'center',
                            alignItems: 'flex-start',
                            height: '100%',
                          }}>
                            <Box
                              sx={{
                                fontSize: '1rem',
                                color: 'text.secondary',
                                mb: 2,
                                fontWeight: 500,
                                lineHeight: '1.2',
                                textAlign: 'left',
                                width: '100%',
                              }}
                            >
                              Company Multiplier
                            </Box>
                            <Box
                              sx={{
                                fontSize: '3.5rem',
                                fontWeight: 'bold',
                                color: 'text.primary',
                                lineHeight: '1.2',
                                textAlign: 'left',
                                width: '100%',
                              }}
                            >
                              {effectiveCompanyMultiplier.toFixed(2)}
                            </Box>
                          </Box>
                        </DashboardCard>
                      </Box>
                    )}
                  </Box>
                  
                  {/* Right Column: All Company Multiplier Rules */}
                  {sectionBonusRules && sectionBonusRules.length > 0 && (() => {
                    const companyRules = sectionBonusRules
                      .filter(rule => rule.rule_type === 'company')
                      .sort((a, b) => a.min_factor - b.min_factor);
                    
                    return (
                      <Box sx={{ 
                        p: 2, 
                        bgcolor: 'background.paper', 
                        borderRadius: 2,
                        boxShadow: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        height: NATIONAL_SUMMARY_CARD_HEIGHT,
                        display: 'flex',
                        flexDirection: 'column',
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center', fontWeight: 'bold' }}>
                          Multiplier Rules
                        </Typography>
                        <TableContainer sx={{ maxHeight: 165, overflowY: 'auto' }}>
                        <Table stickyHeader size="small" sx={{ bgcolor: 'background.paper' }}>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ 
                                fontWeight: 'bold', 
                                borderBottom: '2px solid', 
                                borderColor: 'divider',
                                bgcolor: 'background.paper'
                              }}>
                                Factor Range
                              </TableCell>
                              <TableCell sx={{ 
                                fontWeight: 'bold', 
                                borderBottom: '2px solid', 
                                borderColor: 'divider', 
                                textAlign: 'right',
                                bgcolor: 'background.paper'
                              }}>
                                Multiplier
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow
                              sx={{
                                bgcolor: !allNationalGuardrailsPassed ? 'warning.light' : 'background.paper',
                                '&:hover': { bgcolor: !allNationalGuardrailsPassed ? 'warning.light' : 'action.hover' }
                              }}
                            >
                              <TableCell
                                sx={{
                                  borderBottom: '1px solid',
                                  borderColor: 'divider',
                                  bgcolor: 'transparent'
                                }}
                              >
                                <Typography variant="body1" fontWeight="bold" color={!allNationalGuardrailsPassed ? 'warning.dark' : 'text.primary'}>
                                  Guardrail
                                </Typography>
                              </TableCell>
                              <TableCell
                                sx={{
                                  borderBottom: '1px solid',
                                  borderColor: 'divider',
                                  textAlign: 'right',
                                  bgcolor: 'transparent'
                                }}
                              >
                                <Typography variant="h6" fontWeight="bold" color={!allNationalGuardrailsPassed ? 'warning.dark' : 'text.primary'}>
                                  0x
                                </Typography>
                              </TableCell>
                            </TableRow>
                            {companyRules.map((rule) => {
                              const isActive =
                                allNationalGuardrailsPassed &&
                                effectiveCompanyFactor !== null &&
                                effectiveCompanyFactor !== undefined &&
                                effectiveCompanyFactor >= rule.min_factor &&
                                effectiveCompanyFactor <= rule.max_factor;
                              
                              return (
                                <TableRow 
                                  key={rule.id}
                                  sx={{ 
                                    bgcolor: isActive ? 'primary.light' : 'background.paper',
                                    '&:hover': { bgcolor: isActive ? 'primary.light' : 'action.hover' }
                                  }}
                                >
                                  <TableCell sx={{ 
                                    borderBottom: '1px solid', 
                                    borderColor: 'divider',
                                    bgcolor: 'transparent'
                                  }}>
                                    <Typography variant="body1" fontWeight="bold" color="primary">
                                      {rule.min_factor.toFixed(2)} - {rule.max_factor.toFixed(2)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ 
                                    borderBottom: '1px solid', 
                                    borderColor: 'divider', 
                                    textAlign: 'right',
                                    bgcolor: 'transparent'
                                  }}>
                                    <Typography variant="h6" fontWeight="bold" color="primary">
                                      {rule.multiplier.toFixed(2)}x
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                        </TableContainer>
                      </Box>
                    );
                  })()}
                </Box>
              </>
            ) : (
              /* For Agents: Split layout - Summary cards on left, Multiplier Rules table on right */
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {/* Left Column: Summary Cards */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                  {/* Quarter Bonus - Emphasized with primary background, spans 2 columns */}
                  <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' }, height: '100%', display: 'flex' }}>
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', '& .MuiCard-root': { bgcolor: 'primary.main', border: 'none', boxShadow: 'none', height: '100%', display: 'flex', padding: 0 }, '& .MuiCardContent-root': { bgcolor: 'primary.main', p: '30px', height: '100%', display: 'flex', flexDirection: 'column' } }}>
                      <DashboardCard>
                        <Box p={2} sx={{ 
                          height: '100%',
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                        }}>
                          <Box
                            sx={{
                              fontSize: '1rem',
                              color: 'primary.contrastText',
                              mb: 1,
                              fontWeight: 500,
                              minHeight: '1.5rem',
                              lineHeight: '1.2',
                              textAlign: 'left',
                              width: '100%',
                              opacity: 0.9,
                            }}
                          >
                            {isQuarterPeriod(quarterBonus!.period_title) ? 'Quarter Bonus' : isYearPeriod(quarterBonus!.period_title) ? 'Year Bonus' : 'Current Bonus'}
                          </Box>
                          <Box
                            sx={{
                              fontSize: '3rem',
                              fontWeight: 'bold',
                              color: 'primary.contrastText',
                              lineHeight: '1.2',
                              textAlign: 'left',
                              width: '100%',
                            }}
                          >
                            Rp {formatBonusAmount(effectiveQuarterFinalBonus ?? 0)}
                          </Box>
                        </Box>
                      </DashboardCard>
                    </Box>
                  </Box>
                  
                  {/* Individual Factor - 1 column */}
                  {quarterBonus?.individual_factor !== undefined && (
                    <Box sx={{ height: '100%', display: 'flex' }}>
                      <DashboardCard>
                        <Box p={2} sx={{ 
                          height: '100%',
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}>
                          <Box
                            sx={{
                              fontSize: '0.75rem',
                              color: 'text.secondary',
                              mb: 1,
                              fontWeight: 500,
                              minHeight: '1.5rem',
                              lineHeight: '1.2',
                              textAlign: 'left',
                              width: '100%',
                            }}
                          >
                            Individual Factor
                          </Box>
                          <Box
                            sx={{
                              fontSize: '2.75rem',
                              fontWeight: 'bold',
                              color: 'text.primary',
                              lineHeight: '1.2',
                              textAlign: 'left',
                              width: '100%',
                            }}
                          >
                            {quarterBonus.individual_factor.toFixed(2)}
                          </Box>
                        </Box>
                      </DashboardCard>
                    </Box>
                  )}
                  
                  {/* Alokasi Bonus - spans 2 columns */}
                  <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' }, height: '100%', display: 'flex' }}>
                    <DashboardCard>
                      <Box p={2} sx={{ 
                        height: '100%',
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}>
                        <Box
                          sx={{
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                            mb: 1,
                            fontWeight: 500,
                            minHeight: '1.5rem',
                            lineHeight: '1.2',
                            textAlign: 'left',
                            width: '100%',
                          }}
                        >
                          Alokasi Bonus
                        </Box>
                        <Box
                          sx={{
                            fontSize: '2.5rem',
                            fontWeight: 'bold',
                            color: 'text.primary',
                            lineHeight: '1.2',
                            textAlign: 'left',
                            width: '100%',
                          }}
                        >
                          Rp {formatBonusAmount(quarterBonus!.bonus_amount)}
                        </Box>
                      </Box>
                    </DashboardCard>
                  </Box>
                  
                  {/* Individual Multiplier - 1 column */}
                  {(quarterBonus?.individual_multiplier !== undefined || quarterBonus?.multiplier !== undefined) && (
                    <Box sx={{ height: '100%', display: 'flex' }}>
                      <DashboardCard>
                        <Box p={2} sx={{ 
                          height: '100%',
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}>
                          <Box
                            sx={{
                              fontSize: '0.75rem',
                              color: 'text.secondary',
                              mb: 1,
                              fontWeight: 500,
                              minHeight: '1.5rem',
                              lineHeight: '1.2',
                              textAlign: 'left',
                              width: '100%',
                            }}
                          >
                            Individual Multiplier
                          </Box>
                          <Box
                            sx={{
                              fontSize: '2.75rem',
                              fontWeight: 'bold',
                              color: 'text.primary',
                              lineHeight: '1.2',
                              textAlign: 'left',
                              width: '100%',
                            }}
                          >
                            {(quarterBonus.individual_multiplier ?? quarterBonus.multiplier ?? 0).toFixed(2)}
                          </Box>
                        </Box>
                      </DashboardCard>
                    </Box>
                  )}
                </Box>
                
                {/* Right Column: Individual Multiplier Rules Table */}
                {bonusRules && bonusRules.length > 0 && (() => {
                  const individualRules = bonusRules
                    .filter(rule => rule.rule_type === 'individual')
                    .sort((a, b) => a.min_factor - b.min_factor);
                  
                  const currentIndividualFactor = quarterBonus?.individual_factor;
                  
                  return (
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'background.paper', 
                      borderRadius: 2,
                      boxShadow: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center', fontWeight: 'bold' }}>
                        Multiplier Rules
                      </Typography>
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <Table size="small" sx={{ bgcolor: 'background.paper', width: '100%', tableLayout: 'fixed' }}>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ 
                                fontWeight: 'bold', 
                                borderBottom: '2px solid', 
                                borderColor: 'divider',
                                bgcolor: 'background.paper',
                                width: '33.33%'
                              }}>
                                Factor Range
                              </TableCell>
                              <TableCell sx={{ 
                                fontWeight: 'bold', 
                                borderBottom: '2px solid', 
                                borderColor: 'divider', 
                                textAlign: 'right',
                                bgcolor: 'background.paper',
                                width: '33.33%'
                              }}>
                                Multiplier
                              </TableCell>
                              <TableCell sx={{ 
                                fontWeight: 'bold', 
                                borderBottom: '2px solid', 
                                borderColor: 'divider', 
                                textAlign: 'right',
                                bgcolor: 'background.paper',
                                width: '33.33%'
                              }}>
                                Potential Bonus
                              </TableCell>
                            </TableRow>
                          </TableHead>
                        </Table>
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                          <Box sx={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            right: 0, 
                            bottom: 0, 
                            display: 'flex', 
                            flexDirection: 'column' 
                          }}>
                            {individualRules.map((rule) => {
                              const isActive = currentIndividualFactor !== null && currentIndividualFactor !== undefined &&
                                currentIndividualFactor >= rule.min_factor && currentIndividualFactor <= rule.max_factor;
                              
                              const potentialBonus = quarterBonus?.bonus_amount 
                                ? quarterBonus.bonus_amount * rule.multiplier 
                                : 0;
                              
                              return (
                                <Box
                                  key={rule.id}
                                  sx={{
                                    flex: 1,
                                    display: 'grid',
                                    gridTemplateColumns: '33.33% 33.33% 33.33%',
                                    bgcolor: isActive ? 'primary.light' : 'background.paper',
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    '&:hover': { bgcolor: isActive ? 'primary.light' : 'action.hover' }
                                  }}
                                >
                                  <Box sx={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    p: 1.5
                                  }}>
                                    <Typography variant="body1" fontWeight="bold" color="primary">
                                      {rule.min_factor.toFixed(2)} - {rule.max_factor.toFixed(2)}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    p: 1.5
                                  }}>
                                    <Typography variant="h6" fontWeight="bold" color="primary">
                                      {rule.multiplier.toFixed(2)}x
                                    </Typography>
                                  </Box>
                                  <Box sx={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    p: 1.5
                                  }}>
                                    <Typography variant="body1" fontWeight="bold" color="primary">
                                      Rp {formatBonusAmount(potentialBonus)}
                                    </Typography>
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  );
                })()}
              </Box>
            )}
          </Box>
        )}
        {isHistoricalQuarterView ? (
          <Box sx={{ mb: 2 }}>
            <PeriodCard
              periodType="quarter"
              periodTitle={quarterPeriodTitle}
              goals={goals}
              titleColor={titleColor}
              allocatedBonus={quarterBonus}
              isNational={isNational}
              companyMultiplier={effectiveCompanyMultiplier}
            />
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
            <PeriodCard
              periodType="quarter"
              periodTitle={getPeriodTitleFromGoals(quarterList)}
              goals={goals}
              titleColor={titleColor}
              allocatedBonus={quarterBonus}
              isNational={isNational}
              companyMultiplier={effectiveCompanyMultiplier}
            />
            <PeriodCard
              periodType="month"
              periodTitle={getPeriodTitleFromGoals(monthList)}
              goals={goals}
              titleColor={titleColor}
              isNational={isNational}
              companyMultiplier={effectiveCompanyMultiplier}
            />
          </Box>
        )}
        {showGuardrailsInSection && (
              <Box sx={{ mb: 2 }}>
                {sectionGuardrailsError && (
                  <Typography variant="caption" color="error" display="block" sx={{ mb: 1.5 }}>
                    {sectionGuardrailsError}
                  </Typography>
                )}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr 1fr',
                      sm: 'repeat(3, 1fr)',
                      md: 'repeat(5, 1fr)',
                    },
                    gap: { xs: 1.5, sm: 2 },
                    alignItems: 'stretch',
                  }}
                >
                  {guardrailTile(
                    'Profit',
                    profitPct != null ? (
                      <Stack spacing={0.5} sx={{ width: '100%', alignItems: 'flex-start' }}>
                        <Typography
                          sx={{
                            fontSize: { xs: '2.6rem', sm: '3rem' },
                            fontWeight: 800,
                            lineHeight: 1.1,
                            letterSpacing: '-0.03em',
                          }}
                        >
                          {Math.round(profitPct)}%
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No quarter goal
                      </Typography>
                    ),
                    profitOk === null
                      ? undefined
                      : profitOk
                        ? `At or above ${GUARDRAIL_QUARTER_PCT_THRESHOLD}% of quarter target`
                        : `Below ${GUARDRAIL_QUARTER_PCT_THRESHOLD}% of quarter target`,
                    profitOk,
                    profitPct != null ? (
                      <GuardrailThresholdLinearBar
                        value={profitPct}
                        threshold={GUARDRAIL_QUARTER_PCT_THRESHOLD}
                        inverted={false}
                      />
                    ) : undefined
                  )}
                  {guardrailTile(
                    'Cash-In',
                    cashInPct != null ? (
                      <Stack spacing={0.5} sx={{ width: '100%', alignItems: 'flex-start' }}>
                        <Typography
                          sx={{
                            fontSize: { xs: '2.6rem', sm: '3rem' },
                            fontWeight: 800,
                            lineHeight: 1.1,
                            letterSpacing: '-0.03em',
                          }}
                        >
                          {Math.round(cashInPct)}%
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No quarter goal
                      </Typography>
                    ),
                    cashInOk === null
                      ? undefined
                      : cashInOk
                        ? `At or above ${GUARDRAIL_QUARTER_PCT_THRESHOLD}% of quarter target`
                        : `Below ${GUARDRAIL_QUARTER_PCT_THRESHOLD}% of quarter target`,
                    cashInOk,
                    cashInPct != null ? (
                      <GuardrailThresholdLinearBar
                        value={cashInPct}
                        threshold={GUARDRAIL_QUARTER_PCT_THRESHOLD}
                        inverted={false}
                      />
                    ) : undefined
                  )}
                  {guardrailTile(
                    '60+ overdue',
                    sectionGuardrailsLoading ? (
                      <CircularProgress size={28} />
                    ) : sectionGuardrailsData ? (
                      isHistoricalQuarterView ? (
                        <Box sx={{ textAlign: 'center', width: '100%', py: 0.5 }}>
                          <Typography
                            sx={{
                              fontSize:
                                sectionGuardrailsData.overdue_60_plus_ok === false
                                  ? { xs: '2.7rem', sm: '3rem' }
                                  : { xs: '2.45rem', sm: '2.8rem' },
                              fontWeight: 800,
                              lineHeight: 1,
                              letterSpacing: '-0.02em',
                              color:
                                sectionGuardrailsData.overdue_60_plus_ok === true
                                  ? 'success.main'
                                  : sectionGuardrailsData.overdue_60_plus_ok === false
                                    ? 'error.main'
                                    : 'text.primary',
                            }}
                          >
                            {sectionGuardrailsData.overdue_60_plus_ok === true ? 'True' : 'False'}
                          </Typography>
                        </Box>
                      ) : typeof sectionGuardrailsData.percentage_of_total_invoice === 'number' ? (
                        <Stack spacing={0.5} sx={{ width: '100%', alignItems: 'flex-start' }}>
                          <Typography
                            sx={{
                              fontSize: { xs: '2.6rem', sm: '3rem' },
                              fontWeight: 800,
                              lineHeight: 1.1,
                              letterSpacing: '-0.03em',
                            }}
                          >
                            {sectionGuardrailsData.percentage_of_total_invoice.toFixed(1)}%
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      )
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    ),
                    isHistoricalQuarterView && sectionGuardrailsData
                      ? sectionGuardrailsData.overdue_60_plus_ok === true
                        ? '60+ guardrail: True'
                        : '60+ guardrail: False'
                      : sectionGuardrailsData &&
                        typeof sectionGuardrailsData.percentage_of_total_invoice === 'number'
                        ? sectionGuardrailsData.percentage_of_total_invoice <= GUARDRAIL_60_INVOICE_PCT_THRESHOLD
                          ? `60+ guardrail OK — at or below ${GUARDRAIL_60_INVOICE_PCT_THRESHOLD}% of invoice`
                          : `Above ${GUARDRAIL_60_INVOICE_PCT_THRESHOLD}% — lower is better (line marks threshold)`
                      : sectionGuardrailsLoading
                        ? 'Loading…'
                        : '—',
                    isHistoricalQuarterView && sectionGuardrailsData
                      ? sectionGuardrailsData.overdue_60_plus_ok === true
                      : sectionGuardrailsData &&
                        typeof sectionGuardrailsData.percentage_of_total_invoice === 'number'
                        ? sectionGuardrailsData.percentage_of_total_invoice <= GUARDRAIL_60_INVOICE_PCT_THRESHOLD
                      : null,
                    !isHistoricalQuarterView &&
                    sectionGuardrailsData &&
                    typeof sectionGuardrailsData.percentage_of_total_invoice === 'number' ? (
                      <GuardrailThresholdLinearBar
                        value={sectionGuardrailsData.percentage_of_total_invoice}
                        threshold={GUARDRAIL_60_INVOICE_PCT_THRESHOLD}
                        inverted
                      />
                    ) : undefined
                  )}
                  {guardrailTile(
                    'EBITDA',
                    sectionGuardrailsLoading ? (
                      <CircularProgress size={28} />
                    ) : sectionGuardrailsData ? (
                      <Box sx={{ textAlign: 'center', width: '100%', py: 0.5 }}>
                        <Typography
                          sx={{
                            fontSize:
                              sectionGuardrailsData.ebitda === false
                                ? { xs: '2.7rem', sm: '3rem' }
                                : { xs: '2.45rem', sm: '2.8rem' },
                            fontWeight: 800,
                            lineHeight: 1,
                            letterSpacing: '-0.02em',
                            color:
                              sectionGuardrailsData.ebitda === false
                                ? 'error.main'
                                : sectionGuardrailsData.ebitda === true
                                  ? 'success.main'
                                  : 'text.primary',
                          }}
                        >
                          {sectionGuardrailsData.ebitda === false ? 'False' : 'True'}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    ),
                    sectionGuardrailsLoading
                      ? 'Loading…'
                      : sectionGuardrailsData
                        ? sectionGuardrailsData.ebitda === false
                          ? 'False is below the EBITDA guardrail'
                          : sectionGuardrailsData.ebitda === true
                            ? 'True meets the EBITDA guardrail'
                            : undefined
                        : undefined,
                    sectionGuardrailsData == null
                      ? null
                      : sectionGuardrailsData.ebitda === true
                        ? true
                        : sectionGuardrailsData.ebitda === false
                          ? false
                          : null
                  )}
                  {guardrailTile(
                    'Fraud',
                    sectionGuardrailsLoading ? (
                      <CircularProgress size={28} />
                    ) : sectionGuardrailsData ? (
                      <Box sx={{ textAlign: 'center', width: '100%', py: 0.5 }}>
                        <Typography
                          sx={{
                            fontSize:
                              sectionGuardrailsData.fraud === false
                                ? { xs: '2.7rem', sm: '3rem' }
                                : { xs: '2.45rem', sm: '2.8rem' },
                            fontWeight: 800,
                            lineHeight: 1,
                            letterSpacing: '-0.02em',
                            color:
                              sectionGuardrailsData.fraud === false
                                ? 'success.main'
                                : sectionGuardrailsData.fraud === true
                                  ? 'error.main'
                                  : 'text.primary',
                          }}
                        >
                          {sectionGuardrailsData.fraud === false ? 'False' : 'True'}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    ),
                    sectionGuardrailsLoading
                      ? 'Loading…'
                      : sectionGuardrailsData
                        ? sectionGuardrailsData.fraud === false
                          ? 'No fraud flags'
                          : sectionGuardrailsData.fraud === true
                            ? 'Fraud flag raised'
                            : undefined
                        : undefined,
                    sectionGuardrailsData == null
                      ? null
                      : sectionGuardrailsData.fraud === false
                        ? true
                        : sectionGuardrailsData.fraud === true
                          ? false
                          : null
                  )}
                </Box>
              </Box>
        )}
        {!isHistoricalQuarterView && (
          <PeriodCard
            periodType="year"
            periodTitle={getPeriodTitleFromGoals(yearList)}
            goals={goals}
            titleColor={titleColor}
            allocatedBonus={yearBonus}
            isNational={isNational}
            companyMultiplier={effectiveCompanyMultiplier}
          />
        )}
      </Box>
    );
  };

  return (
    <ProtectedRoute requiredRoles={getPageRoles('AUTHENTICATED_ONLY')}>
      <PageContainer title="Home" description="Current goal progress">
        <Box mt={3}>
          <Box mb={3} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
                Home
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {selectedBonusPeriodLabel
                  ? isAdmin
                    ? `Goal progress for ${selectedBonusPeriodLabel} — national and all agents.`
                    : agentNameForDisplay
                      ? `Goal progress for ${selectedBonusPeriodLabel} (${agentNameForDisplay}).`
                      : `Goal progress for ${selectedBonusPeriodLabel}.`
                  : isAdmin
                    ? 'Current goal progress — national and all agents.'
                    : agentNameForDisplay
                      ? `Current goal progress for ${agentNameForDisplay}.`
                      : 'Current goal progress.'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
              {API_BASE && (
                <FormControl
                  size="small"
                  sx={{ minWidth: 200 }}
                  disabled={bonusQuarterFilterDisabled}
                >
                  <InputLabel id="bonus-quarter-label">Bonus quarter</InputLabel>
                  <Select
                    labelId="bonus-quarter-label"
                    label="Bonus quarter"
                    disabled={bonusQuarterFilterDisabled}
                    value={
                      bonusQuarterSelection === 'current' ? 'current' : String(bonusQuarterSelection)
                    }
                    onChange={(e: SelectChangeEvent<string>) => {
                      const v = e.target.value;
                      if (v === 'current') setBonusQuarterSelection('current');
                      else setBonusQuarterSelection(Number(v));
                    }}
                  >
                    <MenuItem value="current">Current</MenuItem>
                    {bonusQuarterPeriods.map((p) => (
                      <MenuItem key={p.id} value={String(p.id)}>
                        {formatPeriodTitle(p)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <FormControlLabel
                control={
                  <Switch
                    checked={showAllocatedBonus}
                    onChange={(_, checked) => setShowAllocatedBonus(checked)}
                    color="primary"
                    size="small"
                  />
                }
                label="Bonus"
                sx={{ flexShrink: 0 }}
              />
            </Box>
          </Box>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : goals.length === 0 ? (
            <Card>
              <CardContent>
                <Typography color="text.secondary">No current goal progress to show.</Typography>
              </CardContent>
            </Card>
          ) : (
            <Box display="flex" flexDirection="column">
              {/* National: only for admin */}
              {isAdmin && nationalGoals.length > 0 && (
                <ScopeSection 
                  scopeTitle={nationalScopeTitle} 
                  titleColor="primary" 
                  goals={nationalGoals}
                  isNational={true}
                  companyMultiplier={companyMultiplier}
                  companyFactor={companyFactor}
                  allBonuses={bonuses}
                  bonusRules={bonusRules}
                  guardrailsData={guardrailsData}
                  guardrailsLoading={guardrailsLoading}
                  guardrailsError={guardrailsError}
                />
              )}

              {/* Agents: admin = collapsible cards (collapsed by default); agent = own data shown directly */}
              {agentNames.map((agentName) => {
                const agentGoals: GoalProgressItem[] = [
                  ...(byType.quarter.agent[agentName] ?? []),
                  ...(byType.month.agent[agentName] ?? []),
                  ...(byType.year.agent[agentName] ?? []),
                ];
                if (agentGoals.length === 0) return null;
                const agentBonus = bonusesByAgent[agentName];
                if (isAdmin) {
                  return (
                    <Accordion key={agentName} defaultExpanded={false} variant="outlined" sx={{ mb: 3, '&:before': { display: 'none' } }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ '& .MuiAccordionSummary-content': { my: 1.5 } }}>
                        <Typography variant="h6" fontWeight="bold" color="secondary">
                          {agentName}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0 }}>
                        <ScopeSection
                          scopeTitle={agentName}
                          titleColor="secondary"
                          goals={agentGoals}
                          agentBonuses={agentBonus}
                          hideTitle
                          companyMultiplier={companyMultiplier}
                          companyFactor={companyFactor}
                          allBonuses={bonuses}
                          bonusRules={bonusRules}
                        />
                      </AccordionDetails>
                    </Accordion>
                  );
                }
                return (
                  <ScopeSection
                    key={agentName}
                    scopeTitle={agentName}
                    titleColor="secondary"
                    goals={agentGoals}
                    agentBonuses={agentBonus}
                    companyMultiplier={companyMultiplier}
                    companyFactor={companyFactor}
                    allBonuses={bonuses}
                    bonusRules={bonusRules}
                    guardrailsData={guardrailsData}
                    guardrailsLoading={guardrailsLoading}
                    guardrailsError={guardrailsError}
                  />
                );
              })}
            </Box>
          )}
        </Box>
      </PageContainer>
    </ProtectedRoute>
  );
}
