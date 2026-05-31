import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { IncidentType } from '@prisma/client';

/** File a cross-platform shared report against an offender. */
export class CreateReportDto {
  @IsString()
  reporterId!: string;

  @IsString()
  offenderId!: string;

  @IsEnum(IncidentType)
  incidentType!: IncidentType;

  @IsInt()
  @Min(1)
  @Max(5)
  severity!: number;

  @IsOptional()
  @IsBoolean()
  isPlatformWideBanned?: boolean;

  @IsOptional()
  @IsString()
  originSubdomain?: string;
}
