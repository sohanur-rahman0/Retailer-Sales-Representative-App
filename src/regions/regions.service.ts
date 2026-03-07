import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@Injectable()
export class RegionsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateRegionDto) {
        try {
            return await this.prisma.region.create({ data: dto });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException(`Region with name "${dto.name}" already exists`);
            }
            throw error;
        }
    }

    async findAll() {
        return this.prisma.region.findMany({
            include: { _count: { select: { areas: true, retailers: true } } },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: number) {
        const region = await this.prisma.region.findUnique({
            where: { id },
            include: { areas: true, _count: { select: { retailers: true } } },
        });
        if (!region) throw new NotFoundException(`Region #${id} not found`);
        return region;
    }

    async update(id: number, dto: UpdateRegionDto) {
        await this.findOne(id);
        try {
            return await this.prisma.region.update({ where: { id }, data: dto });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException(`Region with name "${dto.name}" already exists`);
            }
            throw error;
        }
    }

    async remove(id: number) {
        const region = await this.findOne(id);

        // Check for child entities that would be orphaned
        const areaCount = await this.prisma.area.count({
            where: { regionId: id },
        });

        const retailerCount = await this.prisma.retailer.count({
            where: { regionId: id },
        });

        if (areaCount > 0 || retailerCount > 0) {
            const errors: string[] = [];
            if (areaCount > 0) {
                errors.push(`${areaCount} area(s) assigned to this region`);
            }
            if (retailerCount > 0) {
                errors.push(`${retailerCount} retailer(s) assigned to this region`);
            }
            throw new ConflictException(
                `Cannot delete region "${region.name}". Please remove the following dependencies first: ${errors.join(', ')}.`
            );
        }

        return this.prisma.region.delete({ where: { id } });
    }
}
