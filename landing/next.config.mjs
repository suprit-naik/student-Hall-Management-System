/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',          // static HTML, served by the SHMC Express server
  trailingSlash: true,
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
}
export default nextConfig
