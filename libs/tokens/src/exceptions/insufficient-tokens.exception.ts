import { BadRequestException } from '@nestjs/common';

/** Thrown when a user attempts to spend more tokens than their wallet holds. */
export class InsufficientTokensException extends BadRequestException {
  constructor(tokenType: string, required: number, available: number) {
    super(`Insufficient ${tokenType} tokens: required ${required}, available ${available}`);
  }
}
