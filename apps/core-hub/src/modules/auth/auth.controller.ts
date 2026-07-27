import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@madinatyai/gateway';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { DeviceTokenService } from './device-token.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import type { AuthenticatedUser, JwtPayload } from './types/authenticated-user';
import type { AuthCookieDescriptor } from './auth.service';

/**
 * R-11 F-15 / F-16 — auth-cookie helper.
 *
 * Express's `Response.cookie(name, value, opts)` takes `maxAge` in ms (not
 * seconds) so we centralise the conversion + sameSite type cast here.
 */
function setAuthCookie(res: Response, cookie: AuthCookieDescriptor): void {
  res.cookie(cookie.name, cookie.value, {
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    path: cookie.path,
    domain: cookie.domain,
    maxAge: cookie.maxAgeSeconds * 1000,
  });
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly deviceTokens: DeviceTokenService,
  ) {}

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

  /**
   * Exchange a valid OTP for a JWT.
   *
   * R-11 F-15 — also sets the `madinaty.access` HTTP-only cookie. Body still
   * carries `token` for backward compat with FE clients and Playwright tests
   * that read the body during the cookie migration window.
   */
  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify the OTP and receive a JWT' })
  @AuditAction({ action: 'auth.verifyOtp', target: 'auth' })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.verifyOtp(dto.phoneNumber, dto.code);
    setAuthCookie(res, result.cookie);
    return { token: result.token, user: result.user };
  }

  /** Return the authenticated principal's profile + KYC status. */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated user' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.me(user.id);
  }

  /**
   * Check if the authenticated user is authorized to access a specific portal.
   * PLATFORM_ADMIN can access any portal. Other roles are checked against
   * a portal-to-role mapping.
   */
  @Get('check-portal/:portal')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if the current user can access a portal' })
  async checkPortal(
    @Param('portal') portal: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ allowed: boolean; portal: string; role: string }> {
    const allowed = await this.auth.checkPortalAccess(user.id, user.role, portal);
    return { allowed, portal, role: user.role };
  }

  /**
   * R-11 F-16 — revoke the current token + clear the cookie.
   *
   * The JwtAuthGuard already ran (this route is auth-bound), so the JTI + exp
   * claims are available on `request.tokenPayload`. We add the JTI to the
   * deny-list AND emit a cookie-deletion `Set-Cookie` so the browser drops
   * its copy too.
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke the current token and clear the auth cookie' })
  @AuditAction({ action: 'auth.logout', target: 'auth' })
  async logout(
    @Req() req: Request & { tokenPayload?: JwtPayload },
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const payload = req.tokenPayload;
    if (payload) {
      this.auth.revokeToken(payload.jti, payload.exp);
    }
    const del = this.auth.describeAuthCookieDelete();
    res.cookie(del.name, del.value, {
      httpOnly: del.httpOnly,
      secure: del.secure,
      sameSite: del.sameSite,
      path: del.path,
      domain: del.domain,
      maxAge: 0,
    });
  }

  /** Register an FCM push-notification device token. */
  @Post('device-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register an FCM device token for push notifications' })
  async registerDeviceToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterDeviceTokenDto,
  ): Promise<void> {
    await this.deviceTokens.register(user.id, dto.token, dto.platform, dto.appSlug);
  }

  /** Unregister an FCM device token (deactivate). */
  @Delete('device-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unregister an FCM device token' })
  async unregisterDeviceToken(@Body() body: { token: string }): Promise<void> {
    await this.deviceTokens.unregister(body.token);
  }
}
