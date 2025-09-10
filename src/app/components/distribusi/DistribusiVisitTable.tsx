'use client';

import { Download as DownloadIcon, Refresh as RefreshIcon, Search as SearchIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    ImageList,
    ImageListItem,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { fetchVisits, Visit } from '../../api/distribusi/MonitoringSlice';

type OrderDirection = 'asc' | 'desc';
type SortableField = keyof Visit;

interface HeadCell {
  id: SortableField;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: 'visit_date', label: 'Visit Date', numeric: false },
  { id: 'outlet_name', label: 'Outlet Name', numeric: false },
  { id: 'outlet_pic_name', label: 'PIC Name', numeric: false },
  { id: 'outlet_bagian_pic', label: 'Position', numeric: false },
  { id: 'outlet_address', label: 'Address', numeric: false },
  { id: 'agent_name', label: 'Agent', numeric: false },
  { id: 'visit_purpose', label: 'Purpose', numeric: false },
  { id: 'check_in_time', label: 'Check In', numeric: false },
  { id: 'check_out_time', label: 'Check Out', numeric: false },
  { id: 'need_follow_up', label: 'Follow Up', numeric: false },
];

interface DistribusiVisitTableProps {
  filters: {
    month?: string;
    agent?: string;
    segment?: string;
    area?: string;
  };
  title?: string;
}

