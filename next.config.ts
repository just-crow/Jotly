import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These packages rely on Node.js-native DOM/canvas APIs and must not be
  // bundled by Next.js — they need to run as plain Node modules on the server.
  serverExternalPackages: ["pdf-parse", "isomorphic-dompurify", "jsdom"],
};

export default nextConfig;
