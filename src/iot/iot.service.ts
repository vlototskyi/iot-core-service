import { Injectable, Logger } from '@nestjs/common';
import { DhtMessage, SoundMessage } from './iot.types';
import CryptoJS from 'crypto-js';
import { FabricService } from '../fabric/fabric.service';

@Injectable()
export class IotService {
  private readonly logger = new Logger(IotService.name);

  constructor(private readonly fabric: FabricService) {}

  async handleDht(topic: string, data: DhtMessage) {
    const record = this.wrap(topic, 'dht', data);

    // key = device_id:ts (matches chaincode)
    const key = `${data.device_id}:${data.ts}`;

    try {
      await this.fabric.recordTelemetry(key, {
        ...data,
        topic,
        hash: record.hash,
        kind: 'dht',
      });
      this.logger.log(`DHT committed: ${key} ${record.hash.slice(0, 12)}…`);
    } catch (err) {
      this.logger.error(
        `DHT commit failed for ${key}: ${String((err as Error).message || err)}`,
      );
    }
  }

  async handleSound(topic: string, data: SoundMessage) {
    const record = this.wrap(topic, 'sound', data);

    const key = `${data.device_id}:${data.ts}`;

    try {
      await this.fabric.recordTelemetry(key, {
        ...data,
        topic,
        hash: record.hash,
        kind: 'sound',
      });
      this.logger.log(`SOUND committed: ${key} ${record.hash.slice(0, 12)}…`);
    } catch (err) {
      this.logger.error(
        `SOUND commit failed for ${key}: ${String((err as Error).message || err)}`,
      );
    }
  }

  // helper: add hash for integrity (future on-chain anchor)
  private wrap(topic: string, kind: 'dht' | 'sound', payload: unknown) {
    const serialized = JSON.stringify(payload);
    const hash = CryptoJS.SHA256(serialized).toString(CryptoJS.enc.Hex);
    return {
      kind,
      topic,
      received_at: new Date().toISOString(),
      hash,
      payload,
    };
  }
}
