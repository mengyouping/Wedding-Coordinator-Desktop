import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = [
  'projects', 'dashboard', 'operations', 'warroom', 'budget', 'finance', 'tasks', 'guests', 'seating',
  'vendors', 'timeline', 'invitations', 'attachments', 'risks', 'materials', 'conflicts', 'settings'
] as const;

for (const route of routes) {
  test(`${route} 页面无严重无障碍问题`, async ({ page }) => {
    await page.goto(`/#/${route}`);
    await expect(page.locator('main.main-content')).toBeVisible();
    const results = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .analyze();
    const serious = results.violations.filter(item => item.impact === 'serious' || item.impact === 'critical');
    expect(serious, serious.map(item => `${item.id}: ${item.help}`).join('\n')).toEqual([]);
  });
}

test('公开请帖无严重无障碍问题', async ({ page }) => {
  await page.goto('/invite.html?token=demo-invitation-002');
  await expect(page.locator('.invite-page')).toBeVisible();
  const results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
  expect(results.violations.filter(item => item.impact === 'serious' || item.impact === 'critical')).toEqual([]);
});
