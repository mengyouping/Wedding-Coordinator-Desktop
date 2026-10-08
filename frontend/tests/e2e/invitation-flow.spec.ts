import { expect, test } from '@playwright/test';

test.describe('公开电子请帖', () => {
  test('宾客可以打开请帖并提交赴约回执', async ({ page }) => {
    await page.goto('/invite.html?token=demo-invitation-002');
    await expect(page.getByRole('heading', { name: /示例新郎/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: '是否赴约' })).toBeVisible();
    await page.getByRole('button', { name: '欣然赴约' }).click();
    await page.getByLabel('携同人数').fill('1');
    await page.getByLabel('忌口与饮食偏好').fill('少辣');
    await page.getByLabel('给新人的话').fill('祝新婚快乐');
    await page.getByRole('button', { name: '确认回执' }).click();
    await expect(page.getByRole('heading', { name: '回执已经收到' })).toBeVisible();
  });

  test('已提交宾客可以重新修改回执', async ({ page }) => {
    await page.goto('/invite.html?token=demo-invitation-001');
    await expect(page.getByRole('heading', { name: '回执已经收到' })).toBeVisible();
    await page.getByRole('button', { name: '修改我的回执' }).click();
    await expect(page.getByRole('heading', { name: '是否赴约' })).toBeVisible();
  });

  test('无效Token显示安全错误页', async ({ page }) => {
    await page.goto('/invite.html?token=invalid-token');
    await expect(page.getByText('无法打开请帖')).toBeVisible();
    await expect(page.getByText(/不存在|失效/)).toBeVisible();
  });
});
