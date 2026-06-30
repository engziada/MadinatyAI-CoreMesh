import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsIn, MaxLength } from 'class-validator';

export class ChatMessageDto {
  @ApiProperty({ description: 'Role of the message sender' })
  @IsString()
  @IsIn(['user', 'ai', 'assistant'])
  role!: string;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  @MaxLength(2000)
  content!: string;
}

export class AstroChatDto {
  @ApiProperty({ description: 'The user\'s message to Astro' })
  @IsString()
  @MaxLength(2000)
  message!: string;

  @ApiPropertyOptional({
    description: 'Conversation history (last 6 messages)',
    type: [ChatMessageDto],
  })
  @IsArray()
  @IsOptional()
  history?: ChatMessageDto[];

  @ApiPropertyOptional({ description: 'Locale code', enum: ['en', 'ar'] })
  @IsString()
  @IsOptional()
  @IsIn(['en', 'ar'])
  locale?: 'en' | 'ar';
}
