import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OPEN_API_REPOSITORY } from '@src/core/constants';
import { LoggerService } from '@src/core/service/logger/logger.service';
import * as crypto from 'crypto';
import { createHmac } from 'crypto';
import * as dotenv from 'dotenv';
import * as jsonminify from 'jsonminify';
import * as moment from 'moment';

import { Partner } from '../entity/openApi.entity';

dotenv.config();

@Injectable()
export class OpenApisService {
  constructor(
    private readonly logger: LoggerService,
    @Inject(OPEN_API_REPOSITORY)
    private readonly openApiRepository: typeof Partner,
    private readonly jwtService: JwtService
  ) {}

  async generateKeyPair() {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    return { privateKey, publicKey };
  }

  private async createToken(payload: string): Promise<any> {
    try {
      const accessToken = this.jwtService.sign({ payload });
      const decodedToken: any = this.jwtService.decode(accessToken, {
        json: true
      });
      const expirationTimeInSeconds = decodedToken?.exp;
      return { accessToken: accessToken, expired: expirationTimeInSeconds };
    } catch (error) {
      this.logger.error(
        '===== Error create token =====',
        `Error: `,
        JSON.stringify(error, null, 2)
      );
      throw new Error('generate access token error');
    }
  }

  private async verifySignature(
    data: string,
    signature: string
  ): Promise<boolean> {
    try {
      const id = data.split('|')[0];
      const publicKey = await this.openApiRepository.findOne({
        where: { id },
        attributes: ['publicKey']
      });
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(data);
      return verify.verify(publicKey?.publicKey, signature, 'base64');
    } catch (error) {
      this.logger.error(
        '===== Error verify signature =====',
        `Error: `,
        JSON.stringify(error, null, 2)
      );
      return false;
    }
  }

  private async generateSymmetricStringToSign(
    httpMethod: string,
    relativeUrl: string,
    accessToken: string,
    body: any,
    timestamp: string
  ) {
    const token = accessToken.split(' ')[1];
    const jsonString = typeof body === 'string' ? body : JSON.stringify(body);
    const minifiedJson = jsonminify(jsonString);
    const sha256hash = crypto
      .createHash('sha256')
      .update(minifiedJson)
      .digest('hex');
    const lowercaseHex = sha256hash.toLowerCase();
    const stringToSign = `${httpMethod}:${relativeUrl}:${token}:${lowercaseHex}:${timestamp}`;
    this.logger.log(
      '[ Success Generate Symmetric String To Signature] : ',
      stringToSign
    );
    return stringToSign;
  }

  private async verifySymmetricSignature(
    signature: string,
    accessToken: string,
    relativeUrl: string,
    body: any,
    timestamp: string
  ) {
    const receivedSignature = signature;

    const stringToSign = await this.generateSymmetricStringToSign(
      'POST',
      relativeUrl,
      accessToken,
      body,
      timestamp
    );
    const generatedSignature =
      await this.generateSymmetricSignatureFunc(stringToSign);

    return generatedSignature === receivedSignature && true;
  }

  private async hmacSha512(secret: string, data: string): Promise<string> {
    const hmac = createHmac('sha512', secret);
    hmac.update(data);
    return hmac.digest('base64');
  }

  private async generateSymmetricSignatureFunc(stringToSign: string) {
    const clientSecret = process.env.JWT_KEY;

    const hmac = await this.hmacSha512(clientSecret, stringToSign);
    const signature = hmac;
    this.logger.log('[ Success Generate Symmetric] : ', signature);
    return signature;
  }

  async create(dto: any): Promise<any> {
    const t = await this.openApiRepository.sequelize.transaction();

    try {
      this.logger.log('starting create partner', '===running===');

      const { privateKey, publicKey } = await this.generateKeyPair();

      const createdOpenApi = await this.openApiRepository.create(
        { ...dto, privateKey, publicKey, createdBy: 'SYS' },
        { transaction: t }
      );

      await t.commit();

      this.logger.log(
        'success add partner to db',
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
        'error add partner',
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

      const client = await this.openApiRepository.findOne({
        where: { id: clientId },
        attributes: ['privateKey']
      });

      if (!client) {
        throw new NotFoundException('Unauthorized. [Unknown client]');
      }
      const sign = crypto.createSign('RSA-SHA256');
      const stringToSign = `${clientId}|${timestamp}`;

      sign.update(stringToSign);
      const signature = sign.sign(client.privateKey, 'base64');

      return {
        status_description: 'generate signature success',
        data: { signature }
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
    const { clientId, signature, timestamp } = data;

    try {
      const isValid = await this.isTimestampValid(data?.timestamp);
      if (!isValid) {
        throw new NotFoundException('invalid field timestamp [X-TIMESTAMP]');
      }

      let response = null;
      if (data?.grantType === 'client_credentials') {
        const isClientIdExist = await this.openApiRepository.findOne({
          where: { id: clientId },
          attributes: ['privateKey']
        });

        if (!isClientIdExist) {
          throw new NotFoundException('Unauthorized. [Unknown client]');
        }

        const stringToSign = `${clientId}|${timestamp}`;
        const isVerify = await this.verifySignature(stringToSign, signature);

        if (!isVerify) {
          throw new NotFoundException('Unauthorized. [X-SIGNATURE]');
        }
        response = await this.createToken(stringToSign);
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
      const { relativeUrl, accessToken, timestamp } = data;
      const isValid = await this.isTimestampValid(timestamp);
      if (!isValid) {
        throw new NotFoundException('invalid field timestamp [X-TIMESTAMP]');
      }

      let response = null;

      const stringToSign = await this.generateSymmetricStringToSign(
        'POST',
        relativeUrl,
        accessToken,
        body,
        timestamp
      );

      response = await this.generateSymmetricSignatureFunc(stringToSign);

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
      const { signature, relativeUrl, accessToken, timestamp } = data;
      const isValid = await this.isTimestampValid(timestamp);
      if (!isValid) {
        throw new NotFoundException('invalid field timestamp [X-TIMESTAMP]');
      }

      const response = await this.verifySymmetricSignature(
        signature,
        accessToken,
        relativeUrl,
        body,
        timestamp
      );

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
