import { Module } from '@nestjs/common';

import { FHIService } from './fhi.service';

@Module({
  providers: [FHIService],
  exports: [FHIService]
})
export class FHIModule {}
