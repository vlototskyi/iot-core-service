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
import { Auth0Guard } from './auth0.guard';

@Controller('iot')
export class IotController {
  constructor(
    private readonly svc: IotService,
    private readonly fabric: FabricService,
  ) {}

  @UseGuards(ApiKeyGuard)
  @Post('data')
  @HttpCode(202)
  async ingest(@Body() body: iotTypes.ForwardEnvelope) {
    const { topic, data } = body || {};
    console.log(data);
    if (!topic || !data) return { accepted: false, reason: 'Bad envelope' };
    const valid = this.svc.verifySignature(data);
    if (!valid) return { accepted: false, reason: 'Invalid signature' };

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

  @UseGuards(Auth0Guard)
  @Get('read/:deviceId/:isoTs')
  async read(
    @Param('deviceId') deviceId: string,
    @Param('isoTs') isoTs: string,
  ) {
    const key = `${deviceId}:${isoTs}`;
    return this.fabric.readTelemetry(key);
  }

  @UseGuards(Auth0Guard)
  @Get('query/:deviceId')
  async byDevice(@Param('deviceId') deviceId: string) {
    return this.fabric.queryByDevice(deviceId);
  }
}
