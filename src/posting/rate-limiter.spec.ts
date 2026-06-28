import { RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  it('VK: разрешает 25 постов в сутки и блокирует 26-й (spec)', () => {
    const now = new Date('2026-06-28T10:00:00Z');
    const limiter = new RateLimiter(() => now);

    for (let i = 0; i < 25; i++) {
      expect(limiter.canPublish('vk', now)).toBe(true);
      limiter.record('vk', now);
    }
    expect(limiter.canPublish('vk', now)).toBe(false);
  });

  it('счётчик сбрасывается при смене суток', () => {
    let current = new Date('2026-06-28T23:00:00Z');
    const limiter = new RateLimiter(() => current);

    for (let i = 0; i < 25; i++) {
      limiter.record('vk', current);
    }
    expect(limiter.canPublish('vk', current)).toBe(false);

    current = new Date('2026-06-29T00:01:00Z');
    expect(limiter.canPublish('vk', current)).toBe(true);
  });

  it('Telegram: без лимита (-1) — публиковать можно всегда', () => {
    const now = new Date('2026-06-28T10:00:00Z');
    const limiter = new RateLimiter(() => now);

    for (let i = 0; i < 1000; i++) {
      limiter.record('telegram', now);
    }
    expect(limiter.canPublish('telegram', now)).toBe(true);
  });
});