const DistribusiVisitTable = ({ 
  filters,
  title = 'Sales Visits' 
}: DistribusiVisitTableProps) => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<SortableField>('visit_date');
  const [order, setOrder] = useState<OrderDirection>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [purposeFilter, setPurposeFilter] = useState<string>('');
  const [followUpFilter, setFollowUpFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchVisitData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchVisits({
        sortTime: 'desc',
        month: filters.month,
        agent: filters.agent,
        segment: filters.segment,
        area: filters.area
      });
      
      setVisits(response.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to fetch visit data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitData();
    setPage(0);
  }, [filters.month, filters.agent, filters.segment, filters.area]);

  const handleRequestSort = (property: SortableField) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getFollowUpColor = (needFollowUp: number | null) => {
    if (needFollowUp === null) return 'default';
    return needFollowUp === 1 ? 'warning' : 'success';
  };

  const getFollowUpLabel = (needFollowUp: number | null) => {
    if (needFollowUp === null) return 'N/A';
    return needFollowUp === 1 ? 'Yes' : 'No';
  };

  const searchFields = (visit: Visit, query: string): boolean => {
    if (!query) return true;

    const searchableFields = [
      visit.outlet_name?.toLowerCase() || '',
      visit.outlet_pic_name?.toLowerCase() || '',
      visit.outlet_bagian_pic?.toLowerCase() || '',
      visit.outlet_address?.toLowerCase() || '',
      visit.agent_name?.toLowerCase() || '',
      visit.visit_purpose?.toLowerCase() || '',
      visit.visit_purpose_note?.toLowerCase() || '',
      visit.outlet_feedback?.toLowerCase() || '',
      visit.notes?.toLowerCase() || '',
    ];

    return searchableFields.some((field) =>
      field.includes(query.toLowerCase())
    );
  };

  const filteredVisits = visits.filter((v) => {
    if (agentFilter && v.agent_name !== agentFilter) return false;
    if (purposeFilter && v.visit_purpose !== purposeFilter) return false;
    if (followUpFilter) {
      if (followUpFilter === 'yes' && v.need_follow_up !== 1) return false;
      if (followUpFilter === 'no' && v.need_follow_up !== 0) return false;
    }

    if (searchQuery) {
      return searchFields(v, searchQuery);
    }

    return true;
  });

  const uniqueAgents = Array.from(new Set(visits.map((v) => v.agent_name)));
  const uniquePurposes = Array.from(new Set(visits.map((v) => v.visit_purpose)));

  const sortedVisits = [...filteredVisits].sort((a, b) => {
    let aValue: any = a[orderBy];
    let bValue: any = b[orderBy];

    if (orderBy === 'visit_date' || orderBy === 'check_in_time' || orderBy === 'check_out_time') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (order === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
    }
  });

  const totalVisits = filteredVisits.length;
  const visitsWithFollowUp = filteredVisits.filter(v => v.need_follow_up === 1).length;

  const prepareDataForExport = (visits: Visit[]) => {
    return visits.map((v) => ({
      'Visit Date': formatDate(v.visit_date),
      'Outlet Name': v.outlet_name || v.outlet_new || 'N/A',
      'PIC Name': v.outlet_pic_name,
      'Position': v.outlet_bagian_pic,
      'Address': v.outlet_address,
      'Agent': v.agent_name,
      'Purpose': v.visit_purpose,
      'Purpose Note': v.visit_purpose_note || 'N/A',
      'Check In': v.check_in_time ? formatDateTime(v.check_in_time) : 'N/A',
      'Check Out': v.check_out_time ? formatDateTime(v.check_out_time) : 'N/A',
      'Follow Up': getFollowUpLabel(v.need_follow_up),
      'Follow Up Type': v.follow_up_type || 'N/A',
      'Follow Up Date': v.follow_up_date ? formatDate(v.follow_up_date) : 'N/A',
      'Outlet Feedback': v.outlet_feedback || 'N/A',
      'Notes': v.notes || 'N/A',
    }));
  };

  const handleExcelExport = () => {
    if (!visits.length) return;

    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof Blob === 'undefined') return;

    const data = prepareDataForExport(filteredVisits);
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    const colWidths = [
      { wch: 15 }, // Visit Date
      { wch: 25 }, // Outlet Name
      { wch: 20 }, // PIC Name
      { wch: 15 }, // Position
      { wch: 30 }, // Address
      { wch: 20 }, // Agent
      { wch: 15 }, // Purpose
      { wch: 20 }, // Purpose Note
      { wch: 20 }, // Check In
      { wch: 20 }, // Check Out
      { wch: 10 }, // Follow Up
      { wch: 15 }, // Follow Up Type
      { wch: 15 }, // Follow Up Date
      { wch: 30 }, // Outlet Feedback
      { wch: 30 }, // Notes
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Sales Visits');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-visits.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearAllFilters = () => {
    setAgentFilter('');
    setPurposeFilter('');
    setFollowUpFilter('');
    setSearchQuery('');
    setPage(0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRowClick = (visit: Visit) => {
    setSelectedVisit(visit);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedVisit(null);
  };

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return null;
    return `https://juraganbeku.tokopandai.id/api/images/${imagePath}`;
  };

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchVisitData}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExcelExport}
              disabled={filteredVisits.length === 0}
              sx={{ mr: 1 }}
            >
              Export Excel
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={clearAllFilters}
              disabled={!agentFilter && !purposeFilter && !followUpFilter && !searchQuery}
            >
              Clear Filters
            </Button>
          </Box>
        </Box>

        {/* Summary Stats */}
        <Box mb={3} sx={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="primary" fontWeight="bold" mb={1}>
              {totalVisits}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Visits
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="warning.main" fontWeight="bold" mb={1}>
              {visitsWithFollowUp}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Need Follow Up
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="success.main" fontWeight="bold" mb={1}>
              {totalVisits - visitsWithFollowUp}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Completed
            </Typography>
          </Box>
        </Box>

        {/* Search and Filters */}
        <Box mb={3}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search visits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Agent</InputLabel>
                <Select
                  value={agentFilter}
                  label="Agent"
                  onChange={(e) => setAgentFilter(e.target.value)}
                >
                  <MenuItem value="">All Agents</MenuItem>
                  {uniqueAgents.map((agent) => (
                    <MenuItem key={agent} value={agent}>
                      {agent}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Purpose</InputLabel>
                <Select
                  value={purposeFilter}
                  label="Purpose"
                  onChange={(e) => setPurposeFilter(e.target.value)}
                >
                  <MenuItem value="">All Purposes</MenuItem>
                  {uniquePurposes.map((purpose) => (
                    <MenuItem key={purpose} value={purpose}>
                      {purpose}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Follow Up</InputLabel>
                <Select
                  value={followUpFilter}
                  label="Follow Up"
                  onChange={(e) => setFollowUpFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    sortDirection={orderBy === headCell.id ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={() => handleRequestSort(headCell.id)}
                    >
                      {headCell.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={headCells.length + 1} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={headCells.length + 1} align="center">
                    <Typography variant="body2" color="error">
                      {error}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : sortedVisits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headCells.length + 1} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No visits found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedVisits
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{formatDate(row.visit_date)}</TableCell>
                      <TableCell>{row.outlet_name || row.outlet_new || 'N/A'}</TableCell>
                      <TableCell>{row.outlet_pic_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.outlet_bagian_pic}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{row.outlet_address}</TableCell>
                      <TableCell>{row.agent_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.visit_purpose}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {row.check_in_time ? formatDateTime(row.check_in_time) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {row.check_out_time ? formatDateTime(row.check_out_time) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getFollowUpLabel(row.need_follow_up)}
                          color={getFollowUpColor(row.need_follow_up) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            onClick={() => handleRowClick(row)}
                            size="small"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredVisits.length)} of {filteredVisits.length} visits
            </Typography>
            <Button
              variant="outlined"
              size="small"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outlined"
              size="small"
              disabled={page >= Math.ceil(filteredVisits.length / rowsPerPage) - 1}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </Box>
        </Box>
      </CardContent>

      {/* Visit Details Modal */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Visit Details - {selectedVisit?.outlet_name || selectedVisit?.outlet_new || 'N/A'}
        </DialogTitle>
        <DialogContent>
          {selectedVisit && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom>Visit Information</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Visit Date:</Typography>
                    <Typography variant="body1">{formatDate(selectedVisit.visit_date)}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Purpose:</Typography>
                    <Typography variant="body1">{selectedVisit.visit_purpose}</Typography>
                    {selectedVisit.visit_purpose_note && (
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Note: {selectedVisit.visit_purpose_note}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Agent:</Typography>
                    <Typography variant="body1">{selectedVisit.agent_name}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Check In:</Typography>
                    <Typography variant="body1">
                      {selectedVisit.check_in_time ? formatDateTime(selectedVisit.check_in_time) : 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Check Out:</Typography>
                    <Typography variant="body1">
                      {selectedVisit.check_out_time ? formatDateTime(selectedVisit.check_out_time) : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom>Outlet Information</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Outlet Name:</Typography>
                    <Typography variant="body1">{selectedVisit.outlet_name || selectedVisit.outlet_new || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">PIC Name:</Typography>
                    <Typography variant="body1">{selectedVisit.outlet_pic_name}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Position:</Typography>
                    <Typography variant="body1">{selectedVisit.outlet_bagian_pic}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Phone:</Typography>
                    <Typography variant="body1">{selectedVisit.outlet_number_pic}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Address:</Typography>
                    <Typography variant="body1">{selectedVisit.outlet_address}</Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" gutterBottom>Follow Up Information</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Need Follow Up:</Typography>
                    <Chip
                      label={getFollowUpLabel(selectedVisit.need_follow_up)}
                      color={getFollowUpColor(selectedVisit.need_follow_up) as any}
                      size="small"
                    />
                  </Box>
                  {selectedVisit.follow_up_type && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">Follow Up Type:</Typography>
                      <Typography variant="body1">{selectedVisit.follow_up_type}</Typography>
                    </Box>
                  )}
                  {selectedVisit.follow_up_date && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">Follow Up Date:</Typography>
                      <Typography variant="body1">{formatDate(selectedVisit.follow_up_date)}</Typography>
                    </Box>
                  )}
                  {selectedVisit.outlet_feedback && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">Outlet Feedback:</Typography>
                      <Typography variant="body1">{selectedVisit.outlet_feedback}</Typography>
                    </Box>
                  )}
                  {selectedVisit.notes && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">Notes:</Typography>
                      <Typography variant="body1">{selectedVisit.notes}</Typography>
                    </Box>
                  )}
                </Grid>

                {/* Photos Section */}
                {(selectedVisit.photo_display_url || selectedVisit.photo_selfie_url || selectedVisit.signature_url) && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" gutterBottom>Photos</Typography>
                    <ImageList sx={{ width: '100%', height: 300 }} cols={3} rowHeight={200}>
                      {selectedVisit.photo_display_url && (
                        <ImageListItem>
                          <img
                            src={getImageUrl(selectedVisit.photo_display_url) || ''}
                            alt="Display Photo"
                            loading="lazy"
                            style={{ objectFit: 'cover' }}
                          />
                          <Typography variant="caption" sx={{ textAlign: 'center', mt: 1 }}>
                            Display Photo
                          </Typography>
                        </ImageListItem>
                      )}
                      {selectedVisit.photo_selfie_url && (
                        <ImageListItem>
                          <img
                            src={getImageUrl(selectedVisit.photo_selfie_url) || ''}
                            alt="Selfie Photo"
                            loading="lazy"
                            style={{ objectFit: 'cover' }}
                          />
                          <Typography variant="caption" sx={{ textAlign: 'center', mt: 1 }}>
                            Selfie Photo
                          </Typography>
                        </ImageListItem>
                      )}
                      {selectedVisit.signature_url && (
                        <ImageListItem>
                          <img
                            src={getImageUrl(selectedVisit.signature_url) || ''}
                            alt="Signature"
                            loading="lazy"
                            style={{ objectFit: 'cover' }}
                          />
                          <Typography variant="caption" sx={{ textAlign: 'center', mt: 1 }}>
                            Signature
                          </Typography>
                        </ImageListItem>
                      )}
                    </ImageList>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Close</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default DistribusiVisitTable;
