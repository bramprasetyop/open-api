import { OPEN_API_REPOSITORY } from '@src/core/constants';
import { OpenApi } from '@src/open-api/entity/openApi.entity';

export const openApisProviders = [
  {
    provide: OPEN_API_REPOSITORY,
    useValue: OpenApi
  }
];
