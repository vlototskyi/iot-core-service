import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { isDhtMessage, isSoundMessage } from './iot.guards';
import * as iotTypes from './iot.types';
import { IotService } from './iot.service';
import { FabricService } from '../fabric/fabric.service';

// @UseGuards(ApiKeyGuard)
@Controller('iot')
export class IotController {
  constructor(
    private readonly svc: IotService,
    private readonly fabric: FabricService,
  ) {}

  @Post('data')
  @HttpCode(202)
  async ingest(@Body() body: iotTypes.ForwardEnvelope) {
    const { topic, data } = body || {};
    if (!topic || !data) return { accepted: false, reason: 'Bad envelope' };

    if (isDhtMessage(data)) {
      await this.svc.handleDht(topic, data);
      return { accepted: true, type: 'dht' };
    }

    if (isSoundMessage(data)) {
      await this.svc.handleSound(topic, data);
      return { accepted: true, type: 'sound' };
    }

    return { accepted: false, reason: 'Unknown payload' };
  }

  @Get('read/:deviceId/:isoTs')
  async read(
    @Param('deviceId') deviceId: string,
    @Param('isoTs') isoTs: string,
  ) {
    const key = `${deviceId}:${isoTs}`;
    return this.fabric.readTelemetry(key);
  }

  @Get('query/:deviceId')
  async byDevice(@Param('deviceId') deviceId: string) {
    return this.fabric.queryByDevice(deviceId);
  }
}
