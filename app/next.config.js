/** @type {import('next').NextConfig} */

// Configure the base path via NEXT_PUBLIC_BASE_PATH env var.
// Default: '/hub'  |  Set to '' for subdomain/root deployment.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/hub'

const nextConfig = {
  // Do NOT use output: 'export' - we need API routes
  // Netlify handles Next.js server-side rendering natively
  reactStrictMode: true,

  basePath: BASE_PATH,

  // Expose to client code so fetch() calls can prefix API routes correctly
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
}

module.exports = nextConfig
