import { Type, applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiResponse,
  IntersectionType,
  OmitType,
  getSchemaPath
} from '@nestjs/swagger';

import { Meta, SwaggerMetaResponse } from '../dto/global.dto';

export const zeroPad = (num, places) => String(num).padStart(places, '0');
export const capitalizeWords = str => {
  if (!str) return null;
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const OmitClass = (type: Type<unknown>, field: any) => {
  return class extends IntersectionType(OmitType(type, field)) {};
};

export const MapResponseSwagger = <
  DataDto extends Type<unknown>,
  Options extends { status: number; isArray: boolean }
>(
  dataDto: DataDto,
  options: Options
) =>
  applyDecorators(
    ApiExtraModels(SwaggerMetaResponse, Meta, dataDto),
    ApiResponse({
      status: options.status,
      schema: {
        allOf: [
          { $ref: getSchemaPath(SwaggerMetaResponse) },
          {
            ...(options.isArray
              ? {
                  properties: {
                    status_code: {
                      example: options.status
                    },
                    data: {
                      type: 'array',
                      items: { $ref: getSchemaPath(dataDto) }
                    },
                    meta: {
                      $ref: getSchemaPath('Meta')
                    }
                  }
                }
              : {
                  properties: {
                    status_code: {
                      example: options.status
                    },
                    data: {
                      $ref: getSchemaPath(dataDto)
                    }
                  }
                })
          }
        ]
      }
    })
  );

export const convertKeysToSnakeCase = arr =>
  JSON.parse(arr).map(obj =>
    Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key
          .replace(/([A-Z])/g, '_$1')
          .toLowerCase()
          .replace(/_(.)/g, (_, match) => `_${match.toUpperCase()}`),
        value
      ])
    )
  );
