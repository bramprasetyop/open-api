import { Process, Processor } from '@nestjs/bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { OPEN_API_REPOSITORY } from '@src/core/constants';
import { LoggerService } from '@src/core/service/logger/logger.service';
import { Job } from 'bull';
import { Cache } from 'cache-manager';
import * as crypto from 'crypto';

import { OpenApiCreateRequest } from '../dto';
import { OpenApi } from '../entity/openApi.entity';

@Processor('openApiQueue')
export class OpenApiProcessor {
  constructor(
    @Inject(OPEN_API_REPOSITORY)
    private readonly openApiRepository: typeof OpenApi,
    private readonly logger: LoggerService,
    @Inject(CACHE_MANAGER) private readonly cacheService: Cache
  ) {}

  async generateKeyPair() {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    return { privateKey, publicKey };
  }

  @Process('addOpenApiQueue')
  async processAddOpenApi(job: Job<OpenApiCreateRequest>) {
    const openApiData = job.data;

    const t = await this.openApiRepository.sequelize.transaction();

    try {
      this.logger.log(
        'Starting add openApi in bull processor',
        '===running==='
      );

      const { privateKey, publicKey } = await this.generateKeyPair();

      const createdOpenApi = await this.openApiRepository.create(
        { ...openApiData, privateKey, publicKey },
        { transaction: t }
      );

      await t.commit();
      const keys = await this.cacheService.store.keys();
      const keysToDelete = keys.filter(key =>
        key.startsWith(`openApiData${openApiData?.userId}`)
      );

      for (const keyToDelete of keysToDelete) {
        await this.cacheService.del(keyToDelete);
      }

      this.logger.log(
        'Add openApi in bull processor done',
        JSON.stringify(createdOpenApi, null, 2)
      );
    } catch (error) {
      this.logger.error(
        'Add openApi in bull processor',
        'Error',
        JSON.stringify(error, null, 2)
      );
      await t.rollback();
      throw error;
    }
  }

  @Process('updateOpenApiQueue')
  async processUpdateOpenApi(job: Job<OpenApiCreateRequest>) {
    const openApiData = job.data;

    const t = await this.openApiRepository.sequelize.transaction();

    try {
      this.logger.log(
        'Starting update openApi in bull processor',
        '===running==='
      );

      const updatedOpenApi = await OpenApi.findByPk(openApiData?.id);

      await updatedOpenApi.update(openApiData, { transaction: t });

      await t.commit();
      const keys = await this.cacheService.store.keys();
      const keysToDelete = keys.filter(key =>
        key.startsWith(`openApiData${openApiData?.userId}`)
      );

      for (const keyToDelete of keysToDelete) {
        await this.cacheService.del(keyToDelete);
      }

      this.logger.log(
        'Update openApi in bull processor done',
        JSON.stringify(updatedOpenApi, null, 2)
      );
    } catch (error) {
      this.logger.error(
        'Update openApi in bull processor',
        'Error',
        JSON.stringify(error, null, 2)
      );
      await t.rollback();
      throw error;
    }
  }
}
