import { expect, test } from '@playwright/test';

test.describe('Wedding OS 管理端主流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/dashboard');
    await expect(page.getByRole('heading', { name: /指挥中心/ })).toBeVisible();
  });

  test('创建、切换并归档婚礼项目', async ({ page }) => {
    await page.getByRole('button', { name: /项目中心/ }).click();
    await expect(page.getByRole('heading', { name: '婚礼项目中心' })).toBeVisible();
    await page.getByPlaceholder('例如：孟先生与林小姐婚礼').fill('端到端测试婚礼');
    await page.getByRole('button', { name: /创建空白项目/ }).click();
    await expect(page.getByText('新婚礼项目已经创建。')).toBeVisible();
    await expect(page.getByText('端到端测试婚礼').first()).toBeVisible();
    await page.getByRole('button', { name: '归档项目' }).click();
    await expect(page.getByText('已归档').first()).toBeVisible();
  });

  test('婚礼日作战中心可推进流程并登记异常', async ({ page }) => {
    await page.getByRole('button', { name: /婚礼日作战/ }).click();
    await expect(page.getByRole('heading', { name: '婚礼日作战中心' })).toBeVisible();
    const currentCard = page.locator('.warroom-current');
    if (await currentCard.getByRole('button', { name: '开始' }).isVisible()) {
      await currentCard.getByRole('button', { name: '开始' }).click();
    }
    await page.getByPlaceholder('例如：摄影 B 机位晚到').fill('E2E现场异常');
    await page.locator('.incident-form textarea').fill('自动化测试异常上报');
    await page.getByRole('button', { name: '上报异常' }).click();
    await expect(page.getByText('E2E现场异常')).toBeVisible();
  });

  test('财务中心可登记报价和查看统一结算', async ({ page }) => {
    await page.getByRole('button', { name: /财务与合同/ }).click();
    await expect(page.getByRole('heading', { name: '财务合同与结算' })).toBeVisible();
    await expect(page.getByText('预计最终成本')).toBeVisible();
    await page.getByRole('button', { name: /新增报价/ }).click();
    await page.getByLabel('报价名称').fill('E2E补充报价');
    await page.getByLabel('供应商').selectOption({ index: 1 });
    await page.getByLabel('预算项').selectOption({ index: 1 });
    await page.getByLabel('报价金额').fill('1000');
    await page.getByRole('button', { name: '保存' }).click();
    await expect(page.getByText('E2E补充报价')).toBeVisible();
  });

  test('同步冲突中心可显示待同步和冲突计数', async ({ page }) => {
    await page.getByRole('button', { name: /同步与冲突/ }).click();
    await expect(page.getByRole('heading', { name: '同步与冲突中心' })).toBeVisible();
    await expect(page.getByText('待同步命令')).toBeVisible();
    await expect(page.getByText('版本冲突')).toBeVisible();
  });
});
