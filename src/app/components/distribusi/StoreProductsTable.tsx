'use client';

import {
    Box,
    Chip,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TableSortLabel,
    Typography
} from '@mui/material';
import { useState } from 'react';
import { StoreProduct } from '../../api/distribusi/StoreSlice';

type ProductDirection = 'asc' | 'desc';
type SortableProductField = keyof StoreProduct;

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
];

interface StoreProductsTableProps {
  products: StoreProduct[];
  loading?: boolean;
}

const StoreProductsTable = ({ products, loading = false }: StoreProductsTableProps) => {
  const [orderBy, setOrderBy] = useState<SortableProductField>('total_invoice');
  const [order, setOrder] = useState<ProductDirection>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  const sortedProducts = [...products].sort((a, b) => {
    let aValue: any = a[orderBy];
    let bValue: any = b[orderBy];

    // Handle numeric fields
    if (orderBy === 'total_invoice' || orderBy === 'average_buy_price' || 
        orderBy === 'order_count' || orderBy === 'total_quantity') {
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

  const totalValue = products.reduce((sum, product) => sum + product.total_invoice, 0);
  const totalQuantity = products.reduce((sum, product) => sum + product.total_quantity, 0);
  const totalOrders = products.reduce((sum, product) => sum + product.order_count, 0);

  return (
    <Box>
      {/* Summary Stats */}
      <Box mb={3} sx={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
        <Box sx={{ textAlign: 'center', minWidth: '150px' }}>
          <Typography variant="h4" color="primary" fontWeight="bold" mb={1}>
            {products.length}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total Products
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: '150px' }}>
          <Typography variant="h4" color="success.main" fontWeight="bold" mb={1}>
            {formatCurrency(totalValue)}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total Value
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: '150px' }}>
          <Typography variant="h4" color="info.main" fontWeight="bold" mb={1}>
            {totalQuantity}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total Quantity
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: '150px' }}>
          <Typography variant="h4" color="warning.main" fontWeight="bold" mb={1}>
            {totalOrders}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total Orders
          </Typography>
        </Box>
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
                  <TableRow key={product.product_id} hover>
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
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={products.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default StoreProductsTable;
