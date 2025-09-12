const nextConfig = { 
  reactStrictMode: false, 
  images: { unoptimized: true },
  // No base path needed for root deployment
  basePath: '',
  // No asset prefix needed for root deployment
  assetPrefix: '',
  // Trailing slash for consistency
  trailingSlash: false,
};

export default nextConfig;
