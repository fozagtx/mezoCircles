/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Telegram WebApp loads us inside an iframe.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://telegram.org https://*.telegram.org;",
          },
        ],
      },
    ];
  },
};
export default nextConfig;
