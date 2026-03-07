import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'dev-secret-key',
            signOptions: {
                expiresIn: '15m', // Access token: 15 minutes
            },
        }),
        JwtModule.register({
            secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            signOptions: {
                expiresIn: '7d', // Refresh token: 7 days
            },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
    exports: [AuthService, JwtModule],
})
export class AuthModule { }
