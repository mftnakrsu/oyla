import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// src/paths.ts and the bundled dist/index.js both sit one level below the package root.
export const packageRoot = fileURLToPath(new URL('..', import.meta.url));
export const migrationsFolder = join(packageRoot, 'drizzle');
export const defaultWebDist = join(packageRoot, '..', 'web', 'dist');
