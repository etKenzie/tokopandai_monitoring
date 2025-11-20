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
  FormControlLabel,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
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
type SortableProductField = keyof ProductSummaryData | 'average_sale_price';

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
  { id: 'average_sale_price', label: 'Avg Sale Price', numeric: true },
  { id: 'order_count', label: 'Order Count', numeric: true },
  { id: 'total_quantity', label: 'Total Quantity', numeric: true },
  { id: 'active_stores', label: 'Active Stores', numeric: true },
  { id: 'profit', label: 'Profit', numeric: true },
];

// Variant columns for price view
const variantTypes = ['PACK', 'CARTON', 'GRAM'];

interface VariantHeadCell {
  variant: string;
  type: 'buy_price' | 'sale_price' | 'invoice' | 'quantity';
  label: string;
  numeric: boolean;
}

const getVariantHeadCells = (): VariantHeadCell[] => {
  const cells: VariantHeadCell[] = [];
  variantTypes.forEach(variant => {
    cells.push(
      { variant, type: 'buy_price', label: `${variant} Buy Price`, numeric: true },
      { variant, type: 'sale_price', label: `${variant} Sale Price`, numeric: true },
      { variant, type: 'invoice', label: `${variant} Invoice`, numeric: true },
      { variant, type: 'quantity', label: `${variant} Quantity`, numeric: true }
    );
  });
  return cells;
};

