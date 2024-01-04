import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class ResponseMiddleware implements NestMiddleware {
  // eslint-disable-next-line @typescript-eslint/ban-types
  use(req: Request, res: Response, next: Function) {
    const originalWrite = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode < 400) {
        body = {
          status_code: body.status_code ?? 200,
          status_description: body.status_description ?? 'inquiry success',
          ...(body.data ? { data: body.data } : {}),
          ...(body.meta ? { meta: body.meta } : {})
        };
      }

      return originalWrite(body);
    };
    next();
  }
}
