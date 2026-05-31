import { BadRequestException } from '@nestjs/common';

/** Thrown when an activity type has no pricing configured or is inactive. */
export class InvalidActivityException extends BadRequestException {
  constructor(activityType: string) {
    super(`Activity '${activityType}' is not configured or inactive`);
  }
}
