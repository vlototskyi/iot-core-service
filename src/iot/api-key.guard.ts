import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const got = req.headers['x-api-key'];
    const want = this.config.get<string>('API_KEY');
    if (!got || got !== want)
      throw new UnauthorizedException('Invalid API key');
    return true;
  }
}
