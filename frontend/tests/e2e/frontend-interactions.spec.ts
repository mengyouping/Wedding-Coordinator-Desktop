import { expect, test, type Page } from '@playwright/test';

const routes = [
  ['项目中心', 'projects', '婚礼项目中心'],
  ['指挥中心', 'dashboard', ''],
  ['婚礼全案', 'operations', '婚礼全案'],
  ['婚礼日作战', 'warroom', '婚礼日作战中心'],
  ['预算工作簿', 'budget', '预算工作簿'],
  ['财务与合同', 'finance', '财务合同与结算'],
  ['筹备任务', 'tasks', '筹备任务'],
  ['宾客与 RSVP', 'guests', '宾客与 RSVP'],
  ['排桌座位', 'seating', '排桌座位'],
  ['供应商合同', 'vendors', '供应商与合同'],
  ['婚礼日流程', 'timeline', '婚礼日流程'],
  ['电子请帖', 'invitations', '电子请帖'],
  ['附件中心', 'attachments', '附件中心'],
  ['风险预案', 'risks', '风险预案'],
  ['物料清单', 'materials', '物料清单'],
  ['同步与冲突', 'conflicts', '同步与冲突中心'],
  ['项目设置', 'settings', '项目设置']
] as const;

function watchRuntimeErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}

async function expectNoRuntimeErrors(errors: string[]): Promise<void> {
  await expect.poll(() => errors, { timeout: 500 }).toEqual([]);
}

async function buttonName(page: Page, index: number): Promise<string> {
  const button = page.locator('main.main-content button:visible:not([disabled])').nth(index);
  return button.evaluate(element =>
    element.getAttribute('aria-label')
    || element.getAttribute('title')
    || element.textContent?.replace(/\s+/g, ' ').trim()
    || ''
  );
}

test('全部主导航可以逐项跳转且不产生运行时错误', async ({ page }) => {
  const errors = watchRuntimeErrors(page);
  await page.goto('/#/dashboard');
  for (const [label, route, title] of routes) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#/${route}$`));
    await expect(page.locator('main.main-content')).toBeVisible();
    if (title) await expect(page.getByRole('heading', { name: title, exact: true }).first()).toBeVisible();
  }
  await expectNoRuntimeErrors(errors);
});

for (const [, route] of routes) {
  test(`${route} 页面全部初始可见按钮具备名称且点击不抛异常`, async ({ page }) => {
    test.setTimeout(120_000);
    const errors = watchRuntimeErrors(page);
    page.on('dialog', dialog => void dialog.dismiss());
    page.on('filechooser', chooser => void chooser.setFiles([]));
    page.on('download', download => void download.cancel());
    page.on('popup', popup => void popup.close());

    await page.goto(`/#/${route}`);
    const initialCount = await page.locator('main.main-content button:visible:not([disabled])').count();
    for (let index = 0; index < initialCount; index += 1) {
      await page.goto(`/#/${route}`);
      const currentCount = await page.locator('main.main-content button:visible:not([disabled])').count();
      if (index >= currentCount) continue;
      const name = await buttonName(page, index);
      expect(name, `${route} 第 ${index + 1} 个可见按钮缺少可访问名称`).not.toBe('');
      const button = page.locator('main.main-content button:visible:not([disabled])').nth(index);
      await button.click({ timeout: 5_000 });
      await page.waitForTimeout(30);
      await expectNoRuntimeErrors(errors);
    }
  });
}

test('顶部设置按钮、用户头像和六套主题都可操作', async ({ page }) => {
  const errors = watchRuntimeErrors(page);
  await page.goto('/#/dashboard');
  await page.getByRole('button', { name: '进入项目设置' }).click();
  await expect(page).toHaveURL(/#\/settings$/);
  await page.goto('/#/dashboard');
  await page.getByRole('button', { name: /当前用户/ }).click();
  await expect(page).toHaveURL(/#\/settings$/);
  await page.goto('/#/dashboard');
  await page.getByRole('button', { name: /切换主题/ }).click();
  for (const [label, id] of [
    ['香槟鎏金', 'champagne'], ['月光银白', 'moonlight'], ['玫瑰花园', 'rose'],
    ['极夜星河', 'midnight'], ['盛世囍宴', 'festival'], ['甜心萌礼', 'kawaii']
  ] as const) {
    await page.getByRole('button', { name: new RegExp(label) }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', id);
    await page.getByRole('button', { name: /切换主题/ }).click();
  }
  await page.getByRole('button', { name: '关闭主题中心' }).click();
  await expectNoRuntimeErrors(errors);
});

test('非法 JSON 导入会显示错误提示而不是产生未处理异常', async ({ page }) => {
  const errors = watchRuntimeErrors(page);
  await page.goto('/#/dashboard');
  const input = page.locator('.topbar input[type="file"]');
  await input.setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{invalid') });
  await expect(page.getByRole('alert')).toContainText(/导入|数据错误|失败/);
  await expectNoRuntimeErrors(errors);
});

test('预算与婚礼全案内部页签可以完整切换', async ({ page }) => {
  const errors = watchRuntimeErrors(page);
  await page.goto('/#/budget');
  for (const label of ['总控看板', '分类明细', '参数模型', '付款与合同', '总指挥清单']) {
    await page.getByRole('button', { name: new RegExp(label) }).click();
  }
  await page.goto('/#/operations');
  for (const label of ['宴会餐饮', '场地部署', '岗位分工', '宾客接待', '仪式内容', '供应商交付', '物流物料', '现场作战']) {
    await page.getByRole('button', { name: new RegExp(label) }).click();
  }
  await expectNoRuntimeErrors(errors);
});

test('主要新增弹窗可以打开、关闭并恢复焦点', async ({ page }) => {
  const errors = watchRuntimeErrors(page);
  const cases = [
    ['finance', '新增报价', '供应商报价'],
    ['tasks', '新增任务', '新增任务'],
    ['guests', '新增宾客', '宾客资料'],
    ['seating', '新增桌位', '桌位设置'],
    ['vendors', '新增供应商', '供应商档案'],
    ['timeline', '新增节点', '流程节点'],
    ['risks', '登记风险', '风险登记'],
    ['materials', '新增物料', '物料档案']
  ] as const;
  for (const [route, button, dialog] of cases) {
    await page.goto(`/#/${route}`);
    const trigger = page.getByRole('button', { name: new RegExp(button) });
    await trigger.click();
    const modal = page.getByRole('dialog', { name: dialog });
    await expect(modal).toBeVisible();
    const dialogButtons = modal.getByRole('button');
    for (let index = 0; index < await dialogButtons.count(); index += 1) {
      const name = await dialogButtons.nth(index).evaluate(element => element.getAttribute('aria-label') || element.textContent?.trim() || '');
      expect(name, `${dialog} 第 ${index + 1} 个按钮缺少名称`).not.toBe('');
    }
    await page.getByRole('button', { name: new RegExp(`关闭${dialog}弹窗`) }).click();
    await expect(modal).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
  await expectNoRuntimeErrors(errors);
});

test('移动端导航可以打开、跳转并自动关闭', async ({ page }) => {
  const errors = watchRuntimeErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/dashboard');
  await page.getByRole('button', { name: '打开导航' }).click();
  await expect(page.getByRole('navigation')).toBeVisible();
  await page.getByRole('button', { name: '婚礼全案', exact: true }).click();
  await expect(page).toHaveURL(/#\/operations$/);
  await expect(page.locator('.sidebar')).not.toHaveClass(/is-open/);
  await expectNoRuntimeErrors(errors);
});