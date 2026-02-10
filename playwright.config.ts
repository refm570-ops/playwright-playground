import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './playwrightPlayground/e2e',
  timeout: 300000,
  retries: 0,
  fullyParallel: false,
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
    trace: 'on-first-retry',
  },
});
