'use client';

import { Download as DownloadIcon } from '@mui/icons-material';
import {
    Box,
    Button,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Typography
} from '@mui/material';
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { ClientSummary } from '../../api/kasbon/KasbonSlice';

interface ClientPenetrationTableProps {
  data: ClientSummary[];
  loading: boolean;
  error: string | null;
}

const ClientPenetrationTable = ({
  data,
  loading,
  error
}: ClientPenetrationTableProps) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sort data by penetration_rate in descending order
  const sortedData = [...data].sort((a, b) => {
    return b.penetration_rate - a.penetration_rate;
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    // Ensure minimum of 10 rows per page
    const adjustedRowsPerPage = Math.max(10, newRowsPerPage);
    setRowsPerPage(adjustedRowsPerPage);
    setPage(0);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const prepareDataForExport = (data: ClientSummary[]) => {
    return data.map((item, index) => ({
      'Rank': index + 1,
      'Sourced To': item.sourced_to,
      'Project': item.project,
      'Active Employees': item.active_employees,
      'Eligible Employees': item.eligible_employees,
      'Eligible Rate': formatPercentage(item.eligible_rate),
      'Approved Requests': item.approved_requests,
      'Penetration Rate': formatPercentage(item.penetration_rate),
    }));
  };

  const handleExcelExport = () => {
    if (!data.length) return;

    // Only run on client side
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof Blob === 'undefined') return;

    const exportData = prepareDataForExport(sortedData);
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
      { wch: 8 },  // Rank
      { wch: 35 }, // Sourced To
      { wch: 25 }, // Project
      { wch: 18 }, // Active Employees
      { wch: 18 }, // Eligible Employees
      { wch: 15 }, // Eligible Rate
      { wch: 18 }, // Approved Requests
      { wch: 18 }, // Penetration Rate
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'ClientPenetration');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Download file
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clients-by-penetration-rate.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6">Clients by Penetration Rate</Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExcelExport}
          disabled={sortedData.length === 0}
          size="small"
        >
          Export Excel
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ height: '350px' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', width: '80px' }}>Rank</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Sourced To</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Active Employees</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Eligible Employees</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Eligible Rate</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Approved Requests</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Penetration Rate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress size={20} />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="error">
                    {error}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No data found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => (
                  <TableRow key={`${row.sourced_to}-${row.project}`} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {page * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell>{row.sourced_to}</TableCell>
                    <TableCell>{row.project}</TableCell>
                    <TableCell align="right">{row.active_employees.toLocaleString()}</TableCell>
                    <TableCell align="right">{row.eligible_employees.toLocaleString()}</TableCell>
                    <TableCell align="right">{formatPercentage(row.eligible_rate)}</TableCell>
                    <TableCell align="right">{row.approved_requests.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {formatPercentage(row.penetration_rate)}
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={sortedData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default ClientPenetrationTable;
