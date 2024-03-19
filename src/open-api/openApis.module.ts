import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LoggerService } from '@src/core/service/logger/logger.service';

import { OpenApisController } from './openApis.controller';
import { openApisProviders } from './openApis.providers';
import { OpenApisService } from './service/openApis.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_KEY,
        signOptions: {
          expiresIn: '900s'
        }
      })
    })
  ],
  providers: [OpenApisService, ...openApisProviders, LoggerService],
  controllers: [OpenApisController],
  exports: [OpenApisService, LoggerService]
})
export class OpenApisModule {}
