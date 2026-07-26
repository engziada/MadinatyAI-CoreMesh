import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/** Toggle courier online/offline status. */
export class ToggleOnlineDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isOnline!: boolean;
}
