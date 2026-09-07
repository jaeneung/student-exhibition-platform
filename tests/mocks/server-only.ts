// Vitest stand-in for the "server-only" package (see vitest.config.ts alias).
// The real package unconditionally throws outside a bundler that special-cases
// it (Next.js aliases it to a no-op in server bundles); under plain Node/Vitest
// that throw would fire on every import, so tests alias it to this no-op instead.
export {};
