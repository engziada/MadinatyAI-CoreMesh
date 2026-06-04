import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@madinatyai/prisma';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  OTP_DELIVERY_PROVIDER,
  type OtpDeliveryProvider,
} from './providers/otp-delivery.provider';
import { DevOtpDeliveryProvider } from './providers/dev-otp.provider';
import { StubSmsOtpDeliveryProvider } from './providers/sms-otp.provider';

/**
 * Phone + OTP authentication.
 *
 * `JwtAuthGuard` is exported so the AppModule can register it as a global
 * APP_GUARD (Phase A.2). Routes opt out with `@Public()`.
 *
 * The {@link OtpDeliveryProvider} is selected at boot:
 *   NODE_ENV !== 'production' → DevOtpDeliveryProvider (logs to console)
 *   NODE_ENV === 'production' → StubSmsOtpDeliveryProvider (refuses; swap before launch)
 */
@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('auth.jwtSecret'),
        signOptions: {
          expiresIn: config.get<string>('auth.jwtExpiresIn') ?? '7d',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    JwtAuthGuard,
    DevOtpDeliveryProvider,
    StubSmsOtpDeliveryProvider,
    {
      provide: OTP_DELIVERY_PROVIDER,
      inject: [ConfigService, DevOtpDeliveryProvider, StubSmsOtpDeliveryProvider],
      useFactory: (
        config: ConfigService,
        dev: DevOtpDeliveryProvider,
        sms: StubSmsOtpDeliveryProvider,
      ): OtpDeliveryProvider => {
        return config.get<string>('nodeEnv') === 'production' ? sms : dev;
      },
    },
  ],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
