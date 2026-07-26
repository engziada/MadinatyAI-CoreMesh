import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { LifeBookingStatus } from '@prisma/client';

/** Update booking status. */
export class UpdateBookingStatusDto {
  @ApiProperty({ enum: LifeBookingStatus })
  @IsEnum(LifeBookingStatus)
  status!: LifeBookingStatus;
}
