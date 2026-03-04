import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

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
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeAll(async () => {
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
                        },
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue('mock-jwt-token'),
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
        it('should return access token on valid credentials', async () => {
            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

            const result = await authService.login({
                username: 'testuser',
                password: 'password123',
            });

            expect(result).toHaveProperty('access_token', 'mock-jwt-token');
            expect(result.user).toEqual({
                id: 1,
                username: 'testuser',
                name: 'Test User',
                role: 'SR',
            });
            expect(jwtService.sign).toHaveBeenCalledWith({
                sub: 1,
                username: 'testuser',
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
});
