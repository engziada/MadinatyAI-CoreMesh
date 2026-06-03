import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class PhotoUploadUrlDto {
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @IsInt()
  @Min(1)
  bytes!: number;
}
