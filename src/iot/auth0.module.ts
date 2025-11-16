import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { Auth0Strategy } from './auth0.strategy';

@Module({
  imports: [PassportModule],
  providers: [Auth0Strategy],
  exports: [],
})
export class Auth0Module {}
