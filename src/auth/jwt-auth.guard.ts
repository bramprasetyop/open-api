import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  handleRequest(err, user) {
    if (err || !user) {
      throw new UnauthorizedException('Invalid Token');
    }
    return user;
  }
}
