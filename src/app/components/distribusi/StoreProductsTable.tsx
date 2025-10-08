'use client';

import { Download as DownloadIcon, Refresh as RefreshIcon, Search as SearchIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
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
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { ProductSummaryData } from '../../api/distribusi/DistribusiSlice';
import ProductDetailModal from './ProductDetailModal';

type ProductDirection = 'asc' | 'desc';
type SortableProductField = keyof ProductSummaryData;

interface ProductHeadCell {
  id: SortableProductField;
  label: string;
  numeric: boolean;
}

const headCells: ProductHeadCell[] = [
  { id: 'product_name', label: 'Product Name', numeric: false },
  { id: 'sku', label: 'SKU', numeric: false },
  { id: 'brands', label: 'Brand', numeric: false },
  { id: 'type_category', label: 'Type Category', numeric: false },
  { id: 'sub_category', label: 'Sub Category', numeric: false },
  { id: 'total_invoice', label: 'Total Invoice', numeric: true },
  { id: 'average_buy_price', label: 'Avg Buy Price', numeric: true },
  { id: 'order_count', label: 'Order Count', numeric: true },
  { id: 'total_quantity', label: 'Total Quantity', numeric: true },
  { id: 'active_stores', label: 'Active Stores', numeric: true },
  { id: 'profit', label: 'Profit', numeric: true },
];

interface StoreProductsTableProps {
  products: ProductSummaryData[];
  loading?: boolean;
  onRefresh?: () => void;
  title?: string;
}

const StoreProductsTable = ({ 
  products, 
  loading = false, 
  onRefresh,
  title = 'Product Performance'
}: StoreProductsTableProps) => {
  const [orderBy, setOrderBy] = useState<SortableProductField>('total_invoice');
  const [order, setOrder] = useState<ProductDirection>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [typeCategoryFilter, setTypeCategoryFilter] = useState<string>('');
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<ProductSummaryData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleRequestSort = (property: SortableProductField) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const searchFields = (product: ProductSummaryData, query: string): boolean => {
    if (!query) return true;

    const searchableFields = [
      product.product_name?.toLowerCase() || '',
      product.sku?.toLowerCase() || '',
      product.brands?.toLowerCase() || '',
      product.type_category?.toLowerCase() || '',
      product.sub_category?.toLowerCase() || '',
    ];

    return searchableFields.some((field) =>
      field.includes(query.toLowerCase())
    );
  };

  const filteredProducts = products.filter((product) => {
    // Apply filters
    if (brandFilter && product.brands !== brandFilter) return false;
    if (typeCategoryFilter && product.type_category !== typeCategoryFilter) return false;
    if (subCategoryFilter && product.sub_category !== subCategoryFilter) return false;

    // Search functionality
    if (searchQuery) {
      return searchFields(product, searchQuery);
    }

    return true;
  });

  // Reset page when local filters change
  useEffect(() => {
    setPage(0);
  }, [brandFilter, typeCategoryFilter, subCategoryFilter, searchQuery]);

  const uniqueBrands = Array.from(new Set(products.map((p) => p.brands)));
  const uniqueTypeCategories = Array.from(new Set(products.map((p) => p.type_category)));
  const uniqueSubCategories = Array.from(new Set(products.map((p) => p.sub_category)));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'FROZEN': return 'info';
      case 'MEAT': return 'error';
      case 'FRESH': return 'success';
      case 'DAIRY': return 'warning';
      default: return 'default';
    }
  };

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aValue: any = a[orderBy];
    let bValue: any = b[orderBy];

    // Handle numeric fields
    if (orderBy === 'total_invoice' || orderBy === 'average_buy_price' || 
        orderBy === 'order_count' || orderBy === 'total_quantity' || orderBy === 'active_stores' || orderBy === 'profit') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }

    // Handle string comparisons for other text fields
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

  const totalValue = filteredProducts.reduce((sum, product) => sum + Number(product.total_invoice) || 0, 0);
  const totalProfit = filteredProducts.reduce((sum, product) => sum + product.profit, 0);
  const margin = totalValue > 0 ? (totalProfit / totalValue) * 100 : 0;

  const prepareDataForExport = (products: ProductSummaryData[]) => {
    return products.map((p) => ({
      'Product Name': p.product_name,
      'SKU': p.sku,
      'Brand': p.brands,
      'Type Category': p.type_category,
      'Sub Category': p.sub_category,
      'Total Invoice': p.total_invoice,
      'Average Buy Price': p.average_buy_price,
      'Order Count': p.order_count,
      'Total Quantity': p.total_quantity,
      'Active Stores': p.active_stores,
      'Profit': p.profit,
    }));
  };

  const handleExcelExport = () => {
    if (!products.length) return;

    // Only run on client side
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof Blob === 'undefined') return;

    const data = prepareDataForExport(filteredProducts);
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    const colWidths = [
      { wch: 30 }, // Product Name
      { wch: 15 }, // SKU
      { wch: 20 }, // Brand
      { wch: 20 }, // Type Category
      { wch: 25 }, // Sub Category
      { wch: 15 }, // Total Invoice
      { wch: 15 }, // Average Buy Price
      { wch: 15 }, // Order Count
      { wch: 15 }, // Total Quantity
      { wch: 15 }, // Active Stores
      { wch: 15 }, // Profit
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Product Performance');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Download file
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-performance.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearAllFilters = () => {
    setBrandFilter('');
    setTypeCategoryFilter('');
    setSubCategoryFilter('');
    setSearchQuery('');
    setPage(0);
  };

  const handleRowClick = (product: ProductSummaryData) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
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
            {onRefresh && (
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={onRefresh}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Refresh
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExcelExport}
              disabled={filteredProducts.length === 0}
              sx={{ mr: 1 }}
            >
              Export Excel
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={clearAllFilters}
              disabled={!brandFilter && !typeCategoryFilter && !subCategoryFilter && !searchQuery}
            >
              Clear Filters
            </Button>
          </Box>
        </Box>

        {/* Summary Stats */}
        <Box mb={3} sx={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
          <Box sx={{ textAlign: 'center', minWidth: '150px' }}>
            <Typography variant="h3" color="primary" fontWeight="bold" mb={1}>
              {filteredProducts.length}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Products
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '150px' }}>
            <Typography variant="h3" color="success.main" fontWeight="bold" mb={1}>
              {formatCurrency(totalValue)}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Invoice
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '150px' }}>
            <Typography variant="h3" color="success.main" fontWeight="bold" mb={1}>
              {formatCurrency(totalProfit)}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Profit
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '150px' }}>
            <Typography variant="h3" color="info.main" fontWeight="bold" mb={1}>
              {margin.toFixed(2)}%
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Margin
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
                placeholder="Search products..."
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
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Brand</InputLabel>
                <Select
                  value={brandFilter}
                  label="Brand"
                  onChange={(e) => setBrandFilter(e.target.value)}
                >
                  <MenuItem value="">All Brands</MenuItem>
                  {uniqueBrands.map((brand) => (
                    <MenuItem key={brand} value={brand}>
                      {brand}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Type Category</InputLabel>
                <Select
                  value={typeCategoryFilter}
                  label="Type Category"
                  onChange={(e) => setTypeCategoryFilter(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {uniqueTypeCategories.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Sub Category</InputLabel>
                <Select
                  value={subCategoryFilter}
                  label="Sub Category"
                  onChange={(e) => setSubCategoryFilter(e.target.value)}
                >
                  <MenuItem value="">All Sub Categories</MenuItem>
                  {uniqueSubCategories.map((subCategory) => (
                    <MenuItem key={subCategory} value={subCategory}>
                      {subCategory}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

      {/* Products Table */}
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
            ) : sortedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headCells.length} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No products found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedProducts
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((product) => (
                  <TableRow 
                    key={product.product_id} 
                    hover 
                    onClick={() => handleRowClick(product)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {product.product_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {product.sku}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product.brands}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product.type_category}
                        size="small"
                        color={getCategoryColor(product.type_category) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product.sub_category}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(product.total_invoice)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(product.average_buy_price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {product.order_count}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {product.total_quantity}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {product.active_stores}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium" color="success.main">
                        {formatCurrency(product.profit)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredProducts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      </CardContent>

      {/* Product Detail Modal */}
      <ProductDetailModal
        open={modalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
      />
    </Card>
  );
};

export default StoreProductsTable;
