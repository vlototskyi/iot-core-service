import { Injectable, Logger } from '@nestjs/common';
import { DhtMessage, IoTMessage, SoundMessage } from './iot.types';
import CryptoJS from 'crypto-js';
import { FabricService } from '../fabric/fabric.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class IotService {
  private readonly logger = new Logger(IotService.name);
  private readonly fieldOrder: Record<string, string[]> = {
    'esp32-dht01': ['device_id', 'ts', 'ts_epoch', 'temperature', 'humidity'],
    'esp32-sound01': [
      'device_id',
      'ts',
      'ts_epoch',
      'sound_floor',
      'sound_rms_avg',
      'sound_rms_peak',
      'sound_delta_avg',
      'sound_delta_peak',
      'sound_percent_avg',
      'sound_percent_peak',
      'win_ms',
      'seg_ms',
    ],
  };

  private readonly keyIdToEnv: Record<string, string> = {
    'esp32-dht01-key': 'IOT_PUBKEY_ESP32_DHT01',
    'esp32-sound01-key': 'IOT_PUBKEY_ESP32_SOUND01',
  };

  constructor(
    private readonly fabric: FabricService,
    private readonly config: ConfigService,
  ) {}

  async handleDht(topic: string, data: DhtMessage) {
    const record = this.wrap(topic, 'dht', data);

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

  verifySignature(payload: IoTMessage): boolean {
    const { sig, key_id } = payload;
    if (!sig || !key_id) return false;

    const envName = this.keyIdToEnv[key_id];
    if (!envName) {
      this.logger.warn(`No env mapping for key_id=${key_id}`);
      return false;
    }

    const rawPublicKey = this.config.get<string>(envName);
    if (!rawPublicKey) {
      this.logger.warn(`No public key in env ${envName} for key_id=${key_id}`);
      return false;
    }

    const publicKey = rawPublicKey.replace(/\\n/g, '\n');

    const msg = this.reconstructPayload(payload);

    try {
      const verifier = crypto.createVerify('SHA256');
      verifier.update(msg);
      verifier.end();
      const signature = Buffer.from(sig, 'base64');

      const ok = verifier.verify(
        {
          key: publicKey,
          format: 'pem',
          type: 'spki',
        },
        signature,
      );

      if (!ok) {
        this.logger.warn(
          `Signature verification failed for ${payload.device_id}`,
        );
      }
      return ok;
    } catch (e) {
      console.error('Signature verification error:', e);
      return false;
    }
  }

  private reconstructPayload(payload: any): string {
    const order = this.fieldOrder[payload.device_id];
    if (!order) {
      throw new Error(`Unknown device ID: ${payload.device_id}`);
    }

    const parts: string[] = [];

    for (const key of order) {
      const value = payload[key];

      if (typeof value === 'number') {
        if (payload.device_id === 'esp32-dht01') {
          if (key === 'temperature' || key === 'humidity') {
            parts.push(`"${key}":${value.toFixed(2)}`);
            continue;
          }
        }

        parts.push(`"${key}":${value}`);
      } else {
        parts.push(`"${key}":"${value}"`);
      }
    }

    return `{${parts.join(',')}}`;
  }

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
