import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdminService', () => {
    let service: AdminService;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminService,
                {
                    provide: PrismaService,
                    useValue: {
                        user: {
                            findUnique: jest.fn(),
                            findMany: jest.fn(),
                        },
                        retailer: {
                            findMany: jest.fn(),
                            createMany: jest.fn(),
                        },
                        salesRepRetailer: {
                            createMany: jest.fn(),
                            deleteMany: jest.fn(),
                            findMany: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        service = module.get<AdminService>(AdminService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('bulkAssign', () => {
        it('should assign retailers to a sales rep', async () => {
            jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
                id: 1,
                role: 'SR',
            } as any);
            jest.spyOn(prisma.retailer, 'findMany').mockResolvedValue([
                { id: 1 },
                { id: 2 },
                { id: 3 },
            ] as any);
            jest.spyOn(prisma.salesRepRetailer, 'createMany').mockResolvedValue({
                count: 3,
            });

            const result = await service.bulkAssign({
                sales_rep_id: 1,
                retailer_ids: [1, 2, 3],
            });

            expect(result.assigned).toBe(3);
            expect(result.skippedDuplicates).toBe(0);
            expect(prisma.salesRepRetailer.createMany).toHaveBeenCalledWith({
                data: [
                    { salesRepId: 1, retailerId: 1 },
                    { salesRepId: 1, retailerId: 2 },
                    { salesRepId: 1, retailerId: 3 },
                ],
                skipDuplicates: true,
            });
        });

        it('should throw BadRequestException for invalid sales rep', async () => {
            jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

            await expect(
                service.bulkAssign({ sales_rep_id: 999, retailer_ids: [1] }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException for invalid retailer IDs', async () => {
            jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
                id: 1,
                role: 'SR',
            } as any);
            jest.spyOn(prisma.retailer, 'findMany').mockResolvedValue([{ id: 1 }] as any);

            await expect(
                service.bulkAssign({ sales_rep_id: 1, retailer_ids: [1, 999] }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should handle duplicate assignments gracefully', async () => {
            jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
                id: 1,
                role: 'SR',
            } as any);
            jest.spyOn(prisma.retailer, 'findMany').mockResolvedValue([
                { id: 1 },
                { id: 2 },
            ] as any);
            jest.spyOn(prisma.salesRepRetailer, 'createMany').mockResolvedValue({
                count: 1, // 1 new, 1 duplicate skipped
            });

            const result = await service.bulkAssign({
                sales_rep_id: 1,
                retailer_ids: [1, 2],
            });

            expect(result.assigned).toBe(1);
            expect(result.skippedDuplicates).toBe(1);
        });
    });

    describe('bulkUnassign', () => {
        it('should unassign retailers from a sales rep', async () => {
            jest.spyOn(prisma.salesRepRetailer, 'deleteMany').mockResolvedValue({
                count: 2,
            });

            const result = await service.bulkUnassign({
                sales_rep_id: 1,
                retailer_ids: [1, 2],
            });

            expect(result.unassigned).toBe(2);
        });
    });

    describe('importRetailersFromCsv', () => {
        it('should parse and import valid CSV data', async () => {
            const csvContent =
                'uid,name,phone,region_id,area_id,distributor_id,territory_id,points,routes\n' +
                'RTL-TEST-001,Test Shop,+8801700000001,1,1,1,1,100,Route-A\n' +
                'RTL-TEST-002,Test Shop 2,+8801700000002,1,1,1,1,200,Route-B';

            const buffer = Buffer.from(csvContent, 'utf-8');

            jest.spyOn(prisma.retailer, 'createMany').mockResolvedValue({ count: 2 });

            const result = await service.importRetailersFromCsv(buffer);

            expect(result.imported).toBe(2);
            expect(prisma.retailer.createMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skipDuplicates: true,
                }),
            );
        });

        it('should throw BadRequestException for missing columns', async () => {
            const csvContent = 'name,phone\nTest Shop,+8801700000001';
            const buffer = Buffer.from(csvContent, 'utf-8');

            await expect(service.importRetailersFromCsv(buffer)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw BadRequestException for empty CSV', async () => {
            const buffer = Buffer.from('', 'utf-8');

            await expect(service.importRetailersFromCsv(buffer)).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('getSalesReps', () => {
        it('should return list of sales reps', async () => {
            const mockSRs = [
                { id: 1, username: 'sr1', name: 'SR One', phone: '+880', _count: { assignments: 70 } },
            ];
            jest.spyOn(prisma.user, 'findMany').mockResolvedValue(mockSRs as any);

            const result = await service.getSalesReps();
            expect(result).toEqual(mockSRs);
            expect(prisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { role: 'SR' },
                }),
            );
        });
    });
});
