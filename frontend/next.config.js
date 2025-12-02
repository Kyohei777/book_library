/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'books.google.com',
            },
            {
                protocol: 'https',
                hostname: 'books.google.co.jp',
            },
            {
                protocol: 'https',
                hostname: '*.amazon.com',
            },
            {
                protocol: 'https',
                hostname: '*.amazon.co.jp',
            },
            {
                protocol: 'https',
                hostname: '*.ssl-images-amazon.com',
            },
            {
                protocol: 'https',
                hostname: 'cover.openbd.jp',
            },
            {
                protocol: 'https',
                hostname: '*.hanmoto.com',
            },
            {
                protocol: 'https',
                hostname: '*.media-amazon.com',
            },
        ],
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.BACKEND_URL || 'http://127.0.0.1:8001'}/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
