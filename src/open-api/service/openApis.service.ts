import { InjectQueue } from '@nestjs/bull';
import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { LoggerService } from '@src/core/service/logger/logger.service';
import { Queue } from 'bull';
import * as dotenv from 'dotenv';
import * as moment from 'moment';

dotenv.config();

@Injectable()
export class OpenApisService {
  constructor(
    private readonly logger: LoggerService,
    @InjectQueue('openApiQueue') private openApiQueue: Queue
  ) {}

  private async isTimestampValid(timestamp: string): Promise<boolean> {
    if (/^(\d{4})-(\d{2})-(\d{2})$/.test(timestamp)) {
      return false;
    }
    const parsedTimestamp = moment(timestamp, moment.ISO_8601, true);
    this.logger.log('[ isTimestampValid] : ', parsedTimestamp);
    return parsedTimestamp.isValid();
  }

  async generateSignature(clientId: string, timestamp: string) {
    try {
      const isValid = await this.isTimestampValid(timestamp);
      if (!isValid) {
        throw new NotFoundException('invalid field timestamp format');
      }

      const dto = { clientId, timestamp };
      let response = null;
      const job = await this.openApiQueue.add('generateSignatureQueue', dto);

      response = await job.finished();
      this.logger.log('[ Success Generate Signature] : ', response);
      return {
        status_description: 'generate signature success',
        data: response
      };
    } catch (error) {
      this.logger.error(
        'error generate signature',
        'error ===>',
        JSON.stringify(error, null, 2)
      );
      throw error;
    }
  }

  async generateAccessToken(data: any) {
    try {
      const isValid = await this.isTimestampValid(data?.timestamp);
      if (!isValid) {
        throw new NotFoundException('invalid field timestamp [X-TIMESTAMP]');
      }

      let response = null;
      if (data?.grantType === 'client_credentials') {
        const job = await this.openApiQueue.add(
          'generateAccessTokenQueue',
          data
        );

        response = await job.finished();
      } else {
        this.logger.error(
          'grant type',
          'error ===>',
          'invalid field format [grant type]'
        );
        throw new NotFoundException('invalid field format [grant type]');
      }

      return {
        status_description: 'generate access token success',
        data: response
      };
    } catch (error) {
      this.logger.error(
        'error generate access token',
        'error ===>',
        JSON.stringify(error, null, 2)
      );
      throw error;
    }
  }

  async generateSymmetricSignature(data: any, body: any) {
    try {
      const { timestamp } = data;
      const isValid = await this.isTimestampValid(timestamp);
      if (!isValid) {
        throw new NotFoundException('invalid field timestamp [X-TIMESTAMP]');
      }

      const dto = { data, body };

      let response = null;
      const job = await this.openApiQueue.add(
        'generateSymmetricSignatureQueue',
        dto
      );

      response = await job.finished();

      return {
        status_description: 'generate symmetric signature success',
        data: { signature: response }
      };
    } catch (error) {
      this.logger.error(
        'error generate symmetric signature',
        'error ===>',
        JSON.stringify(error, null, 2)
      );
      throw error;
    }
  }

  async symmetricSignature(data: any, body: any) {
    try {
      const { timestamp } = data;
      const dto = { data, body };
      const isValid = await this.isTimestampValid(timestamp);
      if (!isValid) {
        throw new NotFoundException('invalid field timestamp [X-TIMESTAMP]');
      }

      let response = null;
      const job = await this.openApiQueue.add(
        'verifySymmetricSignatureQueue',
        dto
      );

      response = await job.finished();

      if (!response) {
        throw new BadRequestException(
          'We encountered an issue with the data you provided. Please double-check the details and try again.'
        );
      }
      this.logger.log('[ Success Verify Symmetric signature] : ', response);

      return {
        status_description: 'access granted'
      };
    } catch (error) {
      this.logger.error(
        'error Verify Symmetric signature',
        'error ===>',
        JSON.stringify(error, null, 2)
      );
      throw error;
    }
  }
}
