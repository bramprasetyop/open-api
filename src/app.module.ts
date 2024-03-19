import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { HomeController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './core/database/database.module';
import { ResponseMiddleware } from './core/middleware';
import { LoggerService } from './core/service/logger/logger.service';
import { OpenApisModule } from './open-api/openApis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    OpenApisModule
  ],
  controllers: [HomeController],

  providers: [LoggerService]
})
export class AppModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ResponseMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
