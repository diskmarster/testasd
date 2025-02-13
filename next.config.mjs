/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nemlager-55t13hajf5.s3.eu-central-1.amazonaws.com',
        port: '',
        pathname: '/*/**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@node-rs/argon2'],
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
}

export default nextConfig
