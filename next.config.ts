import type { NextConfig } from "next";

import { withPlatformConfig } from "@jl0810/next-config";

const nextConfig: NextConfig = withPlatformConfig({
  output: "standalone",
});

export default nextConfig;
