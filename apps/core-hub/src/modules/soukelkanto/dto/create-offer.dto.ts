import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateOfferDto {
  @IsString()
  @IsNotEmpty()
  listingId!: string;

  @IsInt()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  tokenHoldAmount?: number;
}

export class CounterOfferDto {
  @IsInt()
  @Min(0)
  amount!: number;
}

export class DeclineOfferDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UpdateOfferDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
