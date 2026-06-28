import { ContentAdapter } from './content-adapter';

describe('ContentAdapter', () => {
  const adapter = new ContentAdapter();

  it('VK: усекает медиа до 1 (spec) и фиксирует правку', () => {
    const out = adapter.adapt('vk', { text: 'привет', media: ['a', 'b', 'c'] });
    expect(out.media).toEqual(['a']);
    expect(out.adjustments.length).toBeGreaterThan(0);
  });

  it('Telegram: медиа не усекается (лимит -1)', () => {
    const out = adapter.adapt('telegram', {
      text: 'привет',
      media: ['a', 'b', 'c'],
    });
    expect(out.media).toEqual(['a', 'b', 'c']);
    expect(out.adjustments).toEqual([]);
  });

  it('без медиа → пустой массив', () => {
    const out = adapter.adapt('telegram', { text: 'x' });
    expect(out.media).toEqual([]);
  });
});
