import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum ReportIncidentType {
  SCAM = 'SCAM',
  SPAM = 'SPAM',
  FRAUD = 'FRAUD',
  POLICY_VIOLATION = 'POLICY_VIOLATION',
  OTHER = 'OTHER',
}

export class ReportListingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  severity!: number;

  @IsEnum(ReportIncidentType)
  incidentType!: ReportIncidentType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsString()
  evidencePhotoR2Key?: string;
}
