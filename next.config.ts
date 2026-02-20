import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse uses @napi-rs/canvas + DOMMatrix which can't be bundled by Next.js
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
