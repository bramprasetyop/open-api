import { IsOptional, IsString } from 'class-validator';

export class OpenApiRequestList {
  @IsString()
  page: string;

  @IsString()
  perPage: string;

  @IsOptional()
  @IsString()
  search: string;
}
