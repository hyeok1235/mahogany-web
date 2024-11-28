/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    GOOGLE_SHEETS_CLIENT_EMAIL: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_CLIENT_EMAIL,
    GOOGLE_SHEETS_PRIVATE_KEY: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_PRIVATE_KEY,
    GOOGLE_SHEETS_ID: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID,
  },
};

module.exports = nextConfig;
