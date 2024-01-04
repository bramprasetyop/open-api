/* eslint-disable @typescript-eslint/no-var-requires */
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Queue } from 'bull';
import * as compression from 'compression';

import { AppModule } from './app.module';
import { ExceptionMiddleware } from './core/middleware';
import { checkConfigService } from './core/service/config';

async function bootstrap() {
  // validate env global
  checkConfigService();

  const app = await NestFactory.create(AppModule, { cors: true });
  const basicAuth = require('express-basic-auth');

  // set using compression
  app.use(
    compression({
      threshold: 512
    })
  );

  // start message queue dashboard
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/bull-dashboard');
  const procedureQueue = app.get<Queue>(`BullQueue_openApiQueue`);

  createBullBoard({
    queues: [new BullAdapter(procedureQueue)],
    serverAdapter
  });

  app.use(
    '/bull-dashboard',
    basicAuth({
      users: {
        admin: process.env.BULLMQ_PASS
      },
      challenge: true
    }),
    serverAdapter.getRouter()
  );
  // end message queue dashboard

  // add api prefix
  app.setGlobalPrefix('api/v1');

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

  const server = await app.listen(process.env.APP_PORT);
  server.setTimeout(600000); // set default timeout 10 minutes
}
bootstrap();
