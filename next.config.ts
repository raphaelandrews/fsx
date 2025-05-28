import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true,
    ppr: true,
    reactCompiler: true,
    useCache: true,
  },
  images: {
    domains:  ["files.edgestore.dev", "ftyhjvvztztlmpdvgwqf.supabase.co", "lh3.googleusercontent.com"],
  },
};

export default nextConfig;
