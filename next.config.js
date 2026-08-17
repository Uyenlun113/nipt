/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    serverComponentsExternalPackages: ['pdf-parse', 'pypdf', 'pdf-lib', '@pdf-lib/fontkit'],
    optimizePackageImports: ['lucide-react'],
  },
  webpack: (config, { dev }) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    // Fix Windows Webpack chunk cache corruption
    if (dev) {
      config.cache = {
        type: 'memory',
      };
    }

    return config;
  },
};

module.exports = nextConfig;
