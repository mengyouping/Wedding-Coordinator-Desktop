import { expect, test } from '@playwright/test';

const themes = [
  ['香槟鎏金', 'champagne'],
  ['月光银白', 'moonlight'],
  ['玫瑰花园', 'rose'],
  ['极夜星河', 'midnight'],
  ['盛世囍宴', 'festival'],
  ['甜心萌礼', 'kawaii']
] as const;

for (const [label, id] of themes) {
  test(`${label}指挥中心视觉基线`, async ({ page }) => {
    await page.goto('/#/dashboard');
    await page.getByRole('button', { name: /切换主题/ }).click();
    await page.getByRole('button', { name: new RegExp(label) }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', id);
    await expect(page).toHaveScreenshot(`dashboard-${id}.png`, { fullPage: true });
  });
}

test('移动端婚礼日作战中心视觉基线', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto('/#/warroom');
  await expect(page).toHaveScreenshot('warroom-mobile.png', { fullPage: true });
});

test('公开请帖移动端视觉基线', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto('/invite.html?token=demo-invitation-002');
  await expect(page).toHaveScreenshot('invitation-mobile.png', { fullPage: true });
});
