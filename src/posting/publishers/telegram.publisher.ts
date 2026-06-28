import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdaptedContent, ChannelResult } from '../channel.types';
import { ChannelPublisher } from './channel-publisher.port';

/**
 * Публикатор Telegram через официальный Bot API (spec п.3: основной канал MVP).
 *
 * Реальная отправка идёт, только когда заданы и токен бота, и chat_id целевого
 * канала. Привязка каналов пользователя — отдельный срез, поэтому в dev chat_id
 * берётся из TELEGRAM_DEFAULT_CHAT_ID. Без любого из них — честный 'skipped',
 * без имитации публикации.
 */
@Injectable()
export class TelegramPublisher implements ChannelPublisher {
  readonly channel = 'telegram' as const;
  private readonly logger = new Logger(TelegramPublisher.name);

  constructor(private readonly config: ConfigService) {}

  async publish(content: AdaptedContent): Promise<ChannelResult> {
    const token = this.config.get<string>('channels.telegramBotToken');
    const chatId = this.config.get<string>('channels.telegramDefaultChatId');

    if (!token || !chatId) {
      this.logger.warn(
        'Telegram не настроен (нужны TELEGRAM_BOT_TOKEN и chat_id канала) — пропуск.',
      );
      return {
        channel: this.channel,
        outcome: 'skipped',
        detail: 'не задан токен бота или chat_id канала',
      };
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: content.text }),
          signal: AbortSignal.timeout(15_000),
        },
      );

      if (!response.ok) {
        this.logger.error(`Telegram Bot API вернул ${response.status}`);
        return {
          channel: this.channel,
          outcome: 'failed',
          detail: `Bot API ${response.status}`,
        };
      }

      return { channel: this.channel, outcome: 'published' };
    } catch (error) {
      this.logger.error(`Сбой отправки в Telegram: ${String(error)}`);
      return {
        channel: this.channel,
        outcome: 'failed',
        detail: 'Bot API недоступен',
      };
    }
  }
}
