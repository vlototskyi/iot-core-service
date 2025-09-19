import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { IotService } from './iot/iot.service';
import { IotController } from './iot/iot.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [IotController, HealthController],
  providers: [IotService],
})
export class AppModule {}
