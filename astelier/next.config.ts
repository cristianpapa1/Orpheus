import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // M0: compile the shared pure-TS core from the workspace package.
  transpilePackages: ["@atelier/core"],
};

export default nextConfig;
