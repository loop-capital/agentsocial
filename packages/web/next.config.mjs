/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@agentsocial/shared"],
};

// Use port 3005 (avoiding Adobe on 3000/3001 and API on 3002)
process.env.PORT = process.env.PORT || "3003";

export default nextConfig;