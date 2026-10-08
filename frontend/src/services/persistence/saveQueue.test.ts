import { describe, expect, it } from 'vitest';
import { SaveQueue } from './saveQueue';

describe('SaveQueue', () => {
  it('严格按入队顺序执行并返回最后结果', async () => {
    const order: number[] = [];
    const queue = new SaveQueue<number>();
    const first = queue.enqueue(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
      order.push(1);
      return 1;
    });
    const second = queue.enqueue(async () => {
      order.push(2);
      return 2;
    });

    await expect(first).resolves.toBe(1);
    await expect(second).resolves.toBe(2);
    expect(order).toEqual([1, 2]);
  });

  it('前一个任务失败后仍继续执行后续任务', async () => {
    const queue = new SaveQueue<number>();
    await expect(queue.enqueue(async () => { throw new Error('失败'); })).rejects.toThrow('失败');
    await expect(queue.enqueue(async () => 2)).resolves.toBe(2);
  });
});
