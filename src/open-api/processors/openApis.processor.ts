import { Process, Processor } from '@nestjs/bull';
import { Inject, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OPEN_API_REPOSITORY } from '@src/core/constants';
import { LoggerService } from '@src/core/service/logger/logger.service';
import { Job } from 'bull';
import * as crypto from 'crypto';
import { createHmac } from 'crypto';
import * as jsonminify from 'jsonminify';

import { MOAuthKey } from '../entity/openApi.entity';

@Processor('openApiQueue')
export class OpenApiProcessor {
  constructor(
    @Inject(OPEN_API_REPOSITORY)
    private readonly openApiRepository: typeof MOAuthKey,
    private readonly logger: LoggerService,
    private readonly jwtService: JwtService
  ) {}

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
      const clientId = data.split('|')[0];
      console.log(clientId, 'clientId');
      const publicKey = await this.openApiRepository.findOne({
        where: {
          clientId
        }
      });
      console.log(JSON.stringify(publicKey, null, 2), 'publicKey publicKey');
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

  @Process('generateSignatureQueue')
  async processGenerateSignature(job: Job<any>) {
    try {
      const { timestamp, clientId } = job.data;

      const client = await this.openApiRepository.findOne({
        where: {
          clientId
        }
      });

      console.log(JSON.stringify(client, null, 2));

      if (!client) {
        throw new NotFoundException('Unauthorized. [Unknown client]');
      }

      const sign = crypto.createSign('RSA-SHA256');
      const stringToSign = `${clientId}|${timestamp}`;
      sign.update(stringToSign);
      this.logger.log(
        '[ Success Generate Signature in bull processor] : ',
        stringToSign
      );
      return { signature: sign.sign(client?.privateKey, 'base64') };
    } catch (error) {
      this.logger.error(
        'generate signature in bull processor',
        'Error',
        JSON.stringify(error, null, 2)
      );
      throw error;
    }
  }

  @Process('generateAccessTokenQueue')
  async processGenerateAccessToken(job: Job<any>) {
    try {
      const { clientId, signature, timestamp } = job.data;

      const isClientIdExist = await this.openApiRepository.findOne({
        where: {
          clientId
        }
      });

      if (!isClientIdExist) {
        throw new NotFoundException('Unauthorized. [Unknown client]');
      }

      const stringToSign = `${clientId}|${timestamp}`;
      const isVerify = await this.verifySignature(stringToSign, signature);

      console.log(isVerify, 'isVerify');

      if (!isVerify) {
        throw new NotFoundException('Unauthorized. [X-SIGNATURE]');
      }
      const token = await this.createToken(stringToSign);
      console.log(token, 'token');
      return token;
    } catch (error) {
      this.logger.error(
        'generate signature in bull processor',
        'Error',
        JSON.stringify(error, null, 2)
      );
      throw error;
    }
  }

  @Process('generateSymmetricSignatureQueue')
  async processGenerateSymmetricSignature(job: Job<any>) {
    try {
      const { relativeUrl, accessToken, timestamp } = job?.data?.data;
      const { body } = job?.data;

      const stringToSign = await this.generateSymmetricStringToSign(
        'POST',
        relativeUrl,
        accessToken,
        body,
        timestamp
      );

      return await this.generateSymmetricSignatureFunc(stringToSign);
    } catch (error) {
      this.logger.error(
        'generate signature in bull processor',
        'Error',
        JSON.stringify(error, null, 2)
      );
      throw error;
    }
  }

  @Process('verifySymmetricSignatureQueue')
  async processVerifySymmetricSignature(job: Job<any>) {
    try {
      const { signature, relativeUrl, accessToken, timestamp } =
        job?.data?.data;
      const { body } = job?.data;

      return await this.verifySymmetricSignature(
        signature,
        accessToken,
        relativeUrl,
        body,
        timestamp
      );
    } catch (error) {
      this.logger.error(
        'generate signature in bull processor',
        'Error',
        JSON.stringify(error, null, 2)
      );
      throw error;
    }
  }
}
