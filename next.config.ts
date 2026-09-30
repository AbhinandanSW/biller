import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDF routes read these fonts from disk; make sure they ship with them.
  outputFileTracingIncludes: {
    "/orders/[id]/pdf": ["./assets/fonts/**"],
    "/share/[token]": ["./assets/fonts/**"],
  },
};

export default nextConfig;
