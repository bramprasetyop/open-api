import { OpenApi } from '../entity/openApi.entity';

export class PagingOpenApi {
  data: OpenApi[];
  meta: {
    pageSize: number;
    currentPage: number;
    total: number;
    totalPage: number;
  };
}
