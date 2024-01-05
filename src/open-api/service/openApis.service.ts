import { InjectQueue } from '@nestjs/bull';
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OPEN_API_REPOSITORY, REDIS_CACHE_TTL } from '@src/core/constants';
import { LoggerService } from '@src/core/service/logger/logger.service';
import { Queue } from 'bull';
import { Cache } from 'cache-manager';
import * as crypto from 'crypto';
import { createHmac } from 'crypto';
import * as dotenv from 'dotenv';
import * as jsonminify from 'jsonminify';
import * as moment from 'moment';
import { Op } from 'sequelize';

import { OpenApiCreateRequest, OpenApiUpdateRequest } from '../dto';
import { OpenApi } from '../entity/openApi.entity';
import { PagingOpenApi } from './openApis.interface';

dotenv.config();

@Injectable()
export class OpenApisService {
  constructor(
    @Inject(OPEN_API_REPOSITORY)
    private readonly openApiRepository: typeof OpenApi,
    private readonly logger: LoggerService,
    @Inject(CACHE_MANAGER) private readonly cacheService: Cache,
    @Inject(CACHE_MANAGER) private cacheStoreService: CacheStore,
    @InjectQueue('openApiQueue') private openApiQueue: Queue,
    private readonly jwtService: JwtService
  ) {}

