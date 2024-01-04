import { OpenApiResponse } from './openApi.dto';

export class OpenApiFindAllResponse {
  data: OpenApiResponse[];
  meta: {
    pageSize: number;
    currentPage: number;
    total: number;
    totalPage: number;
  };
}
