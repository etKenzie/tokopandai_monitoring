'use client';

import { Download as DownloadIcon, Search as SearchIcon } from '@mui/icons-material';
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
import React, { useState } from 'react';
import { Karyawan } from '../../api/kasbon/KasbonSlice';

type Order = 'asc' | 'desc';
type SortableField = keyof Karyawan;

interface HeadCell {
  id: SortableField;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: 'id_karyawan', label: 'Employee ID', numeric: true },
  { id: 'status', label: 'Status', numeric: false },
  { id: 'loan_kasbon_eligible', label: 'Kasbon Eligible', numeric: false },
  { id: 'klient', label: 'Client', numeric: false },
];

interface KaryawanTableProps {
  karyawan: Karyawan[];
  title?: string;
  loading?: boolean;
  onRefresh?: () => void;
}

const KaryawanTable = ({ 
  karyawan: initialKaryawan, 
  title = 'Employee Data', 
  loading = false,
  onRefresh 
}: KaryawanTableProps) => {
  const [karyawan, setKaryawan] = useState<Karyawan[]>(initialKaryawan);
  const [orderBy, setOrderBy] = useState<SortableField>('id_karyawan');
  const [order, setOrder] = useState<Order>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [eligibleFilter, setEligibleFilter] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Update karyawan when prop changes
  React.useEffect(() => {
    setKaryawan(initialKaryawan);
  }, [initialKaryawan]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case '1': return 'success';
      case '2': return 'warning';
      case '3': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case '1': return 'Active';
      case '2': return 'Pending';
      case '3': return 'Inactive';
      default: return 'Unknown';
    }
  };

  const getEligibleColor = (eligible: number) => {
    return eligible === 1 ? 'success' : 'default';
  };

  const searchFields = (karyawan: Karyawan, query: string): boolean => {
    if (!query) return true;

    const searchableFields = [
      karyawan.id_karyawan.toString(),
      getStatusLabel(karyawan.status),
      karyawan.loan_kasbon_eligible === 1 ? 'Yes' : 'No',
      karyawan.klient,
    ];

    return searchableFields.some((field) =>
      field.toLowerCase().includes(query.toLowerCase())
    );
  };

  const filteredKaryawan = karyawan.filter((k) => {
    // Apply filters
    if (statusFilter && k.status !== statusFilter) return false;
    if (eligibleFilter !== '' && k.loan_kasbon_eligible.toString() !== eligibleFilter) return false;
    if (clientFilter && k.klient !== clientFilter) return false;

    // Search functionality
    if (searchQuery) {
      return searchFields(k, searchQuery);
    }

    return true;
  });

  const uniqueStatuses = Array.from(new Set(karyawan.map((k) => k.status)));
  const uniqueClients = Array.from(new Set(karyawan.map((k) => k.klient)));

  const sortedKaryawan = [...filteredKaryawan].sort((a, b) => {
    let aValue: any = a[orderBy];
    let bValue: any = b[orderBy];

    if (orderBy === 'id_karyawan') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }

    if (order === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
    }
  });

  const prepareDataForExport = (karyawan: Karyawan[]) => {
    return karyawan.map((k) => ({
      'Employee ID': k.id_karyawan,
      'Status': getStatusLabel(k.status),
      'Kasbon Eligible': k.loan_kasbon_eligible === 1 ? 'Yes' : 'No',
      'Client': k.klient,
    }));
  };

  const handleExport = () => {
    const data = prepareDataForExport(filteredKaryawan);
    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'karyawan-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
            {onRefresh && (
              <Button
                variant="outlined"
                onClick={onRefresh}
                sx={{ mr: 1 }}
                disabled={loading}
              >
                Refresh
              </Button>
            )}
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

        {/* Search and Filters */}
        <Box mb={3}>
          <Grid container spacing={2}>
            <Grid
              size={{
                xs: 12
              }}>
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
            <Grid
              size={{
                xs: 12,
                sm: 4
              }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {uniqueStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid
              size={{
                xs: 12,
                sm: 4
              }}>
              <FormControl fullWidth>
                <InputLabel>Kasbon Eligible</InputLabel>
                <Select
                  value={eligibleFilter}
                  label="Kasbon Eligible"
                  onChange={(e) => setEligibleFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="1">Yes</MenuItem>
                  <MenuItem value="0">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid
              size={{
                xs: 12,
                sm: 4
              }}>
              <FormControl fullWidth>
                <InputLabel>Client</InputLabel>
                <Select
                  value={clientFilter}
                  label="Client"
                  onChange={(e) => setClientFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {uniqueClients.map((client) => (
                    <MenuItem key={client} value={client}>
                      Client {client}
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
              ) : sortedKaryawan.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headCells.length} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No data found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedKaryawan
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <TableRow key={row.id_karyawan} hover>
                      <TableCell align="right">{row.id_karyawan}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(row.status)}
                          color={getStatusColor(row.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.loan_kasbon_eligible === 1 ? 'Yes' : 'No'}
                          color={getEligibleColor(row.loan_kasbon_eligible) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>Client {row.klient}</TableCell>
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

          {/* Summary */}
          {!loading && filteredKaryawan.length > 0 && (
            <Box mt={2} textAlign="right">
              <Typography variant="body2" color="textSecondary">
                Showing {Math.min(rowsPerPage, filteredKaryawan.length - page * rowsPerPage)} of {filteredKaryawan.length} employees
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

export default KaryawanTable; 