const variantHeadCells = getVariantHeadCells();

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
  const [showPriceView, setShowPriceView] = useState(false);

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

  // Helper function to calculate product totals from variants
  const calculateProductTotals = (product: ProductSummaryData) => {
    // Use product-level values if available (new API format)
    if (product.order_count !== undefined || product.profit !== undefined || product.active_stores !== undefined) {
      const totalInvoice = product.total_invoice !== undefined 
        ? product.total_invoice 
        : (product.variants?.reduce((sum, v) => sum + (v.total_invoice || 0), 0) || 0);
      const totalQuantity = product.total_quantity !== undefined
        ? product.total_quantity
        : (product.variants?.reduce((sum, v) => sum + (v.total_quantity || 0), 0) || 0);
      
      // Calculate weighted average buy price from variants if needed
      let averageBuyPrice = product.average_buy_price || 0;
      if (!averageBuyPrice && product.variants && product.variants.length > 0) {
        const weightedBuyPrice = product.variants.reduce((sum, v) => {
          const quantity = v.total_quantity || 0;
          const buyPrice = v.average_buy_price || 0;
          return sum + (quantity * buyPrice);
        }, 0);
        averageBuyPrice = totalQuantity > 0 ? weightedBuyPrice / totalQuantity : 0;
      }
      
      // Average sale price is total_invoice / total_quantity
      const averageSalePrice = totalQuantity > 0 ? totalInvoice / totalQuantity : 0;
      
      return {
        total_invoice: totalInvoice,
        total_quantity: totalQuantity,
        average_buy_price: averageBuyPrice,
        average_sale_price: averageSalePrice,
        order_count: product.order_count || 0,
        active_stores: product.active_stores || 0,
        profit: product.profit || 0,
      };
    }
    
    // Otherwise, calculate from variants (old API format)
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      const totalInvoice = product.variants.reduce((sum, v) => sum + (v.total_invoice || 0), 0);
      const totalQuantity = product.variants.reduce((sum, v) => sum + (v.total_quantity || 0), 0);
      const totalProfit = product.variants.reduce((sum, v) => sum + (v.profit || 0), 0);
      
      // Calculate weighted average buy price
      const weightedBuyPrice = product.variants.reduce((sum, v) => {
        const quantity = v.total_quantity || 0;
        const buyPrice = v.average_buy_price || 0;
        return sum + (quantity * buyPrice);
      }, 0);
      const averageBuyPrice = totalQuantity > 0 ? weightedBuyPrice / totalQuantity : 0;
      
      // Average sale price is total_invoice / total_quantity
      const averageSalePrice = totalQuantity > 0 ? totalInvoice / totalQuantity : 0;
      
      return {
        total_invoice: totalInvoice,
        total_quantity: totalQuantity,
        average_buy_price: averageBuyPrice,
        average_sale_price: averageSalePrice,
        order_count: product.order_count || 0,
        active_stores: product.active_stores || 0,
        profit: totalProfit || product.profit || 0,
      };
    }
    
    // Fallback to 0 if no data
    return {
      total_invoice: 0,
      total_quantity: 0,
      average_buy_price: 0,
      average_sale_price: 0,
      order_count: 0,
      active_stores: 0,
      profit: 0,
    };
  };

  const calculateAverageSalePrice = (product: ProductSummaryData): number => {
    const totals = calculateProductTotals(product);
    return totals.average_sale_price;
  };

  // Helper function to get variant data
  const getVariantData = (product: ProductSummaryData, variantName: string) => {
    if (!product.variants || !Array.isArray(product.variants)) {
      return null;
    }
    return product.variants.find(v => v.variant_name === variantName) || null;
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
    // Get calculated totals for sorting
    const aTotals = calculateProductTotals(a);
    const bTotals = calculateProductTotals(b);
    
    let aValue: any;
    let bValue: any;

    // Handle calculated fields
    if (orderBy === 'average_sale_price') {
      aValue = aTotals.average_sale_price;
      bValue = bTotals.average_sale_price;
    } else if (orderBy === 'total_invoice') {
      aValue = aTotals.total_invoice;
      bValue = bTotals.total_invoice;
    } else if (orderBy === 'average_buy_price') {
      aValue = aTotals.average_buy_price;
      bValue = bTotals.average_buy_price;
    } else if (orderBy === 'total_quantity') {
      aValue = aTotals.total_quantity;
      bValue = bTotals.total_quantity;
    } else {
      // For other fields, use direct value or from totals
      aValue = a[orderBy] !== undefined ? a[orderBy] : (aTotals as any)[orderBy];
      bValue = b[orderBy] !== undefined ? b[orderBy] : (bTotals as any)[orderBy];
    }

    // Handle numeric fields
    if (orderBy === 'total_invoice' || orderBy === 'average_buy_price' || orderBy === 'average_sale_price' ||
        orderBy === 'order_count' || orderBy === 'total_quantity' || orderBy === 'active_stores' || orderBy === 'profit') {
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;
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

  const totalValue = filteredProducts.reduce((sum, product) => {
    const totals = calculateProductTotals(product);
    return sum + totals.total_invoice;
  }, 0);
  const totalProfit = filteredProducts.reduce((sum, product) => {
    const totals = calculateProductTotals(product);
    return sum + totals.profit;
  }, 0);
  const margin = totalValue > 0 ? (totalProfit / totalValue) * 100 : 0;

  const prepareDataForExport = (products: ProductSummaryData[]) => {
    if (showPriceView) {
      // Export with variant columns
      return products.map((p) => {
        const baseData: any = {
          'Product Name': p.product_name,
          'SKU': p.sku,
          'Brand': p.brands,
          'Type Category': p.type_category,
          'Sub Category': p.sub_category,
        };
        
        // Add variant data
        variantTypes.forEach(variantName => {
          const variant = getVariantData(p, variantName);
          baseData[`${variantName} Buy Price`] = variant ? variant.average_buy_price : '';
          baseData[`${variantName} Sale Price`] = variant ? variant.average_sale_price : '';
          baseData[`${variantName} Invoice`] = variant ? variant.total_invoice : '';
          baseData[`${variantName} Quantity`] = variant ? variant.total_quantity : '';
        });
        
        return baseData;
      });
    } else {
      // Standard export
      return products.map((p) => ({
        'Product Name': p.product_name,
        'SKU': p.sku,
        'Brand': p.brands,
        'Type Category': p.type_category,
        'Sub Category': p.sub_category,
        'Total Invoice': p.total_invoice || 0,
        'Average Buy Price': p.average_buy_price || 0,
        'Average Sale Price': calculateAverageSalePrice(p),
        'Order Count': p.order_count || 0,
        'Total Quantity': p.total_quantity || 0,
        'Active Stores': p.active_stores || 0,
        'Profit': p.profit || 0,
      }));
    }
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
    if (showPriceView) {
      const colWidths = [
        { wch: 30 }, // Product Name
        { wch: 15 }, // SKU
        { wch: 20 }, // Brand
        { wch: 20 }, // Type Category
        { wch: 25 }, // Sub Category
        ...variantHeadCells.map(() => ({ wch: 15 })) // Variant columns
      ];
      ws['!cols'] = colWidths;
    } else {
      const colWidths = [
        { wch: 30 }, // Product Name
        { wch: 15 }, // SKU
        { wch: 20 }, // Brand
        { wch: 20 }, // Type Category
        { wch: 25 }, // Sub Category
        { wch: 15 }, // Total Invoice
        { wch: 15 }, // Average Buy Price
        { wch: 15 }, // Average Sale Price
        { wch: 15 }, // Order Count
        { wch: 15 }, // Total Quantity
        { wch: 15 }, // Active Stores
        { wch: 15 }, // Profit
      ];
      ws['!cols'] = colWidths;
    }

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
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={showPriceView}
                onChange={(e) => setShowPriceView(e.target.checked)}
                color="primary"
              />
            }
            label="Price View (Show Variants)"
          />
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
              {/* Base columns (always shown) */}
              {headCells.slice(0, 5).map((headCell) => (
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
              {/* Conditional columns based on toggle */}
              {!showPriceView ? (
                // Standard columns
                headCells.slice(5).map((headCell) => (
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
                ))
              ) : (
                // Variant columns
                variantHeadCells.map((headCell, index) => (
                  <TableCell
                    key={`${headCell.variant}-${headCell.type}-${index}`}
                    align="right"
                  >
                    {headCell.label}
                  </TableCell>
                ))
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={showPriceView ? 5 + variantHeadCells.length : headCells.length} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : sortedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showPriceView ? 5 + variantHeadCells.length : headCells.length} align="center">
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
                    {!showPriceView ? (
                      // Standard columns - calculate from variants if needed
                      (() => {
                        const totals = calculateProductTotals(product);
                        return (
                          <>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="medium">
                                {formatCurrency(totals.total_invoice)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {formatCurrency(totals.average_buy_price)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {formatCurrency(totals.average_sale_price)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {totals.order_count}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="medium">
                                {totals.total_quantity}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {totals.active_stores}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="medium" color="success.main">
                                {formatCurrency(totals.profit)}
                              </Typography>
                            </TableCell>
                          </>
                        );
                      })()
                    ) : (
                      // Variant columns
                      variantHeadCells.map((headCell, index) => {
                        const variant = getVariantData(product, headCell.variant);
                        return (
                          <TableCell key={`${headCell.variant}-${headCell.type}-${index}`} align="right">
                            {variant ? (
                              <Typography variant="body2">
                                {headCell.type === 'buy_price' && formatCurrency(variant.average_buy_price)}
                                {headCell.type === 'sale_price' && formatCurrency(variant.average_sale_price)}
                                {headCell.type === 'invoice' && formatCurrency(variant.total_invoice)}
                                {headCell.type === 'quantity' && variant.total_quantity}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="textSecondary">
                                -
                              </Typography>
                            )}
                          </TableCell>
                        );
                      })
                    )}
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
