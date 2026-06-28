import { Module } from '@nestjs/common';
import { CLOCK, systemClock } from './clock';
import { ContentAdapter } from './content-adapter';
import { RateLimiter } from './rate-limiter';
import { InMemoryPostingQueue } from './in-memory-posting-queue';
import { POSTING_QUEUE } from './posting-queue.port';
import { CHANNEL_PUBLISHERS } from './publishers/channel-publisher.port';
import { TelegramPublisher } from './publishers/telegram.publisher';
import { VkPublisher } from './publishers/vk.publisher';
import { PublisherRegistry } from './publishers/publisher-registry';

/**
 * Домен автопостинга: rate-limiter + адаптация контента + публикаторы каналов +
 * очередь. Экспортирует POSTING_QUEUE — модуль автоматизации зависит от порта.
 */
@Module({
  providers: [
    { provide: CLOCK, useValue: systemClock },
    ContentAdapter,
    RateLimiter,
    TelegramPublisher,
    VkPublisher,
    {
      provide: CHANNEL_PUBLISHERS,
      useFactory: (telegram: TelegramPublisher, vk: VkPublisher) => [
        telegram,
        vk,
      ],
      inject: [TelegramPublisher, VkPublisher],
    },
    PublisherRegistry,
    { provide: POSTING_QUEUE, useClass: InMemoryPostingQueue },
  ],
  exports: [POSTING_QUEUE],
})
export class PostingModule {}
