import { AdaptedContent, ChannelResult, PublishChannel } from '../channel.types';

/**
 * Публикатор одного канала. Только официальные Bot API / прослойки (spec п.3) —
 * никаких «серых» клиентов и имитации живых пользователей.
 */
export interface ChannelPublisher {
  readonly channel: PublishChannel;
  publish(content: AdaptedContent): Promise<ChannelResult>;
}

/** DI-токен списка публикаторов (по одному на канал). */
export const CHANNEL_PUBLISHERS = Symbol('CHANNEL_PUBLISHERS');
