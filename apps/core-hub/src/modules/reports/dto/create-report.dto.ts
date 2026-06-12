import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { IncidentType } from '@prisma/client';

/**
 * File a cross-platform shared report against an offender.
 *
 * R-11 F-05: `reporterId` is intentionally NOT on this DTO. The controller
 * binds the reporter from the JWT — body-supplied identity would allow an
 * attacker to spoof reports from any user (weaponising TrustScore to ban
 * victims platform-wide).
 *
 * R-11 F-05: `isPlatformWideBanned` is also removed from the DTO. A regular
 * user-filed report must NEVER trigger a platform-wide ban. Only PLATFORM_ADMIN
 * tooling (separate, future) may flip that bit via the service layer.
 */
export class CreateReportDto {
  @IsString()
  offenderId!: string;

  @IsEnum(IncidentType)
  incidentType!: IncidentType;

  @IsInt()
  @Min(1)
  @Max(5)
  severity!: number;

  @IsOptional()
  @IsString()
  originSubdomain?: string;
}
