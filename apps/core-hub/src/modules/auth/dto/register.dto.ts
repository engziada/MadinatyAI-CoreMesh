import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

/**
 * E.164-ish phone number — accepts +201xxxxxxxxxx (Egyptian mobile)
 * and a generous superset to ease seeding.
 */
const PHONE_REGEX = /^(?:\+?[1-9]\d{7,14}|01\d{9})$/;

export class RegisterDto {
  @ApiProperty({
    description: 'Phone number in international format, e.g. +201001234567',
    example: '+201001234567',
  })
  @IsString()
  @Matches(PHONE_REGEX, {
    message: 'phoneNumber must be a valid international or local Egyptian phone.',
  })
  phoneNumber!: string;
}
