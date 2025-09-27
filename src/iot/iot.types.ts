export interface IoTBaseMessage {
  device_id: string;
  ts: string;
  ts_epoch?: number;
}

export interface DhtMessage extends IoTBaseMessage {
  temperature: number;
  humidity: number;
}

export interface SoundMessage extends IoTBaseMessage {
  sound_floor: number;
  sound_rms_avg: number;
  sound_rms_peak: number;
  sound_delta_avg: number;
  sound_delta_peak: number;
  sound_percent_avg: number;
  sound_percent_peak: number;
  win_ms: number;
  seg_ms: number;
}

export type IoTMessage = DhtMessage | SoundMessage;

export interface ForwardEnvelope<T extends IoTMessage = IoTMessage> {
  topic: string;
  data: T;
}
