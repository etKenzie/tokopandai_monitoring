const nextConfig = { 
  reactStrictMode: false, 
  images: { unoptimized: true },
  // Dynamic base path configuration
  basePath: process.env.NODE_ENV === 'production' ? '/executive_dashboard' : '',
  // Asset prefix for production
  assetPrefix: process.env.NODE_ENV === 'production' ? '/executive_dashboard' : '',
  // Trailing slash for consistency
  trailingSlash: false,
};

export default nextConfig;
