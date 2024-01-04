import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379
      },
      settings: {
        lockDuration: 60000,
        stalledInterval: 30000,
        maxStalledCount: 2,
        guardInterval: 5000,
        drainDelay: 30000
      },
      defaultJobOptions: {
        attempts: 15,
        removeOnComplete: true,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    })
  ],
  exports: [BullModule]
})
export class QueueModule {}
