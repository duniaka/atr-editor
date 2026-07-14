/** @type {import('next').NextConfig} */

// When deploying to GitHub Pages (a project site served from /<repo>), the
// workflow sets PAGES_BASE_PATH=/atr-editor so assets resolve under that path.
// Left empty for local dev/build, so the app still works at the root.
const basePath = process.env.PAGES_BASE_PATH || ''

const nextConfig = {
  // Emit a fully static site into ./out for GitHub Pages.
  output: 'export',
  basePath,
  // Expose the base path to client code (e.g. for building asset URLs).
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  // Static hosts serve /path/ as /path/index.html.
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
