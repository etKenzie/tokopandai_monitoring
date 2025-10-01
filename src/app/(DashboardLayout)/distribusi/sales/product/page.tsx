'use client';

import { fetchProductSummary, ProductSummaryData } from '@/app/api/distribusi/DistribusiSlice';
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';
import PageContainer from '@/app/components/container/PageContainer';
import StoreProductsTable from '@/app/components/distribusi/StoreProductsTable';
import { useAuth } from '@/app/context/AuthContext';
import { useCheckRoles } from '@/app/hooks/useCheckRoles';
import { getAgentNameFromRole, getPageRoles, getRestrictedRoles } from '@/config/roles';
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

interface ProductFilters {
  month: string;
  year: string;
  area: string;
  segment: string;
  brand: string;
  typeCategory: string;
  subCategory: string;
}

const ProductPage = () => {
  const { user, roles } = useAuth();
  
  // Check access for allowed roles (configurable via roles config)
  const accessCheck = useCheckRoles(getPageRoles('DISTRIBUSI_DASHBOARD'));
  
  // Get restricted roles from config
  const restrictedRoles = getRestrictedRoles();
  
  // Check if current user has a restricted role
  const hasRestrictedRole = roles.some(role => restrictedRoles.includes(role));
  const userRoleForFiltering = roles.find(role => restrictedRoles.includes(role));
  
  // Log access check result for debugging
  console.log('Product Page Access Check:', accessCheck);
  console.log('User roles:', roles);
  console.log('Has restricted role:', hasRestrictedRole);
  console.log('User role for filtering:', userRoleForFiltering);
  
  const [products, setProducts] = useState<ProductSummaryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter options extracted from product data
  const [filterOptions, setFilterOptions] = useState<{
    brands: string[];
    typeCategories: string[];
    subCategories: string[];
  }>({
    brands: [],
    typeCategories: [],
    subCategories: []
  });
  
  // Initialize filters with empty values to avoid hydration mismatch
  const [filters, setFilters] = useState<ProductFilters>({
    month: '',
    year: '',
    area: '',
    segment: '',
    brand: '',
    typeCategory: '',
    subCategory: ''
  });

  // Set initial date values in useEffect to avoid hydration issues
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = currentDate.getFullYear().toString();
    
    setFilters((prev: ProductFilters) => ({
      ...prev,
      month: currentMonth,
      year: currentYear
    }));
  }, []);


  // Extract filter options from product data
  const extractFilterOptions = useCallback((productData: ProductSummaryData[]) => {
    const brands = Array.from(new Set(productData.map(p => p.brands).filter(Boolean))).sort();
    const typeCategories = Array.from(new Set(productData.map(p => p.type_category).filter(Boolean))).sort();
    const subCategories = Array.from(new Set(productData.map(p => p.sub_category).filter(Boolean))).sort();
    
    setFilterOptions({
      brands,
      typeCategories,
      subCategories
    });
  }, []);

  const fetchProductsCallback = useCallback(async (currentFilters: ProductFilters) => {
    console.log('Fetching products data with filters:', currentFilters);
    setLoading(true);
    try {
      // Only fetch data if we have month and year (required)
      if (currentFilters.month && currentFilters.year) {
        // Format month for API (e.g., "08" -> "August 2025")
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthName = monthNames[parseInt(currentFilters.month) - 1];
        const formattedMonth = `${monthName} ${currentFilters.year}`;
        
        // For users with restricted roles, use their mapped agent name instead of filter selection
        const agentName = hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : undefined;
        
        const response = await fetchProductSummary({
          month: formattedMonth,
          agent: agentName,
          area: currentFilters.area || undefined,
          segment: currentFilters.segment || undefined,
        });
        console.log('Products data response:', response);
        
        // Apply client-side filtering for brand, type category, and sub category
        let filteredProducts = response.data;
        
        if (currentFilters.brand) {
          filteredProducts = filteredProducts.filter(p => p.brands === currentFilters.brand);
        }
        if (currentFilters.typeCategory) {
          filteredProducts = filteredProducts.filter(p => p.type_category === currentFilters.typeCategory);
        }
        if (currentFilters.subCategory) {
          filteredProducts = filteredProducts.filter(p => p.sub_category === currentFilters.subCategory);
        }
        
        setProducts(filteredProducts);
        
        // Extract filter options from the original unfiltered data
        extractFilterOptions(response.data);
      } else {
        setProducts([]);
        setFilterOptions({ brands: [], typeCategories: [], subCategories: [] });
      }
    } catch (err) {
      console.error('Failed to fetch products data:', err);
      setProducts([]);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [hasRestrictedRole, userRoleForFiltering, extractFilterOptions]);

  const handleFiltersChange = useCallback((newFilters: ProductFilters) => {
    console.log('Filters changed:', newFilters);
    setFilters(newFilters);
    // Reset data to show loading state when filters change
    setProducts([]);
  }, []);

  useEffect(() => {
    // Only fetch data if month and year are set (after initialization)
    if (filters.month && filters.year) {
      fetchProductsCallback(filters);
    }
  }, [filters.month, filters.year, filters.area, filters.segment, filters.brand, filters.typeCategory, filters.subCategory, fetchProductsCallback]);

  return (
    <PageContainer title="Product Performance" description="Monitor product performance and sales metrics">
      <Box>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h3" fontWeight="bold" mb={1}>
            Product Performance
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Monitor product sales performance, inventory metrics, and store distribution
          </Typography>
          {hasRestrictedRole && (
            <Typography variant="body2" color="info.main" sx={{ mt: 1, fontStyle: 'italic' }}>
              Showing data for {getAgentNameFromRole(userRoleForFiltering!)} only
            </Typography>
          )}
        </Box>

        {/* Filters */}
        <Box mb={3}>
          <Grid container spacing={2}>
            {/* Month Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Month</InputLabel>
                <Select
                  value={filters.month}
                  label="Month"
                  onChange={(e) => handleFiltersChange({ ...filters, month: e.target.value })}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthNum = (i + 1).toString().padStart(2, '0');
                    const monthName = new Date(2024, i).toLocaleString('en-US', { month: 'long' });
                    return (
                      <MenuItem key={monthNum} value={monthNum}>
                        {monthName}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            {/* Year Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Year</InputLabel>
                <Select
                  value={filters.year}
                  label="Year"
                  onChange={(e) => handleFiltersChange({ ...filters, year: e.target.value })}
                >
                  {Array.from({ length: 6 }, (_, i) => {
                    const year = (new Date().getFullYear() - i).toString();
                    return (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>


            {/* Area Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Area</InputLabel>
                <Select
                  value={filters.area}
                  label="Area"
                  onChange={(e) => handleFiltersChange({ ...filters, area: e.target.value })}
                >
                  <MenuItem value="">All Areas</MenuItem>
                  <MenuItem value="JAKARTA">JAKARTA</MenuItem>
                  <MenuItem value="BANDUNG">BANDUNG</MenuItem>
                  <MenuItem value="SURABAYA">SURABAYA</MenuItem>
                  <MenuItem value="MEDAN">MEDAN</MenuItem>
                  <MenuItem value="SEMARANG">SEMARANG</MenuItem>
                  <MenuItem value="MAKASSAR">MAKASSAR</MenuItem>
                  <MenuItem value="PALEMBANG">PALEMBANG</MenuItem>
                  <MenuItem value="TANGERANG">TANGERANG</MenuItem>
                  <MenuItem value="DEPOK">DEPOK</MenuItem>
                  <MenuItem value="BEKASI">BEKASI</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Segment Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Segment</InputLabel>
                <Select
                  value={filters.segment}
                  label="Segment"
                  onChange={(e) => handleFiltersChange({ ...filters, segment: e.target.value })}
                >
                  <MenuItem value="">All Segments</MenuItem>
                  <MenuItem value="RESELLER">RESELLER</MenuItem>
                  <MenuItem value="HORECA">HORECA</MenuItem>
                  <MenuItem value="OTHER">OTHER</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Client-side Filters */}
        <Box mb={3}>
          <Typography variant="h6" mb={2} color="textSecondary">
            Product Filters
          </Typography>
          <Grid container spacing={2}>
            {/* Brand Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Brand</InputLabel>
                <Select
                  value={filters.brand}
                  label="Brand"
                  onChange={(e) => handleFiltersChange({ ...filters, brand: e.target.value })}
                >
                  <MenuItem value="">All Brands</MenuItem>
                  {filterOptions.brands.map((brand) => (
                    <MenuItem key={brand} value={brand}>
                      {brand}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Type Category Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Type Category</InputLabel>
                <Select
                  value={filters.typeCategory}
                  label="Type Category"
                  onChange={(e) => handleFiltersChange({ ...filters, typeCategory: e.target.value })}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {filterOptions.typeCategories.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Sub Category Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Sub Category</InputLabel>
                <Select
                  value={filters.subCategory}
                  label="Sub Category"
                  onChange={(e) => handleFiltersChange({ ...filters, subCategory: e.target.value })}
                >
                  <MenuItem value="">All Sub Categories</MenuItem>
                  {filterOptions.subCategories.map((subCategory) => (
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
        <Box>
          {error ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <Typography variant="body1" color="error">
                {error}
              </Typography>
            </Box>
          ) : (
            <StoreProductsTable products={products} loading={loading} />
          )}
        </Box>
      </Box>
    </PageContainer>
  );
};

export default function ProtectedProductPage() {
  return (
    <ProtectedRoute requiredRoles={getPageRoles('DISTRIBUSI_DASHBOARD')}>
      <ProductPage />
    </ProtectedRoute>
  );
}
