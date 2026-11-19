/**
 * P9-DEF-OCR-01 / P9-DEF-PDF-01 — serverless file-tracing hints (no runtime behavior).
 *
 * tesseract.js spawns its worker with `new Worker(path.join(__dirname, ...))` and reads eng.traineddata.gz via
 * fs at runtime. Neither is discoverable by Vercel's static file tracer, so the assets were missing from the
 * deployed Express function. Literal `require.resolve()` calls below are recognised by the tracer and force
 * the worker script (plus its static tesseract-core / wasm-feature-detect requires) and the offline
 * traineddata into the bundle. The function is never invoked.
 */
/**
 * P9-DEF-OCR-01 — live serverless file-tracing registration for Express on Vercel.
 *
 * Previously __ubOqOcrAssetTracingHints() was exported but never invoked, allowing bundlers / dead-code
 * elimination to drop its require.resolve() calls so eng.traineddata.gz and tesseract-core WASM files were
 * omitted from the Express Lambda bundle. Calling registerOcrAssetTracingHints() at route registration time
 * keeps every literal require.resolve() reachable for @vercel/nft without altering runtime request behavior.
 */
export function registerOcrAssetTracingHints(): number {
  const specs: Array<() => string> = [
    () => require.resolve('tesseract.js/src/worker-script/node/index.js'),
    () => require.resolve('tesseract.js/src/worker-script/node/getCore.js'),
    () => require.resolve('tesseract.js-core/tesseract-core-relaxedsimd-lstm'),
    () => require.resolve('tesseract.js-core/tesseract-core-relaxedsimd'),
    () => require.resolve('tesseract.js-core/tesseract-core-simd-lstm'),
    () => require.resolve('tesseract.js-core/tesseract-core-simd'),
    () => require.resolve('tesseract.js-core/tesseract-core-lstm'),
    () => require.resolve('tesseract.js-core/tesseract-core'),
    () => require.resolve('@tesseract.js-data/eng'),
    () => require.resolve('@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz'),
    () => require.resolve('@tesseract.js-data/eng/4.0.0/eng.traineddata.gz'),
  ];
  let resolvedCount = 0;
  for (const fn of specs) {
    try {
      if (fn()) resolvedCount += 1;
    } catch {
      /* individual optional core variants may vary by platform */
    }
  }
  return resolvedCount;
}
