import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { LifeBookingType } from '@prisma/client';

/** Create a booking/order for a location. */
export class CreateLifeBookingDto {
  @ApiProperty({ example: 'Mahmoud Hassan' })
  @IsString()
  @MinLength(1)
  customerName!: string;

  @ApiProperty({ example: '01012345678' })
  @IsString()
  @MinLength(1)
  customerPhone!: string;

  @ApiPropertyOptional({ example: '2026-08-01T14:00:00Z' })
  @IsOptional()
  @IsString()
  dateTime?: string;

  @ApiProperty({ enum: LifeBookingType })
  @IsEnum(LifeBookingType)
  type!: LifeBookingType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
