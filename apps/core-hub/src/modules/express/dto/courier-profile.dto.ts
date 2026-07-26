import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum VehicleType {
  BICYCLE = 'BICYCLE',
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
  SCOOTER = 'SCOOTER',
  WALKING = 'WALKING',
}

/** Request to register or update a delivery courier profile. */
export class CourierProfileDto {
  @ApiProperty({ example: 'Ahmed Ali', minLength: 1 })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: '01012345678' })
  @IsString()
  @MinLength(1)
  phone!: string;

  @ApiProperty({ enum: VehicleType, example: VehicleType.MOTORCYCLE })
  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

  @ApiProperty({ example: '29101012345678' })
  @IsString()
  @MinLength(1)
  nationalId!: string;

  @ApiPropertyOptional({ example: 'https://r2.example.com/national-id.jpg' })
  @IsOptional()
  @IsString()
  nationalIdPhoto?: string;

  @ApiPropertyOptional({ example: 'https://r2.example.com/photo.jpg' })
  @IsOptional()
  @IsString()
  personalPhoto?: string;
}
