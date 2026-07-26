import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

const PHONE_REGEX = /^(?:\+?[1-9]\d{7,14}|01\d{9})$/;

export class LoginDto {
  @ApiProperty({
    description: 'Phone number of an existing GlobalUser.',
    example: '+201001234567',
  })
  @IsString()
  @Matches(PHONE_REGEX, {
    message: 'phoneNumber must be a valid international or local Egyptian phone.',
  })
  phoneNumber!: string;
}
