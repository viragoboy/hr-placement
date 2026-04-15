require('dotenv').config();
const { defineConfig } = require('@playwright/test');

const port = Number(process.env.PORT || 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npm start',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
