import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '@madinatyai/prisma';
import { CreateUserDto } from './dto/create-user.dto';

/** Shared identity endpoints (core schema, tenant-agnostic). */
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.prisma.globalUser.create({
      data: {
        phoneNumber: dto.phoneNumber,
        role: (dto.role as Role) ?? Role.USER,
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const user = await this.prisma.globalUser.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`GlobalUser ${id} not found`);
    }
    return user;
  }
}
