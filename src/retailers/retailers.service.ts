import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { QueryRetailersDto } from './dto/query-retailers.dto';
import { UpdateRetailerDto } from './dto/update-retailer.dto';
import { Prisma } from '@prisma/client';

const RETAILER_CACHE_TTL = 300; // 5 minutes

@Injectable()
export class RetailersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
    ) { }

    async findAssigned(userId: number, query: QueryRetailersDto) {
        const { page = 1, limit = 20, search, region_id, area_id, distributor_id, territory_id } = query;
        const skip = (page - 1) * limit;

        // Create cache key with all parameters
        const cacheKey = `retailers:assigned:${userId}:${page}:${limit}:${search || ''}:${region_id || ''}:${area_id || ''}:${distributor_id || ''}:${territory_id || ''}`;

        // Try cache first
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        // Build where clause — only assigned retailers for this SR
        const where: Prisma.RetailerWhereInput = {
            assignments: {
                some: { salesRepId: userId },
            },
        };

        // Search by name, uid, or phone
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { uid: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Filters
        if (region_id) where.regionId = region_id;
        if (area_id) where.areaId = area_id;
        if (distributor_id) where.distributorId = distributor_id;
        if (territory_id) where.territoryId = territory_id;

        const [data, total] = await Promise.all([
            this.prisma.retailer.findMany({
                where,
                skip,
                take: limit,
                include: {
                    region: true,
                    area: true,
                    distributor: true,
                    territory: true,
                },
                orderBy: { name: 'asc' },
            }),
            this.prisma.retailer.count({ where }),
        ]);

        const result = {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };

        // Cache the result
        await this.redis.set(cacheKey, JSON.stringify(result), RETAILER_CACHE_TTL);

        return result;
    }

    async findAll(query: QueryRetailersDto) {
        const { page = 1, limit = 20, search, region_id, area_id, distributor_id, territory_id } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.RetailerWhereInput = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { uid: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (region_id) where.regionId = region_id;
        if (area_id) where.areaId = area_id;
        if (distributor_id) where.distributorId = distributor_id;
        if (territory_id) where.territoryId = territory_id;

        const [data, total] = await Promise.all([
            this.prisma.retailer.findMany({
                where,
                skip,
                take: limit,
                include: {
                    region: true,
                    area: true,
                    distributor: true,
                    territory: true,
                },
                orderBy: { name: 'asc' },
            }),
            this.prisma.retailer.count({ where }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findByUid(uid: string, userId?: number, userRole?: string) {
        const retailer = await this.prisma.retailer.findUnique({
            where: { uid },
            include: {
                region: true,
                area: true,
                distributor: true,
                territory: true,
            },
        });

        if (!retailer) {
            throw new NotFoundException(`Retailer with UID ${uid} not found`);
        }

        // For SR, verify assignment
        if (userRole === 'SR' && userId) {
            const isAssigned = await this.prisma.salesRepRetailer.findFirst({
                where: { salesRepId: userId, retailerId: retailer.id },
            });
            if (!isAssigned) {
                throw new ForbiddenException('You are not assigned to this retailer');
            }
        }

        return retailer;
    }

    async update(uid: string, updateDto: UpdateRetailerDto, userId?: number, userRole?: string) {
        const retailer = await this.prisma.retailer.findUnique({
            where: { uid },
        });

        if (!retailer) {
            throw new NotFoundException(`Retailer with UID ${uid} not found`);
        }

        // For SR, verify assignment
        if (userRole === 'SR' && userId) {
            const isAssigned = await this.prisma.salesRepRetailer.findFirst({
                where: { salesRepId: userId, retailerId: retailer.id },
            });
            if (!isAssigned) {
                throw new ForbiddenException('You are not assigned to this retailer');
            }
        }

        const updated = await this.prisma.retailer.update({
            where: { uid },
            data: {
                ...(updateDto.points !== undefined && { points: updateDto.points }),
                ...(updateDto.routes !== undefined && { routes: updateDto.routes }),
                ...(updateDto.notes !== undefined && { notes: updateDto.notes }),
            },
            include: {
                region: true,
                area: true,
                distributor: true,
                territory: true,
            },
        });

        return updated;
    }
}
