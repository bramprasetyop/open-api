import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LoggerService } from '@src/core/service/logger/logger.service';
import { OpenApisModule } from '@src/open-api/openApis.module';

import { openApisProviders } from './auth.providers';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_KEY,
      signOptions: { expiresIn: process.env.TOKEN_EXPIRATION }
    }),
    OpenApisModule
  ],
  providers: [LoggerService, JwtStrategy, ...openApisProviders]
})
export class AuthModule {}
