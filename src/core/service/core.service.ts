import { Injectable, Scope } from '@nestjs/common';
import { LoggerService } from '@src/core/service/logger/logger.service';
import axios from 'axios';

@Injectable({
  scope: Scope.TRANSIENT
})
export class CoreService {
  private api: string = 'http://localhost:3001/api/v1/';

  constructor(private readonly logger: LoggerService) {}

  async connect() {
    this.logger.log('Checking core connection', `${this.api}`);
    this.logger.log(`Connecting to core ...`, `${this.api}`);

    try {
      await axios.post(`${this.api}/health-check`);
      this.logger.log(`Core connected successfully`, `${this.api}`);
    } catch (error) {
      this.logger.error(
        `Connection Failed!`,
        'Fail on connect to core service',
        JSON.stringify(error, null, 2)
      );
      throw new Error(`Can't connect to core service`);
    }
  }
}
