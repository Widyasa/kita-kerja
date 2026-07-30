import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },
  // ffmpeg-static resolves its binary path via path.join(__dirname, ...);
  // Next's server bundler rewrites that to a "\ROOT\..." placeholder that
  // never resolves at runtime unless the package is left external.
  serverExternalPackages: ["ffmpeg-static"],
};

export default nextConfig;
