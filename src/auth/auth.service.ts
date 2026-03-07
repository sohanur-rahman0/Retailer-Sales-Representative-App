import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { TokensDto } from './dto/tokens.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    // Token expiration times 
    private readonly ACCESS_TOKEN_EXPIRATION = '15m';  // 15 minutes
    private readonly REFRESH_TOKEN_EXPIRATION = '7d';  // 7 days

    async login(loginDto: LoginDto): Promise<TokensDto> {
        const user = await this.prisma.user.findUnique({
            where: { username: loginDto.username },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(
            loginDto.password,
            user.passwordHash,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate both access and refresh tokens
        const tokens = await this.generateTokens(user.id, user.username, user.role);

        // Store refresh token securely
        await this.updateRefreshToken(user.id, tokens.refresh_token);

        return {
            ...tokens,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
            },
        };
    }

    async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<TokensDto> {
        try {
            // Verify the refresh token
            const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            });

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user || !user.refreshTokenHash) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Verify the refresh token matches the stored hash
            const isRefreshTokenValid = await bcrypt.compare(
                refreshTokenDto.refreshToken,
                user.refreshTokenHash,
            );

            if (!isRefreshTokenValid) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Check if refresh token is expired
            if (user.refreshTokenExp && user.refreshTokenExp < new Date()) {
                throw new UnauthorizedException('Refresh token expired');
            }

            // Generate new tokens
            const tokens = await this.generateTokens(user.id, user.username, user.role);

            // Update refresh token (rotate it)
            await this.updateRefreshToken(user.id, tokens.refresh_token);

            return {
                ...tokens,
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    role: user.role,
                },
            };
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async logout(userId: number): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                refreshTokenHash: null,
                refreshTokenExp: null,
            },
        });
    }

    async validateUser(userId: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return user;
    }

    private async generateTokens(userId: number, username: string, role: string) {
        const payload = { sub: userId, username, role };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                expiresIn: this.ACCESS_TOKEN_EXPIRATION,
                secret: process.env.JWT_SECRET,
            }),
            this.jwtService.signAsync(payload, {
                expiresIn: this.REFRESH_TOKEN_EXPIRATION,
                secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            }),
        ]);

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }

    private async updateRefreshToken(userId: number, refreshToken: string) {
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        const refreshTokenExp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                refreshTokenHash,
                refreshTokenExp,
            },
        });
    }
}
