import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { IotService } from './iot/iot.service';
import { IotController } from './iot/iot.controller';
import { FabricService } from './fabric/fabric.service';
import { Auth0Module } from './iot/auth0.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    Auth0Module,
  ],
  controllers: [IotController, HealthController],
  providers: [IotService, FabricService],
})
export class AppModule {}
