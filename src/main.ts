/* eslint-disable @typescript-eslint/no-var-requires */
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';

import { AppModule } from './app.module';
import { KAFKA_CONFIG } from './core/constants';
import { ExceptionMiddleware } from './core/middleware';
import { checkConfigService } from './core/service/config';

async function bootstrap() {
  // validate env global
  checkConfigService();

  const app = await NestFactory.create(AppModule, { cors: true });

  // set using compression
  app.use(
    compression({
      threshold: 512
    })
  );

  if (process.env.NODE_ENV !== 'production') {
    // swagger documentation
    const config = new DocumentBuilder()
      .setTitle('Open API')
      .setDescription('Open API documentation')
      .setVersion('1.0')
      .addTag('PT Equity Life Indonesia')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/docs', app, document);
  }

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new ExceptionMiddleware());

  // Kafka consumer service
  const kafkaApp = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          brokers: [KAFKA_CONFIG.broker]
        },
        consumer: {
          groupId: KAFKA_CONFIG.groupId
        }
      }
    }
  );
  kafkaApp.listen();

  const server = await app.listen(process.env.APP_PORT);
  server.setTimeout(120000); // set default timeout 2 minutes
}
bootstrap();
