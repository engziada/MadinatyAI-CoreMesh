import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { getKitchenPortalHtml } from './kitchen-portal.html';

@Controller('kitchen')
export class KitchenPortalController {
  @Public()
  @Get()
  getPortal(@Res() res: Response) {
    const apiBaseUrl = '/api/v1';
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(getKitchenPortalHtml(apiBaseUrl));
  }
}
