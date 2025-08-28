'use client';

import { Download as DownloadIcon, Refresh as RefreshIcon, Search as SearchIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
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
  { id: 'ktp', label: 'KTP', numeric: false },
  { id: 'name', label: 'Name', numeric: false },
  { id: 'company', label: 'Company', numeric: false },
  { id: 'sourced_to', label: 'Sourced To', numeric: false },
  { id: 'project', label: 'Project', numeric: false },
  { id: 'total_amount_owed', label: 'Amount Owed', numeric: true },
  { id: 'repayment_date', label: 'Repayment Date', numeric: false },
  { id: 'days_overdue', label: 'Days Overdue', numeric: true },
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Use month and year from filters prop
  const selectedMonth = filters.month || '';
  const selectedYear = filters.year || '';

  const fetchOverdueData = async () => {
    if (!selectedMonth || !selectedYear) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetchKaryawanOverdue({
        employer: filters.employer || undefined,
        sourced_to: filters.placement || undefined,
        project: filters.project || undefined,
        id_karyawan: undefined,
        month: selectedMonth,
        year: selectedYear
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
    if (selectedMonth && selectedYear) {
      fetchOverdueData();
    }
  }, [selectedMonth, selectedYear, filters.employer, filters.placement, filters.project]);

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

  const getDaysOverdueColor = (days: number) => {
    if (days <= 7) return 'success';
    if (days <= 30) return 'warning';
    return 'error';
  };

  const searchFields = (karyawan: KaryawanOverdue, query: string): boolean => {
    if (!query) return true;

    const searchableFields = [
      karyawan.id_karyawan.toString(),
      karyawan.ktp.toLowerCase(),
      karyawan.name.toLowerCase(),
      karyawan.company.toLowerCase(),
      karyawan.sourced_to.toLowerCase(),
      karyawan.project.toLowerCase(),
      karyawan.repayment_date.toLowerCase(),
      karyawan.days_overdue.toString(),
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

    // Search functionality
    if (searchQuery) {
      return searchFields(k, searchQuery);
    }

    return true;
  });

  const uniqueCompanies = Array.from(new Set(karyawan.map((k) => k.company)));
  const uniqueSourcedTo = Array.from(new Set(karyawan.map((k) => k.sourced_to)));
  const uniqueProjects = Array.from(new Set(karyawan.map((k) => k.project)));

  const sortedKaryawan = [...filteredKaryawan].sort((a, b) => {
    let aValue: any = a[orderBy];
    let bValue: any = b[orderBy];

    if (orderBy === 'id_karyawan' || orderBy === 'total_amount_owed' || orderBy === 'days_overdue') {
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
  const totalDaysOverdue = filteredKaryawan.reduce((sum, k) => sum + k.days_overdue, 0);

  const prepareDataForExport = (karyawan: KaryawanOverdue[]) => {
    return karyawan.map((k) => ({
      'Employee ID': k.id_karyawan,
      'KTP': k.ktp,
      'Name': k.name,
      'Company': k.company,
      'Sourced To': k.sourced_to,
      'Project': k.project,
      'Amount Owed': k.total_amount_owed,
      'Repayment Date': k.repayment_date,
      'Days Overdue': k.days_overdue,
    }));
  };

  const handleExcelExport = () => {
    if (!karyawan.length) return;

    // Only run on client side
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof Blob === 'undefined') return;

    const data = prepareDataForExport(filteredKaryawan);
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    const colWidths = [
      { wch: 12 }, // Employee ID
      { wch: 20 }, // KTP
      { wch: 25 }, // Name
      { wch: 25 }, // Company
      { wch: 25 }, // Sourced To
      { wch: 20 }, // Project
      { wch: 15 }, // Amount Owed
      { wch: 15 }, // Repayment Date
      { wch: 15 }  // Days Overdue
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Overdue Karyawan Data');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Download file
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `karyawan-overdue-${selectedMonth}-${selectedYear}.xlsx`;
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
              onClick={handleExcelExport}
              disabled={filteredKaryawan.length === 0}
            >
              Export Excel
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
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="warning.main" fontWeight="bold" mb={1}>
              {Math.round(totalDaysOverdue / filteredKaryawan.length || 0)}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Avg Days Overdue
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
            {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
            </Grid> */}
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
                    <CircularProgress />
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
                      <TableCell>{row.ktp}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.company}</TableCell>
                      <TableCell>{row.sourced_to}</TableCell>
                      <TableCell>{row.project}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                        {formatCurrency(row.total_amount_owed)}
                      </TableCell>
                      <TableCell>{formatDate(row.repayment_date)}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${row.days_overdue} days`}
                          color={getDaysOverdueColor(row.days_overdue) as any}
                          size="small"
                        />
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
