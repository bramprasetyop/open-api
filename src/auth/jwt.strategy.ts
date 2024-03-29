import { Inject, Injectable } from '@nestjs/common/decorators';
import { PassportStrategy } from '@nestjs/passport';
import { OPEN_API_REPOSITORY } from '@src/core/constants';
import { Partner } from '@src/open-api/entity/openApi.entity';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(OPEN_API_REPOSITORY)
    private readonly openApiRepository: typeof Partner
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_KEY
    });
  }

  async validate(data: any) {
    const id = data.payload.split('|')[0];
    const isValid = await this.openApiRepository.findOne({
      where: {
        id
      }
    });
    return isValid;
  }
}
