// src/sample/sample.controller.ts
import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('v1')
export class HomeController {
  @Get()
  getHello(@Res() res: Response): void {
    res
      .status(HttpStatus.OK)
      .json({ status_description: 'Open API PT Equity Life Indonesia' });
  }
}
