import type { NextConfig } from "next";

const isCI = process.env.GITHUB_ACTIONS === "true";
const repoName = "OceanGuard";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  // Static export for GitHub Pages
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // Use basePath/assetPrefix on GitHub Pages (project pages)
  basePath: isCI ? `/${repoName}` : undefined,
  assetPrefix: isCI ? `/${repoName}/` : undefined,
};

export default nextConfig;



