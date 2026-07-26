import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

/** Kitchen creates a new delivery request. */
export class CreateDeliveryRequestDto {
  @ApiProperty({ example: 'Building 12, District 3, Madinaty' })
  @IsString()
  @MinLength(1)
  deliveryPoint!: string;

  @ApiProperty({ example: 'Mahmoud Hassan' })
  @IsString()
  @MinLength(1)
  recipientName!: string;

  @ApiProperty({ example: '01012345678' })
  @IsString()
  @MinLength(1)
  recipientPhone!: string;

  @ApiPropertyOptional({ example: 'Leave at the door' })
  @IsOptional()
  @IsString()
  notes?: string;
}