  private async isTimestampValid(timestamp: string): Promise<boolean> {
    if (/^(\d{4})-(\d{2})-(\d{2})$/.test(timestamp)) {
      return false;
    }
    const parsedTimestamp = moment(timestamp, moment.ISO_8601, true);
    this.logger.log('[ isTimestampValid] : ', parsedTimestamp);
    return parsedTimestamp.isValid();
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

  private async createToken(payload: string): Promise<any> {
    const accessToken = this.jwtService.sign({ payload });
    return { accessToken: accessToken, expired: '15 minutes' };
  }

  private async verifySignature(
    data: string,
    signature: string
  ): Promise<boolean> {
    try {
      const id = data.split('|')[0];
      const publicKey = await this.openApiRepository.findByPk(id);
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

  async findAll(
    userId: string,
    page: number = 1,
    perPage: number = 10,
    search: string = ''
  ): Promise<PagingOpenApi> {
    try {
      const currentPage = page && page >= 1 ? page : 1;

      this.logger.log(
        'starting get all openApis through existing cached',
        '===running==='
      );

      // Calculate the offset based on the page and perpage values
      const offset = (currentPage - 1) * perPage;

      // get openApis from redis
      const cachedData = await this.cacheService.get<PagingOpenApi>(
        `openApiData${userId}${currentPage}${perPage}${search}`
      );

      if (cachedData) {
        this.logger.log(
          'response get all openApis through existing cached',
          'success'
        );
        return cachedData;
      }

      this.logger.log('starting get all openApis through db', '===running===');

      const response = await this.openApiRepository.findAndCountAll({
        limit: perPage,
        offset,
        order: [['updatedAt', 'DESC']],
        where: {
          companyName: {
            [Op.iLike]: `%${search ? search.toLowerCase() : ''}%`
          }
        }
      });

      const result = {
        status_code: response.rows ? 200 : 204,
        data: response.rows,
        meta: {
          total: response.count,
          pageSize: perPage,
          currentPage,
          totalPage: Math.ceil(response.count / perPage)
        }
      };

      this.logger.log(
        'success get all openApis through db',
        JSON.stringify(response, null, 2)
      );

      // save openApis to redis
      this.cacheStoreService.set(
        `openApiData${userId}${currentPage}${perPage}${search}`,
        result,
        { ttl: REDIS_CACHE_TTL }
      );

      return result;
    } catch (error) {
      this.logger.error(
        'error get all openApis through db',
        'error ===>',
        JSON.stringify(error, null, 2)
      );
      throw new Error(error.message);
    }
  }

  async findById(userId: string, id: string): Promise<OpenApi> {
    try {
      this.logger.log(
        'starting get detail openApi through existing cached',
        '===running==='
      );
      // get openApi detail from redis
      const cachedData = await this.cacheService.get<OpenApi>(
        `openApiData${userId}${id}`
      );

      if (cachedData) {
        this.logger.log(
          'response get detail openApi through existing cached',
          'success'
        );
        return cachedData;
      }

      this.logger.log(
        'starting get detail openApi through db',
        '===running==='
      );

      const response = await this.openApiRepository.findByPk(id);

      if (!response) {
        this.logger.error(
          '===== Error find openApi by id =====',
          `Error: `,
          'ID prosedur tidak ditemukan.'
        );
        throw new NotFoundException(
          'ID prosedur tidak ditemukan, Mohon periksa kembali.'
        );
      }

      this.logger.log(
        'success get detail openApi through db',
        JSON.stringify(response, null, 2)
      );

      // save openApi detail to redis
      this.cacheStoreService.set(`openApiData${userId}${id}`, response, {
        ttl: REDIS_CACHE_TTL
      });

      return response;
    } catch (error) {
      this.logger.error(
        'error get detail openApi through db',
        'error ===>',
        JSON.stringify(error, null, 2)
      );
      throw new Error(error.message);
    }
  }

  async create(dto: OpenApiCreateRequest): Promise<any> {
    const { companyName } = dto;
    try {
      this.logger.log(
        'starting create openApi through BullMQ',
        '===running==='
      );

      await this.openApiQueue.add('addOpenApiQueue', dto);

      this.logger.log(
        'success add openApi to db',
        JSON.stringify(dto, null, 2)
      );

      return {
        status_code: 201,
        status_description: 'Create openApi success!',
        data: { companyName }
      };
    } catch (error) {
      this.logger.error(
        'error create openApi through BullMQ',
        'error ===>',
        JSON.stringify(error, null, 2)
      );
      throw new Error(error.message);
    }
  }

  async update(dto: OpenApiUpdateRequest): Promise<any> {
    const { id, companyName } = dto;
    try {
      this.logger.log(
        'starting update openApi through BullMQ',
        '===running==='
      );

      const findOpenApi = await OpenApi.findByPk(id);

      if (!findOpenApi) {
        this.logger.error(
          '===== Error find openApi by id on update =====',
          `Error: `,
          'ID prosedur tidak ditemukan.'
        );
        throw new NotFoundException(
          'ID prosedur tidak ditemukan, Mohon periksa kembali.'
        );
      }

      await this.openApiQueue.add('updateOpenApiQueue', dto);

      this.logger.log(
        'success update openApi to db',
        JSON.stringify(dto, null, 2)
      );

      return {
        status_code: 201,
        status_description: 'Update openApi success!',
        data: { companyName }
      };
    } catch (error) {
      this.logger.error(
        'error update openApi through BullMQ',
        'error ===>',
        JSON.stringify(error, null, 2)
      );
      throw new Error(error.message);
    }
  }

  async delete(userId: string, id: string): Promise<any> {
    try {
      this.logger.log('starting delete openApi', '===running===');

      const response = await this.openApiRepository.destroy({
        where: { id }
      });

      if (!response) {
        this.logger.error(
          '===== Error find openApi by id on delete =====',
          `Error: `,
          'ID prosedur tidak ditemukan.'
        );
        throw new NotFoundException(
          'ID prosedur tidak ditemukan, Mohon periksa kembali.'
        );
      }

      const keys = await this.cacheService.store.keys();
      const keysToDelete = keys.filter(key =>
        key.startsWith(`openApiData${userId}`)
      );

      for (const keyToDelete of keysToDelete) {
        await this.cacheService.del(keyToDelete);
      }

      this.logger.log(
        'success delete openApi',
        JSON.stringify(response, null, 2)
      );

      return {
        status_code: 201,
        status_description: 'Delete openApi success!'
      };
    } catch (error) {
      this.logger.error(
        'error delete openApi',
        'error ===>',
        JSON.stringify(error, null, 2)
      );
      throw new Error(error.message);
    }
  }

  async generateSignature(id: string, timestamp: string) {
    try {
      const isValid = await this.isTimestampValid(timestamp);
      if (!isValid) {
        throw new NotFoundException('invalid field timestamp format');
      }
      const privateKey = await this.openApiRepository.findByPk(id);
      const sign = crypto.createSign('RSA-SHA256');
      const stringToSign = `${id}|${timestamp}`;
      sign.update(stringToSign);
      this.logger.log('[ Success Generate Signature] : ', stringToSign);
      return {
        status_description: 'generate signature success',
        data: { signature: sign.sign(privateKey?.privateKey, 'base64') }
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
      const { clientId: id, grantType, signature, timestamp } = data;
      const isValid = await this.isTimestampValid(timestamp);
      if (!isValid) {
        throw new NotFoundException('invalid field timestamp [X-TIMESTAMP]');
      }
      const isClientIdExist = await this.openApiRepository.findByPk(id);
      if (!isClientIdExist) {
        throw new NotFoundException('Unauthorized. [Unknown client]');
      }

      if (grantType === 'client_credentials') {
        const stringToSign = `${id}|${timestamp}`;
        const isVerify = await this.verifySignature(stringToSign, signature);

        if (!isVerify) {
          throw new NotFoundException('Unauthorized. [X-SIGNATURE]');
        }
        const token = await this.createToken(stringToSign);
        return {
          status_description: 'generate access token success',
          data: token
        };
      } else {
        this.logger.error(
          'grant type',
          'error ===>',
          'invalid field format [grant type]'
        );
        throw new NotFoundException('invalid field format [grant type]');
      }
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
      const stringToSign = await this.generateSymmetricStringToSign(
        'POST',
        relativeUrl,
        accessToken,
        body,
        timestamp
      );

      const signature = await this.generateSymmetricSignatureFunc(stringToSign);
      return {
        status_description: 'generate symmetric signature success',
        data: { signature }
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

  async claims(data: any, body: any) {
    try {
      const { relativeUrl, accessToken, signature, timestamp } = data;

      const isValid = await this.isTimestampValid(timestamp);
      if (!isValid) {
        throw new NotFoundException('invalid field timestamp [X-TIMESTAMP]');
      }
      const verifySignature = await this.verifySymmetricSignature(
        signature,
        accessToken,
        relativeUrl,
        body,
        timestamp
      );

      if (!verifySignature) {
        throw new UnauthorizedException('Unauthorized. [Signature]');
      }
      return {
        status_description: 'save claim data success'
      };
    } catch (error) {
      this.logger.error(
        'error save claim data',
        'error ===>',
        JSON.stringify(error, null, 2)
      );
      throw error;
    }
  }
}
