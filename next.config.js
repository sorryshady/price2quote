
import { createJiti } from "jiti";
import { fileURLToPath } from "node:url";
const jiti = createJiti(fileURLToPath(import.meta.url));
 
// Import env here to validate during build. Using jiti@^1 we can import .ts files :)
jiti.import('./src/env/server')
/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false,
}

export default nextConfig
