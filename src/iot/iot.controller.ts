import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { isDhtMessage, isSoundMessage } from './iot.guards';
import * as iotTypes from './iot.types';
import { IotService } from './iot.service';

@Controller('iot')
@UseGuards(ApiKeyGuard)
export class IotController {
  constructor(private readonly svc: IotService) {}

  @Post('data')
  @HttpCode(202)
  ingest(@Body() body: iotTypes.ForwardEnvelope) {
    const { topic, data } = body || {};
    if (!topic || !data) return { accepted: false, reason: 'Bad envelope' };

    if (isDhtMessage(data)) {
      this.svc.handleDht(topic, data);
      return { accepted: true, type: 'dht' };
    }

    if (isSoundMessage(data)) {
      this.svc.handleSound(topic, data);
      return { accepted: true, type: 'sound' };
    }

    return { accepted: false, reason: 'Unknown payload' };
  }
}
