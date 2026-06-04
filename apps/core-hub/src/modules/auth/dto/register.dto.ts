import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

/**
 * E.164-ish phone number — accepts +201xxxxxxxxxx (Egyptian mobile)
 * and a generous superset to ease seeding.
 */
const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;

export class RegisterDto {
  @ApiProperty({
    description: 'Phone number in international format, e.g. +201001234567',
    example: '+201001234567',
  })
  @IsString()
  @Matches(PHONE_REGEX, {
    message: 'phoneNumber must be a valid international phone (E.164-like).',
  })
  phoneNumber!: string;
}
