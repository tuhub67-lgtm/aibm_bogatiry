import { Inject, Injectable } from '@nestjs/common';
import { PublishChannel } from '../channel.types';
import { CHANNEL_PUBLISHERS, ChannelPublisher } from './channel-publisher.port';

/** Резолвит публикатора по каналу. */
@Injectable()
export class PublisherRegistry {
  private readonly byChannel: Map<PublishChannel, ChannelPublisher>;

  constructor(
    @Inject(CHANNEL_PUBLISHERS) publishers: ReadonlyArray<ChannelPublisher>,
  ) {
    this.byChannel = new Map(publishers.map((p) => [p.channel, p]));
  }

  get(channel: PublishChannel): ChannelPublisher | undefined {
    return this.byChannel.get(channel);
  }
}
