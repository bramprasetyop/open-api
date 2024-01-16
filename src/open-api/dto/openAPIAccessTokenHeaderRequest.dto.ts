import { ApiHideProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDefined, IsString } from 'class-validator';

export class OpenAPIAccessTokenHeaderRequest {
  @IsString()
  @IsDefined()
  @ApiHideProperty()
  @Expose({ name: 'x-timestamp' })
  'X-TIMESTAMP': string;

  @IsString()
  @IsDefined()
  @ApiHideProperty()
  @Expose({ name: 'x-client-id' })
  'X-CLIENT-ID': string;

  @IsString()
  @IsDefined()
  @ApiHideProperty()
  @Expose({ name: 'x-signature' })
  'X-SIGNATURE': string;
}
