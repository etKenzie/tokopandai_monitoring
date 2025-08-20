'use client';

import { Download as DownloadIcon, Refresh as RefreshIcon, Search as SearchIcon } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    FormControl,
    Grid,
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
    TablePagination,
    TableRow,
    TableSortLabel,
    TextField,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { fetchKaryawanOverdue, KaryawanOverdue } from '../../api/kasbon/KasbonSlice';

type Order = 'asc' | 'desc';
type SortableField = keyof KaryawanOverdue;

interface HeadCell {
  id: SortableField;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: 'id_karyawan', label: 'Employee ID', numeric: true },
  { id: 'name', label: 'Name', numeric: false },
  { id: 'company', label: 'Company', numeric: false },
  { id: 'sourced_to', label: 'Sourced To', numeric: false },
  { id: 'project', label: 'Project', numeric: false },
  { id: 'rec_status', label: 'Status', numeric: false },
  { id: 'total_amount_owed', label: 'Amount Owed', numeric: true },
];

interface KaryawanOverdueTableProps {
  filters: {
    employer: string;
    placement: string;
    project: string;
    month: string;
    year: string;
  };
  title?: string;
}

const KaryawanOverdueTable = ({ 
  filters,
  title = 'Overdue Karyawan' 
}: KaryawanOverdueTableProps) => {
  const [karyawan, setKaryawan] = useState<KaryawanOverdue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<SortableField>('id_karyawan');
  const [order, setOrder] = useState<Order>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [sourcedToFilter, setSourcedToFilter] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchOverdueData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchKaryawanOverdue({
        employer: filters.employer || undefined,
        sourced_to: filters.placement || undefined,
        project: filters.project || undefined,
        id_karyawan: undefined,
        month: filters.month || undefined,
        year: filters.year || undefined
      });
      
      setKaryawan(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to fetch overdue data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filters.month && filters.year) {
      fetchOverdueData();
    }
  }, [filters]);

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

  const getStatusColor = (status: string | null) => {
    if (!status) return 'default';
    switch (status.toLowerCase()) {
      case 'new hire': return 'info';
      case 'active': return 'success';
      case 'inactive': return 'error';
      default: return 'default';
    }
  };

  const searchFields = (karyawan: KaryawanOverdue, query: string): boolean => {
    if (!query) return true;

    const searchableFields = [
      karyawan.id_karyawan.toString(),
      karyawan.name.toLowerCase(),
      karyawan.company.toLowerCase(),
      karyawan.sourced_to.toLowerCase(),
      karyawan.project.toLowerCase(),
      karyawan.rec_status?.toLowerCase() || '',
    ];

    return searchableFields.some((field) =>
      field.includes(query.toLowerCase())
    );
  };

  const filteredKaryawan = karyawan.filter((k) => {
    // Apply filters
    if (companyFilter && k.company !== companyFilter) return false;
    if (sourcedToFilter && k.sourced_to !== sourcedToFilter) return false;
    if (projectFilter && k.project !== projectFilter) return false;
    if (statusFilter && k.rec_status !== statusFilter) return false;

    // Search functionality
    if (searchQuery) {
      return searchFields(k, searchQuery);
    }

    return true;
  });

  const uniqueCompanies = Array.from(new Set(karyawan.map((k) => k.company)));
  const uniqueSourcedTo = Array.from(new Set(karyawan.map((k) => k.sourced_to)));
  const uniqueProjects = Array.from(new Set(karyawan.map((k) => k.project)));
  const uniqueStatuses = Array.from(new Set(karyawan.map((k) => k.rec_status).filter(Boolean)));

  const sortedKaryawan = [...filteredKaryawan].sort((a, b) => {
    let aValue: any = a[orderBy];
    let bValue: any = b[orderBy];

    if (orderBy === 'id_karyawan' || orderBy === 'total_amount_owed') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }

    if (order === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
    }
  });

  const totalAmountOwed = filteredKaryawan.reduce((sum, k) => sum + k.total_amount_owed, 0);

  const prepareDataForExport = (karyawan: KaryawanOverdue[]) => {
    return karyawan.map((k) => ({
      'Employee ID': k.id_karyawan,
      'Name': k.name,
      'Company': k.company,
      'Sourced To': k.sourced_to,
      'Project': k.project,
      'Status': k.rec_status || 'N/A',
      'Amount Owed': k.total_amount_owed,
    }));
  };

  const handleExport = () => {
    // Only run on client side
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof Blob === 'undefined') return;
    
    const data = prepareDataForExport(filteredKaryawan);
    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'karyawan-overdue-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h6">{title}</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchOverdueData}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={filteredKaryawan.length === 0}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Summary Stats */}
        <Box mb={3} sx={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="error" fontWeight="bold" mb={1}>
              {formatCurrency(totalAmountOwed)}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Amount Owed
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="primary" fontWeight="bold" mb={1}>
              {filteredKaryawan.length}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Overdue Employees
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
                placeholder="Search employees..."
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
                <InputLabel>Company</InputLabel>
                <Select
                  value={companyFilter}
                  label="Company"
                  onChange={(e) => setCompanyFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {uniqueCompanies.map((company) => (
                    <MenuItem key={company} value={company}>
                      {company}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Sourced To</InputLabel>
                <Select
                  value={sourcedToFilter}
                  label="Sourced To"
                  onChange={(e) => setSourcedToFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {uniqueSourcedTo.map((sourcedTo) => (
                    <MenuItem key={sourcedTo} value={sourcedTo}>
                      {sourcedTo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Project</InputLabel>
                <Select
                  value={projectFilter}
                  label="Project"
                  onChange={(e) => setProjectFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {uniqueProjects.map((project) => (
                    <MenuItem key={project} value={project}>
                      {project}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {uniqueStatuses.map((status) => (
                    <MenuItem key={status} value={status || ''}>
                      {status || 'N/A'}
                    </MenuItem>
                  ))}
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
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={headCells.length} align="center">
                    <Typography variant="body2" color="textSecondary">
                      Loading...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={headCells.length} align="center">
                    <Typography variant="body2" color="error">
                      {error}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : sortedKaryawan.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headCells.length} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No overdue data found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedKaryawan
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <TableRow key={row.id_karyawan} hover>
                      <TableCell align="right">{row.id_karyawan}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.company}</TableCell>
                      <TableCell>{row.sourced_to}</TableCell>
                      <TableCell>{row.project}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.rec_status || 'N/A'}
                          color={getStatusColor(row.rec_status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                        {formatCurrency(row.total_amount_owed)}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredKaryawan.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>

    
      </CardContent>
    </Card>
  );
};

export default KaryawanOverdueTable;
