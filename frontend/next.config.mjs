/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use default Vercel Next.js hosting (not `output: 'export'`).
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000',
  },
};

export default nextConfig;
