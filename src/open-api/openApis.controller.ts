import {
  Body,
  Controller,
  InternalServerErrorException,
  Post,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/jwt-auth.guard';
import { RequestHeader } from '@src/core/service/customDecorator/headers';

import {
  OpenAPIAccessTokenHeaderRequest,
  OpenAPISymmetricSignatureHeaderRequest,
  OpenAPIVerifySymmetricSignatureHeaderRequest
} from './dto';
import { OpenApisService } from './service/openApis.service';

@Controller('v1')
@ApiTags('Open-api')
@ApiBearerAuth()
export class OpenApisController {
  constructor(private openApi: OpenApisService) {}

  @Post('/signature')
  async generateSignature(
    @Body() body: { clientId: string; timestamp: string }
  ): Promise<any> {
    try {
      const { clientId, timestamp } = body;
      return await this.openApi.generateSignature(clientId, timestamp);
    } catch (error) {
      throw new InternalServerErrorException(error?.message);
    }
  }

  @Post('/access-token')
  async generateAccessToken(
    @RequestHeader(OpenAPIAccessTokenHeaderRequest)
    headers: OpenAPIAccessTokenHeaderRequest,
    @Body() body: { grantType: string }
  ) {
    try {
      const { grantType } = body;
      const {
        'X-TIMESTAMP': timestamp,
        'X-CLIENT-ID': clientId,
        'X-SIGNATURE': signature
      } = headers;
      const generateAccessTokenData = {
        clientId,
        signature,
        grantType,
        timestamp
      };
      return await this.openApi.generateAccessToken(generateAccessTokenData);
    } catch (error) {
      throw new InternalServerErrorException(error?.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/create-symmetric-signature')
  async createSymmetricSignature(
    @RequestHeader(OpenAPISymmetricSignatureHeaderRequest)
    headers: OpenAPISymmetricSignatureHeaderRequest,
    @Body() body: any
  ): Promise<any> {
    try {
      const {
        'X-TIMESTAMP': timestamp,
        Authorization: accessToken,
        'X-URL': relativeUrl
      } = headers;
      const generateSimmetricSignatureData = {
        accessToken,
        relativeUrl,
        timestamp
      };
      return await this.openApi.generateSymmetricSignature(
        generateSimmetricSignatureData,
        body
      );
    } catch (error) {
      throw new InternalServerErrorException(error?.message);
    }
  }

  @Post('/verify-symmetric-signature')
  @UseGuards(JwtAuthGuard)
  async verifySymmetricSignature(
    @RequestHeader(OpenAPIVerifySymmetricSignatureHeaderRequest)
    headers: OpenAPIVerifySymmetricSignatureHeaderRequest,
    @Body() body: any
  ) {
    const {
      'X-SIGNATURE': signature,
      'X-CLIENT-ID': clientId,
      'X-TIMESTAMP': timestamp,
      Authorization: accessToken,
      'X-URL': relativeUrl
    } = headers;

    const claimData = {
      relativeUrl,
      clientId,
      accessToken,
      signature,
      timestamp
    };

    return await this.openApi.symmetricSignature(claimData, body);
  }
}
