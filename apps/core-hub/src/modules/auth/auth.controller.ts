import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@madinatyai/gateway';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import type { AuthenticatedUser } from './types/authenticated-user';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Create a GlobalUser (if absent) and dispatch a REGISTER OTP. */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register by phone — sends an OTP' })
  @AuditAction({ action: 'auth.register', target: 'auth' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.phoneNumber);
  }

  /** Re-issue an OTP for an existing user. */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a fresh OTP for an existing phone' })
  @AuditAction({ action: 'auth.login', target: 'auth' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.phoneNumber);
  }

  /** Exchange a valid OTP for a JWT. */
  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify the OTP and receive a JWT' })
  @AuditAction({ action: 'auth.verifyOtp', target: 'auth' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto.phoneNumber, dto.code);
  }

  /** Return the authenticated principal's profile + KYC status. */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated user' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.me(user.id);
  }
}
