import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@madinatyai/prisma';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { JtiDenyListService } from './jti-deny-list.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  OTP_DELIVERY_PROVIDER,
  type OtpDeliveryProvider,
} from './providers/otp-delivery.provider';
import { DevOtpDeliveryProvider } from './providers/dev-otp.provider';
import { StubSmsOtpDeliveryProvider } from './providers/sms-otp.provider';
import { WahaOtpDeliveryProvider } from './providers/waha-otp.provider';

/**
 * Phone + OTP authentication.
 *
 * `JwtAuthGuard` is exported so the AppModule can register it as a global
 * APP_GUARD (Phase A.2). Routes opt out with `@Public()`.
 *
 * The {@link OtpDeliveryProvider} is selected at boot:
 *   WAHA configured (baseUrl + apiKey) → WahaOtpDeliveryProvider (WhatsApp)
 *   NODE_ENV === 'production'         → StubSmsOtpDeliveryProvider (fails loud)
 *   otherwise                         → DevOtpDeliveryProvider (console log)
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
    JtiDenyListService,
    JwtAuthGuard,
    DevOtpDeliveryProvider,
    StubSmsOtpDeliveryProvider,
    WahaOtpDeliveryProvider,
    {
      provide: OTP_DELIVERY_PROVIDER,
      inject: [
        ConfigService,
        DevOtpDeliveryProvider,
        StubSmsOtpDeliveryProvider,
        WahaOtpDeliveryProvider,
      ],
      useFactory: (
        config: ConfigService,
        dev: DevOtpDeliveryProvider,
        sms: StubSmsOtpDeliveryProvider,
        waha: WahaOtpDeliveryProvider,
      ): OtpDeliveryProvider => {
        const wahaUrl = config.get<string>('waha.baseUrl');
        const wahaKey = config.get<string>('waha.apiKey');
        if (wahaUrl && wahaKey) {
          return waha;
        }
        return config.get<string>('nodeEnv') === 'production' ? sms : dev;
      },
    },
  ],
  exports: [AuthService, JwtAuthGuard, JtiDenyListService, JwtModule],
})
export class AuthModule {}
