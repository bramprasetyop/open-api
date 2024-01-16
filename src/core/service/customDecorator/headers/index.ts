import {
  ExecutionContext,
  UnauthorizedException,
  createParamDecorator
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ValidationError, validateOrReject } from 'class-validator';

export const RequestHeader = createParamDecorator(
  async (value: any, ctx: ExecutionContext) => {
    const headers = ctx.switchToHttp().getRequest().headers;

    const dto = plainToInstance(value, headers, {
      excludeExtraneousValues: true
    });

    try {
      await validateOrReject(dto);
      return dto;
    } catch (errors) {
      if (errors instanceof Array && errors.length > 0) {
        const formattedErrors = errors.map((error: ValidationError) => {
          const constraints = Object.values(error.constraints).join(', ');
          return {
            property: error.property,
            constraints
          };
        });
        throw new UnauthorizedException(formattedErrors);
      } else {
        throw new UnauthorizedException(errors);
      }
    }
  }
);
