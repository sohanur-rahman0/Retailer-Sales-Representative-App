import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { RetailersService } from './retailers.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('RetailersService', () => {
    let service: RetailersService;
    let prisma: PrismaService;
    let redis: RedisService;

    const mockRetailer = {
        id: 1,
        uid: 'RTL-000001',
        name: 'Test Retailer',
        phone: '+8801700000001',
        regionId: 1,
        areaId: 1,
        distributorId: 1,
        territoryId: 1,
        pointId: 1,
        routeId: 1,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        region: { id: 1, name: 'Dhaka' },
        area: { id: 1, name: 'Dhaka North', regionId: 1 },
        distributor: { id: 1, name: 'Alpha Distribution' },
        territory: { id: 1, name: 'Dhaka North Zone-1', areaId: 1 },
        point: {
            id: 1,
            name: 'Downtown Point',
            territoryId: 1,
            territory: { id: 1, name: 'Dhaka North Zone-1', areaId: 1 }
        },
        route: {
            id: 1,
            name: 'Morning Route',
            pointId: 1,
            point: { id: 1, name: 'Downtown Point', territoryId: 1 }
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RetailersService,
                {
                    provide: PrismaService,
                    useValue: {
                        retailer: {
                            findMany: jest.fn(),
                            findUnique: jest.fn(),
                            count: jest.fn(),
                            update: jest.fn(),
                        },
                        salesRepRetailer: {
                            findFirst: jest.fn(),
                        },
                    },
                },
                {
                    provide: RedisService,
                    useValue: {
                        get: jest.fn().mockResolvedValue(null),
                        set: jest.fn().mockResolvedValue(undefined),
                        del: jest.fn().mockResolvedValue(undefined),
                    },
                },
            ],
        }).compile();

        service = module.get<RetailersService>(RetailersService);
        prisma = module.get<PrismaService>(PrismaService);
        redis = module.get<RedisService>(RedisService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAssigned', () => {
        it('should return paginated assigned retailers for an SR', async () => {
            jest.spyOn(prisma.retailer, 'findMany').mockResolvedValue([mockRetailer] as any);
            jest.spyOn(prisma.retailer, 'count').mockResolvedValue(1);

            const result = await service.findAssigned(1, { page: 1, limit: 20 });

            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(1);
            expect(result.meta.page).toBe(1);
            expect(result.meta.totalPages).toBe(1);
            expect(prisma.retailer.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        assignments: { some: { salesRepId: 1 } },
                    }),
                    skip: 0,
                    take: 20,
                }),
            );
        });

        it('should apply search and filters', async () => {
            jest.spyOn(prisma.retailer, 'findMany').mockResolvedValue([]);
            jest.spyOn(prisma.retailer, 'count').mockResolvedValue(0);

            await service.findAssigned(1, {
                page: 1,
                limit: 20,
                search: 'Test',
                region_id: 1,
                area_id: 2,
            });

            expect(prisma.retailer.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        assignments: { some: { salesRepId: 1 } },
                        regionId: 1,
                        areaId: 2,
                        OR: expect.arrayContaining([
                            expect.objectContaining({ name: { contains: 'Test', mode: 'insensitive' } }),
                        ]),
                    }),
                }),
            );
        });

        it('should cache results and return from cache on subsequent calls', async () => {
            const mockResult = {
                data: [mockRetailer],
                meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
            };

            // First call - should cache
            jest.spyOn(prisma.retailer, 'findMany').mockResolvedValue([mockRetailer]);
            jest.spyOn(prisma.retailer, 'count').mockResolvedValue(1);
            jest.spyOn(redis, 'set').mockResolvedValue();

            const result1 = await service.findAssigned(1, { page: 1, limit: 20 });

            expect(result1).toEqual(mockResult);
            expect(redis.set).toHaveBeenCalled();

            // Second call - should return from cache (JSON.parse converts dates to strings)
            const cachedResult = JSON.parse(JSON.stringify(mockResult)); // Simulate JSON storage
            jest.spyOn(redis, 'get').mockResolvedValue(JSON.stringify(cachedResult));

            const result2 = await service.findAssigned(1, { page: 1, limit: 20 });

            expect(result2).toEqual(cachedResult);
            expect(prisma.retailer.findMany).toHaveBeenCalledTimes(1); // Only called once
        });
    });

    describe('findByUid', () => {
        it('should return retailer from database', async () => {
            jest.spyOn(prisma.retailer, 'findUnique').mockResolvedValue(mockRetailer as any);

            const result = await service.findByUid('RTL-000001', undefined, 'ADMIN');

            expect(result).toEqual(mockRetailer);
            expect(prisma.retailer.findUnique).toHaveBeenCalledWith({
                where: { uid: 'RTL-000001' },
                include: {
                    region: true,
                    area: true,
                    distributor: true,
                    territory: true,
                },
            });
        });

        it('should throw NotFoundException for invalid UID', async () => {
            jest.spyOn(prisma.retailer, 'findUnique').mockResolvedValue(null);

            await expect(service.findByUid('INVALID', undefined, 'ADMIN')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw ForbiddenException if SR is not assigned', async () => {
            jest.spyOn(prisma.retailer, 'findUnique').mockResolvedValue(mockRetailer as any);
            jest.spyOn(prisma.salesRepRetailer, 'findFirst').mockResolvedValue(null);

            await expect(service.findByUid('RTL-000001', 99, 'SR')).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('update', () => {
        it('should update only allowed fields', async () => {
            jest.spyOn(prisma.retailer, 'findUnique').mockResolvedValue(mockRetailer as any);
            const updatedRetailer = { ...mockRetailer, pointId: 2, notes: 'Updated notes' };
            jest.spyOn(prisma.retailer, 'update').mockResolvedValue(updatedRetailer as any);

            const result = await service.update(
                'RTL-000001',
                { pointId: 2, notes: 'Updated notes' },
                undefined,
                'ADMIN',
            );

            expect(result.pointId).toBe(2);
            expect(result.notes).toBe('Updated notes');
        });

        it('should throw NotFoundException for invalid UID', async () => {
            jest.spyOn(prisma.retailer, 'findUnique').mockResolvedValue(null);

            await expect(
                service.update('INVALID', { pointId: 1 }, undefined, 'ADMIN'),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
