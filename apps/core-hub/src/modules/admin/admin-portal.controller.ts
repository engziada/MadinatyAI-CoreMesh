import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { getAdminPortalHtml } from './admin-portal.html';

@Controller('admin')
export class SoukAdminPortalController {
  @Public()
  @Get()
  getPortal(@Res() res: Response) {
    const apiBaseUrl = '/api/v1';
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(getAdminPortalHtml(apiBaseUrl));
  }
}
