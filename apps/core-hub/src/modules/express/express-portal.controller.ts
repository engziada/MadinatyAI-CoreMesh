import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { getCourierPortalHtml } from './courier-portal.html';

@Controller('express')
export class ExpressPortalController {
  @Public()
  @Get()
  getPortal(@Res() res: Response) {
    const apiBaseUrl = '/api/v1';
    res.setHeader('Content-Type', 'text/html');
    res.send(getCourierPortalHtml(apiBaseUrl));
  }
}
