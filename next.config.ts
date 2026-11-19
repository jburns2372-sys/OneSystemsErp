import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  typescript: {
    // TODO: Remove this after fixing all migration-generated TypeScript errors
    // ignoreBuildErrors: true,
  },
  // Nested Git worktrees must not inherit the parent checkout's lockfile root.
  turbopack: { root: __dirname },
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', 'tesseract.js', 'sharp'],
  // P9-DEF-PDF-01 / P9-DEF-OCR-01: tesseract.js worker script, wasm cores and offline traineddata are loaded at
  // runtime (new Worker / fs), so Vercel's static tracer omits them. Include them for UBOQ intake routes only.
  outputFileTracingIncludes: {
    '/api/uboq/intake': [
      './node_modules/tesseract.js/src/**/*',
      './node_modules/tesseract.js-core/**/*',
      './node_modules/@tesseract.js-data/eng/4.0.0_best_int/*',
      './node_modules/wasm-feature-detect/**/*',
    ],
    '/api/projects/[id]/documents': [
      './node_modules/tesseract.js/src/**/*',
      './node_modules/tesseract.js-core/**/*',
      './node_modules/@tesseract.js-data/eng/4.0.0_best_int/*',
      './node_modules/wasm-feature-detect/**/*',
    ],
  },
  // Allow Playwright to connect from 127.0.0.1
  ...({ allowedDevOrigins: ['127.0.0.1'] } as any),
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async redirects() {
    return [
      {
        source: '/projects/:projectId/accomplishments',
        destination: '/progress/:projectId/accomplishments',
        permanent: true,
      },
    ];
  },
};

export default withSerwist(nextConfig);
