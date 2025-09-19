import { DhtMessage, SoundMessage } from './iot.types';

export function hasIoTBaseFields(m: any): boolean {
  return m && typeof m.device_id === 'string' && typeof m.ts === 'string';
}

export function isDhtMessage(m: any): m is DhtMessage {
  return (
    hasIoTBaseFields(m) &&
    typeof m.temperature === 'number' &&
    typeof m.humidity === 'number'
  );
}

export function isSoundMessage(m: any): m is SoundMessage {
  return (
    hasIoTBaseFields(m) &&
    typeof m.sound_floor === 'number' &&
    typeof m.sound_rms_avg === 'number' &&
    typeof m.sound_rms_peak === 'number' &&
    typeof m.sound_delta_avg === 'number' &&
    typeof m.sound_delta_peak === 'number' &&
    typeof m.sound_percent_avg === 'number' &&
    typeof m.sound_percent_peak === 'number' &&
    typeof m.win_ms === 'number' &&
    typeof m.seg_ms === 'number'
  );
}
