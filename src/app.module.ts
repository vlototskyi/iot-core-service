import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { IotService } from './iot/iot.service';
import { IotController } from './iot/iot.controller';
import { FabricService } from './fabric/fabric.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [IotController, HealthController],
  providers: [IotService, FabricService],
})
export class AppModule {}
