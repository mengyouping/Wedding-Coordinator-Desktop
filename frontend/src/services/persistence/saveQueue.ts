export class SaveQueue<T> {
  private tail: Promise<unknown> = Promise.resolve();
  private pendingCount = 0;

  get pending(): number {
    return this.pendingCount;
  }

  enqueue(operation: () => Promise<T>): Promise<T> {
    this.pendingCount += 1;
    const run = this.tail.then(operation, operation);
    this.tail = run.finally(() => {
      this.pendingCount = Math.max(0, this.pendingCount - 1);
    });
    return run;
  }
}
