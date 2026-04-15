const { test, expect } = require('@playwright/test');
const { Pool } = require('pg');

function getDbConfig() {
  return {
    host: process.env.PGHOST || process.env.DB_SERVER || 'localhost',
    port: Number(process.env.PGPORT || process.env.DB_PORT || 5432),
    database: process.env.PGDATABASE || process.env.DB_NAME || 'hr_placement',
    user: process.env.PGUSER || process.env.DB_USER,
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
    ssl: process.env.DB_ENCRYPT === 'true'
      ? { rejectUnauthorized: process.env.DB_TRUST_SERVER_CERT === 'false' }
      : false
  };
}

async function resetRequesterApplications(requesterId) {
  const pool = new Pool(getDbConfig());
  try {
    await pool.query(
      `DELETE FROM ApplicationPreferredLocations
       WHERE applicationId IN (SELECT id FROM Applications WHERE requesterId = $1)`,
      [requesterId]
    );
    await pool.query('DELETE FROM Applications WHERE requesterId = $1', [requesterId]);
  } finally {
    await pool.end();
  }
}

async function submitRequest(page, requesterId = 'u10001') {
  await page.goto(`/request?asUser=${requesterId}&asRole=requester`);

  await page.selectOption('#curPositionType', 'Teacher');
  await page.selectOption('#reasonForRequest', 'Growth Opportunity');
  await page.fill('#yearsOfTeaching', '7');
  await page.fill('#yearsOfAdmin', '0');
  await page.fill('#yearsOfCertificated', '7');
  await page.fill('#yearsTotalGCPS', '5');
  await page.fill('#yearsTotalExpNonGCPS', '2');
  await page.check('#verifyPDP');
  await page.check('#verifyCertificate');

  await page.locator('input[name="preferredLocations"]').nth(0).check();
  await page.locator('input[name="preferredLocations"]').nth(1).check();

  await page.selectOption('#prefTeachingAssignment1', { index: 1 });
  await page.fill('#additionalInfo1', 'Strong fit for school culture and curriculum.');

  await page.fill('#certificationID', 'CERT-12345');
  await page.selectOption('#certificateLevel', { index: 1 });
  await page.fill('#fieldCertification', 'Mathematics 6-12');

  await page.getByRole('button', { name: 'Save / Submit' }).click();
}

test.describe('requester and admin e2e flow', () => {
  test.beforeEach(async () => {
    await resetRequesterApplications('u10001');
  });

  test('requester dashboard matches expected visual snapshot after submit', async ({ page }) => {
    await submitRequest(page);

    await expect(page).toHaveURL(/\/my\/applications/);
    await expect(page.locator('body')).toHaveScreenshot('requester-dashboard-after-submit.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('admin details view matches expected visual snapshot after status update', async ({ page }) => {
    await submitRequest(page);

    await page.goto('/admin/applications?asUser=u10002&asRole=admin');
    await page.getByRole('link', { name: 'View details' }).first().click();
    await expect(page).toHaveURL(/\/admin\/applications\/\d+/);

    const statusSelect = page.locator('form[action*="/admin/applications/"] select[name="status"]').first();
    await statusSelect.selectOption('Interview Requested');
    await page.locator('form[action*="/admin/applications/"] button', { hasText: 'Update' }).first().click();

    await expect(page.locator('main.container')).toHaveScreenshot('admin-details-after-status-update.png', {
      animations: 'disabled'
    });
  });
});
