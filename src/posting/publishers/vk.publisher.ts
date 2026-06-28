import { Injectable } from '@nestjs/common';
import { AdaptedContent, ChannelResult } from '../channel.types';
import { ChannelPublisher } from './channel-publisher.port';

/**
 * Публикатор VK. По spec п.3 интеграция VK делается ЧЕРЕЗ готовые SMM-сервисы
 * как прослойку, а НЕ через прямой API (с мая 2026 расширенные API-доступы не
 * выдаются). Прямую публикацию намеренно не делаем.
 *
 * До подключения прослойки канал отдаёт 'skipped' — честно, без имитации.
 * [TODO] Реализовать отправку через выбранный SMM-сервис-прослойку.
 */
@Injectable()
export class VkPublisher implements ChannelPublisher {
  readonly channel = 'vk' as const;

  async publish(_content: AdaptedContent): Promise<ChannelResult> {
    return {
      channel: this.channel,
      outcome: 'skipped',
      detail: 'VK — через SMM-прослойку (spec п.3), прямой API не используется',
    };
  }
}
