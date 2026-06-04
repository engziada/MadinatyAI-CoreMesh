import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Matches, Max, Min } from 'class-validator';

/** MIME types the FE may upload as listing photos. */
const ALLOWED_MIME = /^image\/(jpeg|png|webp|heic)$/;

export class PhotoUploadUrlDto {
  @ApiProperty({ example: 'crib.jpg' })
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @ApiProperty({
    description: 'Image MIME type — must be JPEG / PNG / WEBP / HEIC.',
    example: 'image/jpeg',
  })
  @IsString()
  @Matches(ALLOWED_MIME, { message: 'contentType must be a supported image MIME' })
  contentType!: string;

  @ApiProperty({
    description: 'File size in bytes. Max 10 MB.',
    example: 1_248_273,
  })
  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024)
  bytes!: number;
}

/** Response shape returned by POST /listings/photo-upload-url. */
export interface PhotoUploadUrlResponse {
  uploadUrl: string;
  r2Key: string;
  publicUrl: string;
  expiresInSeconds: number;
}
