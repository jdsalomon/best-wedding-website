/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    SHOW_PROGRAM: process.env.SHOW_PROGRAM || 'false',
  },
}

module.exports = nextConfig