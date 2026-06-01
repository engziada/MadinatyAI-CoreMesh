/**
 * Pagination helpers — @Pagination() decorator + PageDto + PagedResponse.
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export interface PageParams {
  page: number;
  limit: number;
}

export const Pagination = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): PageParams => {
    const request = ctx.switchToHttp().getRequest<{
      query: { page?: string; limit?: string };
    }>();
    const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(request.query.limit ?? '20', 10)));
    return { page, limit };
  },
);

export class PageDto<T> {
  items: T[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;

  constructor(items: T[], totalItems: number, params: PageParams) {
    this.items = items;
    this.page = params.page;
    this.limit = params.limit;
    this.totalItems = totalItems;
    this.totalPages = Math.ceil(totalItems / params.limit);
  }
}

export function PagedResponse<T>(classRef: Type<T>): Type<PageDto<T>> {
  class PagedResponseClass extends PageDto<T> {
    @ApiProperty({ isArray: true })
    declare items: T[];

    @ApiProperty()
    declare page: number;

    @ApiProperty()
    declare limit: number;

    @ApiProperty()
    declare totalItems: number;

    @ApiProperty()
    declare totalPages: number;
  }
  return PagedResponseClass as Type<PageDto<T>>;
}
