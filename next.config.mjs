/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  /**
   * pdf-parse pulls in pdfjs-dist; bundling it with webpack breaks the RSC /
   * route bundle (Object.defineProperty called on non-object). Load from node_modules.
   */
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "pdfjs-dist"],
  },
};

export default nextConfig;
