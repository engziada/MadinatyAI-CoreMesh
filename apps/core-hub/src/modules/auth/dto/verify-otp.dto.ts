import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;

export class VerifyOtpDto {
  @ApiProperty({ example: '+201001234567' })
  @IsString()
  @Matches(PHONE_REGEX)
  phoneNumber!: string;

  @ApiProperty({
    description: 'Six-digit OTP delivered out-of-band.',
    example: '482915',
  })
  @IsString()
  @Length(6, 6, { message: 'code must be exactly 6 digits.' })
  @Matches(/^\d{6}$/, { message: 'code must be numeric.' })
  code!: string;
}
