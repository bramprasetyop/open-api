import { ApiHideProperty } from '@nestjs/swagger';
import { OmitClass } from '@src/core/utils/index.utils';
import { IsBoolean, IsString, MaxLength } from 'class-validator';

export class OpenApiUpdateRequest {
  @ApiHideProperty()
  userId?: string;

  @IsString()
  @MaxLength(255)
  id: string;

  @IsString()
  companyName: string;

  @ApiHideProperty()
  privateKey?: string;

  @ApiHideProperty()
  publicKey?: string;

  @IsBoolean()
  isActive: boolean;
}

export class OpenApiUpdateResponse extends OmitClass(OpenApiUpdateRequest, [
  'userId',
  'id',
  'category'
]) {}
