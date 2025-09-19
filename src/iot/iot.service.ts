import { Injectable, Logger } from '@nestjs/common';
import { DhtMessage, SoundMessage } from './iot.types';
import CryptoJS from 'crypto-js';

@Injectable()
export class IotService {
  private readonly logger = new Logger(IotService.name);

  // simple in-memory store for quick testing
  private recent: any[] = [];

  handleDht(topic: string, data: DhtMessage) {
    const record = this.wrap(topic, 'dht', data);
    this.recent.push(record);
    this.logger.log(`DHT saved: ${record.hash.slice(0, 12)}…`);
    // TODO: persist (DB) and submit to Fabric
  }

  handleSound(topic: string, data: SoundMessage) {
    const record = this.wrap(topic, 'sound', data);
    this.recent.push(record);
    this.logger.log(`SOUND saved: ${record.hash.slice(0, 12)}…`);
    // TODO: persist (DB) and submit to Fabric
  }

  // helper: add hash for integrity (future on-chain anchor)
  private wrap(topic: string, kind: 'dht' | 'sound', payload: unknown) {
    const serialized = JSON.stringify(payload);
    const hash = CryptoJS.SHA256(serialized).toString(CryptoJS.enc.Hex);
    return {
      kind,
      topic,
      received_at: new Date().toISOString(),
      hash, // use as a content-addressable key
      payload, // original JSON
    };
  }

  // quick endpoint helper if you want to expose later
  listRecent(limit = 50) {
    return this.recent.slice(-limit).reverse();
  }
}
