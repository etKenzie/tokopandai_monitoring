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
import { Complaint, fetchComplaints } from '../../api/distribusi/MonitoringSlice';

type OrderDirection = 'asc' | 'desc';
type SortableField = keyof Complaint;

interface HeadCell {
  id: SortableField;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: 'created_at', label: 'Date', numeric: false },
  { id: 'order_code', label: 'Order Code', numeric: false },
  { id: 'store_name', label: 'Store Name', numeric: false },
  { id: 'agent_name', label: 'Agent', numeric: false },
  { id: 'product_name', label: 'Product Name', numeric: false },
  { id: 'product_sku', label: 'SKU', numeric: false },
  { id: 'alasan', label: 'Reason', numeric: false },
  { id: 'file', label: 'Attachment', numeric: false },
];

interface DistribusiComplaintTableProps {
  filters: {
    month?: string;
    year?: string;
    alasan?: string;
    agent?: string;
  };
  title?: string;
}

const DistribusiComplaintTable = ({ 
  filters,
  title = 'Product Complaints' 
}: DistribusiComplaintTableProps) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<SortableField>('created_at');
  const [order, setOrder] = useState<OrderDirection>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [reasonFilter, setReasonFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchComplaintData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchComplaints({
        sortTime: 'desc',
        month: filters.month,
        year: filters.year,
        alasan: filters.alasan,
        agent: filters.agent
      });
      
      setComplaints(response.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to fetch complaint data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintData();
    setPage(0);
  }, [filters.month, filters.year, filters.alasan, filters.agent]);

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

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'Produk Tidak Sesuai': return 'error';
      case 'Produk Rusak': return 'warning';
      case 'Kualitas Buruk': return 'error';
      case 'Pengiriman Lambat': return 'info';
      default: return 'default';
    }
  };

  const searchFields = (complaint: Complaint, query: string): boolean => {
    if (!query) return true;

    const searchableFields = [
      complaint.order_code?.toLowerCase() || '',
      complaint.store_name?.toLowerCase() || '',
      complaint.product_name?.toLowerCase() || '',
      complaint.product_sku?.toLowerCase() || '',
      complaint.alasan?.toLowerCase() || '',
    ];

    return searchableFields.some((field) =>
      field.includes(query.toLowerCase())
    );
  };

  const filteredComplaints = complaints.filter((c) => {
    if (reasonFilter && c.alasan !== reasonFilter) return false;

    if (searchQuery) {
      return searchFields(c, searchQuery);
    }

    return true;
  });

  const uniqueReasons = Array.from(new Set(complaints.map((c) => c.alasan)));

  const sortedComplaints = [...filteredComplaints].sort((a, b) => {
    let aValue: any = a[orderBy];
    let bValue: any = b[orderBy];

    if (orderBy === 'created_at' || orderBy === 'updated_at') {
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

  const totalComplaints = filteredComplaints.length;
  const complaintsByReason = uniqueReasons.reduce((acc, reason) => {
    acc[reason] = filteredComplaints.filter(c => c.alasan === reason).length;
    return acc;
  }, {} as Record<string, number>);

  const prepareDataForExport = (complaints: Complaint[]) => {
    return complaints.map((c) => ({
      'Date': formatDate(c.created_at),
      'Order Code': c.order_code,
      'Store Name': c.store_name,
      'Product Name': c.product_name,
      'SKU': c.product_sku,
      'Reason': c.alasan,
      'Has Attachment': c.file ? 'Yes' : 'No',
      'Attachment File': c.file || 'N/A',
    }));
  };

  const handleExcelExport = () => {
    if (!complaints.length) return;

    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof Blob === 'undefined') return;

    const data = prepareDataForExport(filteredComplaints);
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    const colWidths = [
      { wch: 15 }, // Date
      { wch: 15 }, // Order Code
      { wch: 30 }, // Store Name
      { wch: 40 }, // Product Name
      { wch: 20 }, // SKU
      { wch: 25 }, // Reason
      { wch: 15 }, // Has Attachment
      { wch: 30 }, // Attachment File
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Product Complaints');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-complaints.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearAllFilters = () => {
    setReasonFilter('');
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

  const handleRowClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedComplaint(null);
  };

  const getImageUrl = (filePath: string | null) => {
    if (!filePath) return null;
    return `https://juraganbeku.tokopandai.id/storage/images/${filePath}`;
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
              onClick={fetchComplaintData}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExcelExport}
              disabled={filteredComplaints.length === 0}
              sx={{ mr: 1 }}
            >
              Export Excel
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={clearAllFilters}
              disabled={!reasonFilter && !searchQuery}
            >
              Clear Filters
            </Button>
          </Box>
        </Box>

        {/* Summary Stats */}
        <Box mb={3} sx={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="primary" fontWeight="bold" mb={1}>
              {totalComplaints}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Complaints
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="error.main" fontWeight="bold" mb={1}>
              {complaintsByReason['Produk Tidak Sesuai'] || 0}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Product Mismatch
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="warning.main" fontWeight="bold" mb={1}>
              {complaintsByReason['Produk Rusak'] || 0}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Damaged Products
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
                placeholder="Search complaints..."
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
                <InputLabel>Reason</InputLabel>
                <Select
                  value={reasonFilter}
                  label="Reason"
                  onChange={(e) => setReasonFilter(e.target.value)}
                >
                  <MenuItem value="">All Reasons</MenuItem>
                  {uniqueReasons.map((reason) => (
                    <MenuItem key={reason} value={reason}>
                      {reason}
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
              ) : sortedComplaints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headCells.length + 1} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No complaints found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedComplaints
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{formatDate(row.created_at)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {row.order_code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.store_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {row.agent_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.product_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {row.product_sku}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.alasan}
                          color={getReasonColor(row.alasan) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {row.file ? (
                          <Chip
                            label="Yes"
                            color="success"
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            label="No"
                            color="default"
                            size="small"
                            variant="outlined"
                          />
                        )}
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
              Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredComplaints.length)} of {filteredComplaints.length} complaints
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
              disabled={page >= Math.ceil(filteredComplaints.length / rowsPerPage) - 1}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </Box>
        </Box>
      </CardContent>

      {/* Complaint Details Modal */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Complaint Details - Order {selectedComplaint?.order_code}
        </DialogTitle>
        <DialogContent>
          {selectedComplaint && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom>Complaint Information</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Complaint ID:</Typography>
                    <Typography variant="body1">{selectedComplaint.id}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Order Code:</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedComplaint.order_code}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Store Name:</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedComplaint.store_name}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Reason:</Typography>
                    <Chip
                      label={selectedComplaint.alasan}
                      color={getReasonColor(selectedComplaint.alasan) as any}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Created Date:</Typography>
                    <Typography variant="body1">{formatDateTime(selectedComplaint.created_at)}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Updated Date:</Typography>
                    <Typography variant="body1">{formatDateTime(selectedComplaint.updated_at)}</Typography>
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom>Product Information</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Product Name:</Typography>
                    <Typography variant="body1">{selectedComplaint.product_name}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">SKU:</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedComplaint.product_sku}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Product ID:</Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {selectedComplaint.product_id}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Order ID:</Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {selectedComplaint.order_id}
                    </Typography>
                  </Box>
                </Grid>

                {/* Attachment Section */}
                {selectedComplaint.file && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" gutterBottom>Attachment</Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">File:</Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {selectedComplaint.file}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <img
                        src={getImageUrl(selectedComplaint.file) || ''}
                        alt="Complaint Attachment"
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '400px', 
                          objectFit: 'contain',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </Box>
                  </Grid>
                )}

                {/* System Information */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" gutterBottom>System Information</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Created By:</Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {selectedComplaint.created_by}
                    </Typography>
                  </Box>
                  {selectedComplaint.updated_by && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">Updated By:</Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {selectedComplaint.updated_by}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Status:</Typography>
                    <Chip
                      label={selectedComplaint.deleted_at ? 'Deleted' : 'Active'}
                      color={selectedComplaint.deleted_at ? 'error' : 'success'}
                      size="small"
                    />
                  </Box>
                </Grid>
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

export default DistribusiComplaintTable;
