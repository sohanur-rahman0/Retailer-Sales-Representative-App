import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { TokensDto } from './dto/tokens.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
    let authService: AuthService;
    let prismaService: PrismaService;
    let jwtService: JwtService;

    const mockUser = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        phone: '+8801700000001',
        passwordHash: '',
        role: 'SR' as const,
        refreshTokenHash: null,
        refreshTokenExp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeAll(async () => {
        // Mock bcrypt.hash for initial setup
        mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);
        mockUser.passwordHash = await bcrypt.hash('password123', 10);
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: PrismaService,
                    useValue: {
                        user: {
                            findUnique: jest.fn(),
                            update: jest.fn(),
                        },
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue('mock-jwt-token'),
                        signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
                        verify: jest.fn(),
                    },
                },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        prismaService = module.get<PrismaService>(PrismaService);
        jwtService = module.get<JwtService>(JwtService);
    });

    it('should be defined', () => {
        expect(authService).toBeDefined();
    });

    describe('login', () => {
        it('should return access and refresh tokens on valid credentials', async () => {
            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
            jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockUser as any);
            // Mock bcrypt.compare to return true for valid password
            mockedBcrypt.compare.mockResolvedValueOnce(true as never);

            const result = await authService.login({
                username: 'testuser',
                password: 'password123',
            });

            expect(result).toHaveProperty('access_token', 'mock-jwt-token');
            expect(result).toHaveProperty('refresh_token', 'mock-jwt-token');
            expect(result.user).toEqual({
                id: 1,
                username: 'testuser',
                name: 'Test User',
                role: 'SR',
            });
        });

        it('should throw UnauthorizedException on invalid username', async () => {
            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

            await expect(
                authService.login({ username: 'wronguser', password: 'password123' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException on invalid password', async () => {
            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

            await expect(
                authService.login({ username: 'testuser', password: 'wrongpassword' }),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('validateUser', () => {
        it('should return user if found', async () => {
            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
            const result = await authService.validateUser(1);
            expect(result).toEqual(mockUser);
        });

        it('should throw UnauthorizedException if user not found', async () => {
            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
            await expect(authService.validateUser(999)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('refreshTokens', () => {
        const mockRefreshTokenDto: RefreshTokenDto = {
            refreshToken: 'valid-refresh-token',
        };

        const mockUserWithRefreshToken = {
            ...mockUser,
            refreshTokenHash: 'hashed-refresh-token',
            refreshTokenExp: new Date(Date.now() + 24 * 60 * 60 * 1000), // Future date
        };

        it('should return new tokens on valid refresh token', async () => {
            jest.spyOn(jwtService, 'verify').mockReturnValue({
                sub: 1,
                username: 'testuser',
                role: 'SR',
            });
            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUserWithRefreshToken as any);
            jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockUserWithRefreshToken as any);
            // Mock bcrypt.compare to return true for valid refresh token
            mockedBcrypt.compare.mockResolvedValue(true as never);

            const result = await authService.refreshTokens(mockRefreshTokenDto);

            expect(result).toHaveProperty('access_token');
            expect(result).toHaveProperty('refresh_token');
            expect(result.user).toEqual({
                id: 1,
                username: 'testuser',
                name: 'Test User',
                role: 'SR',
            });
        });

        it('should throw UnauthorizedException on invalid refresh token', async () => {
            jest.spyOn(jwtService, 'verify').mockImplementation(() => {
                throw new Error('Invalid token');
            });

            await expect(
                authService.refreshTokens(mockRefreshTokenDto)
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when user not found', async () => {
            jest.spyOn(jwtService, 'verify').mockReturnValue({
                sub: 999,
                username: 'testuser',
                role: 'SR',
            });
            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

            await expect(
                authService.refreshTokens(mockRefreshTokenDto)
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when refresh token expired', async () => {
            const expiredUser = {
                ...mockUserWithRefreshToken,
                refreshTokenExp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Past date
            };

            jest.spyOn(jwtService, 'verify').mockReturnValue({
                sub: 1,
                username: 'testuser',
                role: 'SR',
            });
            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(expiredUser as any);

            await expect(
                authService.refreshTokens(mockRefreshTokenDto)
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('logout', () => {
        it('should clear refresh token for user', async () => {
            const mockUpdate = jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockUser as any);

            await authService.logout(1);

            expect(mockUpdate).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    refreshTokenHash: null,
                    refreshTokenExp: null,
                },
            });
        });
    });

    describe('generateTokens', () => {
        it('should generate access and refresh tokens', async () => {
            const result = await (authService as any).generateTokens(1, 'testuser', 'SR');

            expect(result).toHaveProperty('access_token', 'mock-jwt-token');
            expect(result).toHaveProperty('refresh_token', 'mock-jwt-token');
            expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
        });
    });

    describe('updateRefreshToken', () => {
        it('should hash and store refresh token', async () => {
            const mockUpdate = jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockUser as any);

            await (authService as any).updateRefreshToken(1, 'refresh-token');

            expect(mockUpdate).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    refreshTokenHash: expect.any(String), // Should be hashed
                    refreshTokenExp: expect.any(Date),
                },
            });
        });
    });
});
