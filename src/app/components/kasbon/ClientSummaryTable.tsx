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

interface ClientSummaryTableProps {
  data: ClientSummary[];
  loading: boolean;
  error: string | null;
  title: string;
  sortBy: keyof ClientSummary;
  displayField: keyof ClientSummary;
  displayFieldLabel: string;
  formatValue: (value: number) => string;
}

const ClientSummaryTable = ({
  data,
  loading,
  error,
  title,
  sortBy,
  displayField,
  displayFieldLabel,
  formatValue
}: ClientSummaryTableProps) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sort data by the specified field in descending order
  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortBy] as number;
    const bValue = b[sortBy] as number;
    return bValue - aValue;
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

  const prepareDataForExport = (data: ClientSummary[]) => {
    return data.map((item, index) => ({
      'Rank': index + 1,
      'Sourced To': item.sourced_to,
      'Project': item.project,
      [displayFieldLabel]: formatValue(item[displayField] as number),
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
      { wch: 20 }, // Display Field
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, title.replace(/\s+/g, ''));

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Download file
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.xlsx`;
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
        <Typography variant="h6">{title}</Typography>
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
              <TableCell sx={{ fontWeight: 'bold' }} align="right">{displayFieldLabel}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="error">
                    {error}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
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
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {formatValue(row[displayField] as number)}
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

export default ClientSummaryTable;
