"use client";

import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import PageContainer from "@/app/components/container/PageContainer";
import { useAuth } from '@/app/context/AuthContext';
import { useCheckRoles } from '@/app/hooks/useCheckRoles';
import { getAgentIdFromRole, getAgentNameFromRole, getPageRoles, getRestrictedRoles } from '@/config/roles';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  LinearProgress,
  Switch,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useCallback, useEffect, useMemo, useState } from 'react';

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
}

function formatCurrency(value: number): string {
  if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
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

/** Progress fill color: 0% → red, 100% → green (HSL hue 0 → 120). */
function progressFillColor(pct: number): string {
  const hue = Math.max(0, Math.min(120, (pct / 100) * 120));
  return `hsl(${hue}, 70%, 45%)`;
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

  const fetchProgress = useCallback(async () => {
    if (!API_BASE) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('current', 'true');
      if (agentIdForApi !== undefined) params.set('agent_id', String(agentIdForApi));
      const res = await fetch(`${API_BASE}/api/goals/progress?${params.toString()}`);
      const json = await res.json();
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
  }, [agentIdForApi]);

  const fetchBonuses = useCallback(async () => {
    if (!API_BASE) return;
    setBonusLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('current', 'true');
      if (agentIdForApi !== undefined) params.set('agent_id', String(agentIdForApi));
      const res = await fetch(`${API_BASE}/api/bonus?${params.toString()}`);
      const json = await res.json();
      if (json?.data?.bonuses) setBonuses(json.data.bonuses);
      else setBonuses([]);
    } catch (e) {
      console.error('Failed to fetch bonuses:', e);
      setBonuses([]);
    } finally {
      setBonusLoading(false);
    }
  }, [agentIdForApi]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  useEffect(() => {
    fetchBonuses();
  }, [fetchBonuses]);

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
    const pct = Math.min(100, Math.round((actual / target) * 100));
    const fillColor = progressFillColor(pct);
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 2 }}>
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          {/* Grey track (full circle) — unfilled part */}
          <CircularProgress
            variant="determinate"
            value={100}
            size={120}
            thickness={5}
            sx={{ position: 'absolute', color: 'grey.300' }}
          />
          {/* Colored progress — filled part (red → green by pct) */}
          <CircularProgress variant="determinate" value={pct} size={120} thickness={5} sx={{ color: fillColor }} />
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h4" fontWeight="bold">{pct}%</Typography>
            <Typography variant="caption" color="text.secondary">profit</Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {formatCurrency(actual)} / {formatCurrency(g.target_value)}
        </Typography>
      </Box>
    );
  };

  /** One row for non-profit goals: goal type, actual/target, linear progress (fill color by pct: red → green) */
  const LinearGoalRow = ({ g }: { g: GoalProgressItem }) => {
    const actual = g.progress?.actual_value ?? 0;
    const target = g.target_value || 1;
    const pct = Math.min(100, Math.round((actual / target) * 100));
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
          <Typography variant="body2">{g.goal_type || '—'}</Typography>
          <Typography variant="body2">
            {formatCurrency(actual)} / {formatCurrency(g.target_value)} · <strong>{pct}%</strong>
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={pct}
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
  }: {
    periodType: 'quarter' | 'month' | 'year';
    periodTitle: string;
    goals: GoalProgressItem[];
    titleColor?: 'primary' | 'secondary';
    allocatedBonus?: BonusFromApi | null;
  }) => {
    const list = getGoalsForPeriod(goals, periodType);
    if (list.length === 0 && !allocatedBonus) return null;
    const title = periodTitle || (periodType === 'quarter' ? 'Quarter' : periodType === 'month' ? 'Month' : 'Year');
    const isQuarterOrMonth = periodType === 'quarter' || periodType === 'month';
    const profitGoal = isQuarterOrMonth ? list.find((g) => (g.goal_type || '').toLowerCase() === 'profit') : null;
    const otherGoals = isQuarterOrMonth && profitGoal ? list.filter((g) => g.id !== profitGoal.id) : list;

    return (
      <Card variant="outlined" sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" color={titleColor}>
              {title}
            </Typography>
            {allocatedBonus && (
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
  }: {
    scopeTitle: string;
    titleColor?: 'primary' | 'secondary';
    goals: GoalProgressItem[];
    agentBonuses?: { quarter: BonusFromApi[]; year: BonusFromApi[] };
    hideTitle?: boolean;
  }) => {
    const quarterList = getGoalsForPeriod(goals, 'quarter');
    const monthList = getGoalsForPeriod(goals, 'month');
    const yearList = getGoalsForPeriod(goals, 'year');
    const quarterBonus = shouldShowBonus ? (agentBonuses?.quarter[0] ?? null) : null;
    const yearBonus = shouldShowBonus ? (agentBonuses?.year[0] ?? null) : null;
    return (
      <Box sx={{ mb: 3 }}>
        {!hideTitle && (
          <Typography variant="h6" fontWeight="bold" color={titleColor} gutterBottom sx={{ mb: 2 }}>
            {scopeTitle}
          </Typography>
        )}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <PeriodCard periodType="quarter" periodTitle={getPeriodTitleFromGoals(quarterList)} goals={goals} titleColor={titleColor} allocatedBonus={quarterBonus} />
          <PeriodCard periodType="month" periodTitle={getPeriodTitleFromGoals(monthList)} goals={goals} titleColor={titleColor} />
        </Box>
        <PeriodCard periodType="year" periodTitle={getPeriodTitleFromGoals(yearList)} goals={goals} titleColor={titleColor} allocatedBonus={yearBonus} />
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
                {isAdmin
                  ? 'Current goal progress — national and all agents.'
                  : agentNameForDisplay
                    ? `Current goal progress for ${agentNameForDisplay}.`
                    : 'Current goal progress.'}
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={showAllocatedBonus}
                  onChange={(_, checked) => setShowAllocatedBonus(checked)}
                  color="primary"
                  size="small"
                />
              }
              label="Show Alokasi Bonus"
              sx={{ flexShrink: 0 }}
            />
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
                <ScopeSection scopeTitle="National" titleColor="primary" goals={nationalGoals} />
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
                    <Accordion key={agentName} defaultExpanded={false} variant="outlined" sx={{ mb: 1.5, '&:before': { display: 'none' } }}>
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
