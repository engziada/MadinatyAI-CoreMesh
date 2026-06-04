import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TenantGuard } from '@madinatyai/tenancy';
import { Public } from '../../auth/decorators/public.decorator';
import { SoukElKantoService } from '../soukelkanto.service';

@ApiTags('Souk ElKanto — Categories')
@Controller('categories')
@UseGuards(TenantGuard)
export class CategoriesController {
  constructor(private readonly souk: SoukElKantoService) {}

  /** Browse-time enum — public. */
  @Public()
  @Get()
  list() {
    return this.souk.getCategories();
  }
}
