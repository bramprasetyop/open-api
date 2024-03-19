import { OPEN_API_REPOSITORY } from '../core/constants';
import { Partner } from './entity/openApi.entity';

export const openApisProviders = [
  {
    provide: OPEN_API_REPOSITORY,
    useValue: Partner
  }
];
