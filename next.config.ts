import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  compiler: { styledComponents: true }
};
export default nextConfig;
