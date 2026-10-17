import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node24',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // The shared package is TypeScript source, so it is bundled; real dependencies stay external.
  noExternal: ['@oyla/shared'],
});
