/**
 * Setup vitest untuk component test — pasangan `setup.ts` yang milik
 * `bun test`. Didaftarkan lewat `vitest.config.ts`, BUKAN preload
 * `bunfig.toml`: file ini meng-import API vitest yang tidak ada di bun.
 *
 * 1. Matcher jest-dom (`toBeInTheDocument()` dll.) ke `expect` vitest.
 * 2. `cleanup()` setiap tes — @testing-library/svelte tidak bisa
 *    mendaftarkan auto-cleanup sendiri karena globals tidak diaktifkan.
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/svelte';
import { afterEach } from 'vitest';

afterEach(cleanup);
