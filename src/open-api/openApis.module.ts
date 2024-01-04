import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LoggerService } from '@src/core/service/logger/logger.service';

import { QueueModule } from '../core/service/queue/queue.module';
import { OpenApisController } from './opanApis.controller';
import { openApisProviders } from './openApis.providers';
import { OpenApiProcessor } from './processors/openApis.processor';
import { OpenApisService } from './service/openApis.service';

@Module({
  imports: [
    QueueModule,
    BullModule.registerQueue({
      name: 'openApiQueue'
    }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_KEY,
        signOptions: {
          expiresIn: '900s'
        }
      })
    })
  ],
  providers: [
    OpenApisService,
    OpenApiProcessor,
    ...openApisProviders,
    LoggerService
  ],
  controllers: [OpenApisController],
  exports: [OpenApisService, LoggerService]
})
export class OpenApisModule {}
