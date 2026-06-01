import { PageDto, type PageParams } from './pagination';

describe('PageDto', () => {
  it('should calculate totalPages correctly', () => {
    const params: PageParams = { page: 1, limit: 10 };
    const page = new PageDto(['a', 'b'], 25, params);
    expect(page.totalPages).toBe(3);
  });

  it('should handle zero items', () => {
    const params: PageParams = { page: 1, limit: 10 };
    const page = new PageDto([], 0, params);
    expect(page.totalPages).toBe(0);
  });

  it('should handle exact page boundary', () => {
    const params: PageParams = { page: 1, limit: 10 };
    const page = new PageDto(Array(10).fill('x'), 10, params);
    expect(page.totalPages).toBe(1);
  });

  it('should preserve page params', () => {
    const params: PageParams = { page: 3, limit: 5 };
    const page = new PageDto(['a'], 20, params);
    expect(page.page).toBe(3);
    expect(page.limit).toBe(5);
    expect(page.totalItems).toBe(20);
  });
});
