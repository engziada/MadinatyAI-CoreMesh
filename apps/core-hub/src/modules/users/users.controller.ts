import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '@madinatyai/prisma';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CreateUserDto } from './dto/create-user.dto';

/** Shared identity endpoints (core schema, tenant-agnostic). */
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Legacy direct-create endpoint kept Public for compatibility with seed
   * scripts and the existing e2e tests. Real user signup now flows through
   * `POST /auth/register` (phone + OTP) — prefer that.
   */
  @Public()
  @Post()
  @ApiOperation({ summary: '[Legacy] Create a GlobalUser directly. Prefer /auth/register.' })
  create(@Body() dto: CreateUserDto) {
    return this.prisma.globalUser.create({
      data: {
        phoneNumber: dto.phoneNumber,
        role: (dto.role as Role) ?? Role.USER,
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  /** Authenticated principal's KYC status — drives the verified chip on FE. */
  @Get('me/kyc-status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current user\'s KYC status' })
  async myKycStatus(@CurrentUser() user: AuthenticatedUser) {
    const kyc = await this.prisma.kycRegistry.findUnique({
      where: { userId: user.id },
      select: {
        status: true,
        reviewedAt: true,
        createdAt: true,
      },
    });
    const globalUser = await this.prisma.globalUser.findUnique({
      where: { id: user.id },
      select: { isVerified: true },
    });
    return {
      isVerified: globalUser?.isVerified ?? false,
      status: kyc?.status ?? 'NOT_SUBMITTED',
      submittedAt: kyc?.createdAt ?? null,
      reviewedAt: kyc?.reviewedAt ?? null,
    };
  }

  @Get(':id')
  @ApiBearerAuth()
  async get(@Param('id') id: string) {
    const user = await this.prisma.globalUser.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`GlobalUser ${id} not found`);
    }
    return user;
  }
}
