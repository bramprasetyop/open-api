import { ApiHideProperty } from '@nestjs/swagger';
import { OmitClass } from '@src/core/utils/index.utils';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class OpenApiCreateRequest {
  @ApiHideProperty()
  userId?: string;

  @ApiHideProperty()
  @IsOptional()
  @MaxLength(255)
  id?: string;

  @IsString()
  companyName: string;

  @ApiHideProperty()
  privateKey?: string;

  @ApiHideProperty()
  publicKey?: string;

  @IsBoolean()
  isActive: boolean;
}

export class OpenApiCreateResponse extends OmitClass(OpenApiCreateRequest, [
  'userId',
  'id'
]) {}
