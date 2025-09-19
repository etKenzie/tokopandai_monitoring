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
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { goalProfit } from '../../(DashboardLayout)/distribusi/goalProfit';

interface GoalProfitEntry {
  agent: string;
  monthYear: string;
  value: number;
}

interface AgentGoalProfits {
  [agent: string]: {
    [monthYear: string]: number;
  };
}

const SettingsManager = () => {
  const { settings, loading, error, updateSetting, isAdmin } = useSettings();
  const [targetDate, setTargetDate] = useState('');
  const [goalProfitData, setGoalProfitData] = useState<AgentGoalProfits>({});
  const [editingEntry, setEditingEntry] = useState<GoalProfitEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);

  // Available agents from static data
  const availableAgents = Object.keys(goalProfit).sort();

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

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setTargetDate(settings.target_date || '2025-10-03');
      setGoalProfitData(settings.goal_profit || {});
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

  const getAgentList = () => {
    return Object.keys(goalProfitData).sort();
  };

  const getAgentMonths = (agent: string) => {
    return Object.entries(goalProfitData[agent] || {}).sort(([a], [b]) => {
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

  const handleImportStaticData = async () => {
    try {
      setSaving(true);
      
      // Convert the static goalProfit data to the format expected by settings
      const staticData: AgentGoalProfits = {};
      Object.entries(goalProfit).forEach(([agent, months]) => {
        staticData[agent] = Object.assign({}, months);
      });
      
      setGoalProfitData(staticData);
      await updateSetting('goal_profit', staticData);
      
      console.log('Static goal profit data imported successfully');
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

      <Grid container spacing={3}>
        {/* Target Date Setting */}
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
      </Grid>

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
    </Box>
  );
};

export default SettingsManager;
