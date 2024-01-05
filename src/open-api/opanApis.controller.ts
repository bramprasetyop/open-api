import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  InternalServerErrorException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/jwt-auth.guard';
import { MapResponseSwagger } from '@src/core/utils/index.utils';

import {
  OpenApiCreateRequest,
  OpenApiCreateResponse,
  OpenApiFindAllResponse,
  OpenApiRequestList,
  OpenApiResponse,
  OpenApiUpdateRequest,
  OpenApiUpdateResponse
} from './dto';
import { OpenApisService } from './service/openApis.service';

@Controller('open-api')
@ApiTags('Open-api')
@ApiBearerAuth()
export class OpenApisController {
  constructor(private openApi: OpenApisService) {}

  @MapResponseSwagger(OpenApiResponse, { status: 200, isArray: true })
  @Get()
  async findAll(
    @Query() query: OpenApiRequestList,
    @Req() request
  ): Promise<OpenApiFindAllResponse> {
    try {
      const { user } = request;
      return await this.openApi.findAll(
        user?.id_user,
        +query?.page,
        +query?.perPage,
        query?.search
      );
    } catch (error) {
      throw new InternalServerErrorException(error?.message);
    }
  }

  @MapResponseSwagger(OpenApiResponse, { status: 200, isArray: false })
  @Get(':id')
  async findDetail(
    @Param('id') id: string,
    @Req() request
  ): Promise<OpenApiResponse> {
    try {
      const { user } = request;
      return await this.openApi.findById(user?.id_user, id);
    } catch (error) {
      throw new InternalServerErrorException(error?.message);
    }
  }

  @MapResponseSwagger(OpenApiCreateResponse, { status: 200, isArray: false })
  @Post()
  async create(
    @Body() body: OpenApiCreateRequest,
    @Req() request
  ): Promise<any> {
    try {
      const { user } = request;
      const jobData = {
        ...body,
        ...{ userId: user?.id_user }
      };
      return await this.openApi.create(jobData);
    } catch (error) {
      throw new InternalServerErrorException(error?.message);
    }
  }

  @MapResponseSwagger(OpenApiUpdateResponse, { status: 200, isArray: false })
  @Put()
  async update(
    @Body() body: OpenApiUpdateRequest,
    @Req() request
  ): Promise<any> {
    try {
      const { user } = request;
      const jobData = {
        ...body,
        ...{ userId: user?.id_user }
      };

      return await this.openApi.update(jobData);
    } catch (error) {
      throw new InternalServerErrorException(error?.message);
    }
  }

  @ApiOkResponse({
    schema: {
      example: {
        status_code: 200,
        status_description: 'Berhasil menghapus prosedur.'
      }
    }
  })
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() request): Promise<any> {
    try {
      const { user } = request;
      return await this.openApi.delete(user?.id_user, id);
    } catch (error) {
      throw new InternalServerErrorException(error?.message);
    }
  }

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
    @Headers('X-TIMESTAMP') timestamp: string,
    @Headers('X-CLIENT-ID') clientId: string,
    @Headers('X-SIGNATURE') signature: string,
    @Body() body: { grantType: string }
  ) {
    try {
      const { grantType } = body;
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
    @Headers('X-TIMESTAMP') timestamp: string,
    @Headers('Authorization') accessToken: string,
    @Headers('relativeUrl') relativeUrl: string,
    @Body() body: any
  ): Promise<any> {
    try {
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

  @Post('/claims')
  @UseGuards(JwtAuthGuard)
  async claims(
    @Headers('X-TIMESTAMP') timestamp: string,
    @Headers('X-CLIENT-ID') clientId: string,
    @Headers('X-SIGNATURE') signature: string,
    @Headers('Authorization') accessToken: string,
    @Body() body: any
  ) {
    try {
      const claimData = {
        relativeUrl: '/open-api/claims',
        clientId,
        accessToken,
        signature,
        timestamp
      };
      return await this.openApi.claims(claimData, body);
    } catch (error) {
      throw new InternalServerErrorException(error?.message);
    }
  }
}
