import { ErrorCode, ERROR_CODE_HTTP_STATUS } from './error-codes';

describe('ErrorCode', () => {
  it('should have a mapping for every error code', () => {
    for (const code of Object.values(ErrorCode)) {
      expect(ERROR_CODE_HTTP_STATUS[code]).toBeDefined();
      expect(typeof ERROR_CODE_HTTP_STATUS[code]).toBe('number');
    }
  });

  it('should map VALIDATION_ERROR to 400', () => {
    expect(ERROR_CODE_HTTP_STATUS[ErrorCode.VALIDATION_ERROR]).toBe(400);
  });

  it('should map UNAUTHORIZED to 401', () => {
    expect(ERROR_CODE_HTTP_STATUS[ErrorCode.UNAUTHORIZED]).toBe(401);
  });

  it('should map FORBIDDEN to 403', () => {
    expect(ERROR_CODE_HTTP_STATUS[ErrorCode.FORBIDDEN]).toBe(403);
  });

  it('should map NOT_FOUND to 404', () => {
    expect(ERROR_CODE_HTTP_STATUS[ErrorCode.NOT_FOUND]).toBe(404);
  });

  it('should map RATE_LIMIT_EXCEEDED to 429', () => {
    expect(ERROR_CODE_HTTP_STATUS[ErrorCode.RATE_LIMIT_EXCEEDED]).toBe(429);
  });

  it('should map INTERNAL_ERROR to 500', () => {
    expect(ERROR_CODE_HTTP_STATUS[ErrorCode.INTERNAL_ERROR]).toBe(500);
  });

  it('should map INSUFFICIENT_TOKENS to 402', () => {
    expect(ERROR_CODE_HTTP_STATUS[ErrorCode.INSUFFICIENT_TOKENS]).toBe(402);
  });
});
