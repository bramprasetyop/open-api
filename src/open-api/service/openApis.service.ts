import { InjectQueue } from '@nestjs/bull';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { OPEN_API_REPOSITORY } from '@src/core/constants';
import { LoggerService } from '@src/core/service/logger/logger.service';
import { Queue } from 'bull';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as moment from 'moment';

import { Partner } from '../entity/openApi.entity';

dotenv.config();

@Injectable()
export class OpenApisService {
  constructor(
    private readonly logger: LoggerService,
    @InjectQueue('openApiQueue') private openApiQueue: Queue,
    @Inject(OPEN_API_REPOSITORY)
    private readonly openApiRepository: typeof Partner
  ) {}

  async generateKeyPair() {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    return { privateKey, publicKey };
  }

  async create(dto: any): Promise<any> {
    const t = await this.openApiRepository.sequelize.transaction();

    try {
      this.logger.log(
        'starting create openApi through BullMQ',
        '===running==='
      );

      const { privateKey, publicKey } = await this.generateKeyPair();

      const createdOpenApi = await this.openApiRepository.create(
        { ...dto, privateKey, publicKey, createdBy: 'SYS' },
        { transaction: t }
      );

      await t.commit();

      this.logger.log(
        'success add openApi to db',
        JSON.stringify(createdOpenApi, null, 2)
      );

      return {
        status_code: 201,
        status_description: 'Add partner success!',
        data: createdOpenApi
      };
    } catch (error) {
      await t.rollback();

      this.logger.error(
        'error create openApi through BullMQ',
        'error ===>',
        JSON.stringify(error, null, 2)
      );
      throw new Error(error.message);
    }
  }

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
