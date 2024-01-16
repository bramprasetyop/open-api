import { ApiHideProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDefined, IsString } from 'class-validator';

export class OpenAPISymmetricSignatureHeaderRequest {
  @IsString()
  @IsDefined()
  @ApiHideProperty()
  @Expose({ name: 'x-timestamp' })
  'X-TIMESTAMP': string;

  @IsString()
  @IsDefined()
  @ApiHideProperty()
  @Expose({ name: 'x-url' })
  'X-URL': string;

  @IsString()
  @IsDefined()
  @ApiHideProperty()
  @Expose({ name: 'authorization' })
  Authorization: string;
}
