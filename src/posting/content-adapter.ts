import { Injectable } from '@nestjs/common';
import { AdaptedContent, PostContent, PublishChannel } from './channel.types';
import { PLATFORM_LIMITS } from './platform-limits.config';

/**
 * Слой адаптации контента под платформу (spec п.3: «отдельный слой
 * трансформации перед публикацией, а не прямая отправка одного контента всюду»).
 *
 * Сейчас применяет ограничения из PLATFORM_LIMITS: число медиа на пост
 * (VK = 1, подтверждено spec) и длину текста (когда лимит задан). Логика готова;
 * конкретные числа берутся из конфига и расширяются по мере уточнения.
 */
@Injectable()
export class ContentAdapter {
  adapt(channel: PublishChannel, content: PostContent): AdaptedContent {
    const limits = PLATFORM_LIMITS[channel];
    const adjustments: string[] = [];

    let media = content.media ?? [];
    if (limits.mediaPerPost >= 0 && media.length > limits.mediaPerPost) {
      adjustments.push(
        `медиа усечено до ${limits.mediaPerPost} (лимит ${channel})`,
      );
      media = media.slice(0, limits.mediaPerPost);
    }

    let text = content.text;
    if (limits.maxTextLength >= 0 && text.length > limits.maxTextLength) {
      adjustments.push(`текст усечён до ${limits.maxTextLength} символов`);
      text = text.slice(0, limits.maxTextLength);
    }

    return { channel, text, media, adjustments };
  }
}
