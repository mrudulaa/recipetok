import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "3001-i0bd0ft6umr1zz55a9ds7-6768b3d1.us2.manus.computer",
    "*.manus.computer",
    "*.manus.space",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.tiktokcdn.com" },
      { protocol: "https", hostname: "**.tiktokcdn-us.com" },
      { protocol: "https", hostname: "p16-common-sign.tiktokcdn-us.com" },
    ],
  },
};

export default nextConfig;
