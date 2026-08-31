import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Existe um package-lock.json no diretório pai; sem isto o Next infere a raiz errada.
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
