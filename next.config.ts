import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['192.168.0.11'],
  trailingSlash: true,
};

/*
module.exports = {
  output: 'export',
  trailingSlash: true,
};*/

export default nextConfig;
