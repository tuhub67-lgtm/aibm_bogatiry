import { InMemoryPostingQueue } from './in-memory-posting-queue';
import { ContentAdapter } from './content-adapter';
import { RateLimiter } from './rate-limiter';
import { PublisherRegistry } from './publishers/publisher-registry';
import { ChannelPublisher } from './publishers/channel-publisher.port';
import { ChannelResult } from './channel.types';

describe('InMemoryPostingQueue', () => {
  const now = new Date('2026-06-28T10:00:00Z');
  const clock = () => now;

  function publisher(
    channel: 'telegram' | 'vk',
    result: ChannelResult,
  ): ChannelPublisher & { publish: jest.Mock } {
    return { channel, publish: jest.fn().mockResolvedValue(result) };
  }

  function makeQueue(
    publishers: ChannelPublisher[],
    limiter: RateLimiter = new RateLimiter(clock),
  ): InMemoryPostingQueue {
    return new InMemoryPostingQueue(
      clock,
      new ContentAdapter(),
      limiter,
      new PublisherRegistry(publishers),
    );
  }

  it('публикует немедленно и помечает completed', async () => {
    const tg = publisher('telegram', { channel: 'telegram', outcome: 'published' });
    const job = await makeQueue([tg]).enqueue({
      subscriptionId: 's',
      channels: ['telegram'],
      content: { text: 'привет' },
      priority: false,
    });

    expect(job.status).toBe('completed');
    expect(job.results[0].outcome).toBe('published');
    expect(tg.publish).toHaveBeenCalledTimes(1);
  });

  it('skipped-канал тоже завершает задание (намеренно не отправлено)', async () => {
    const vk = publisher('vk', {
      channel: 'vk',
      outcome: 'skipped',
      detail: 'прослойка',
    });
    const job = await makeQueue([vk]).enqueue({
      subscriptionId: 's',
      channels: ['vk'],
      content: { text: 'привет' },
      priority: false,
    });

    expect(job.status).toBe('completed');
    expect(job.results[0].outcome).toBe('skipped');
  });

  it('rate-limit → канал deferred (partial), повтор публикует после освобождения', async () => {
    const tg = publisher('telegram', { channel: 'telegram', outcome: 'published' });
    let allow = false;
    const limiter = {
      canPublish: () => allow,
      record: jest.fn(),
    } as unknown as RateLimiter;

    const queue = makeQueue([tg], limiter);
    const job = await queue.enqueue({
      subscriptionId: 's',
      channels: ['telegram'],
      content: { text: 'привет' },
      priority: false,
    });

    expect(job.status).toBe('partial');
    expect(job.results[0].outcome).toBe('deferred');
    expect(tg.publish).not.toHaveBeenCalled();

    allow = true;
    await queue.processDue(now);

    const after = await queue.get(job.id);
    expect(after?.status).toBe('completed');
    expect(after?.results[0].outcome).toBe('published');
    expect(tg.publish).toHaveBeenCalledTimes(1);
  });

  it('отложенная по времени публикация не обрабатывается до срока', async () => {
    const tg = publisher('telegram', { channel: 'telegram', outcome: 'published' });
    const future = new Date(now.getTime() + 60_000);

    const job = await makeQueue([tg]).enqueue({
      subscriptionId: 's',
      channels: ['telegram'],
      content: { text: 'привет' },
      scheduledAt: future,
      priority: false,
    });

    expect(job.status).toBe('queued');
    expect(tg.publish).not.toHaveBeenCalled();
  });
});
