import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@Injectable()
export class RegionsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateRegionDto) {
        return this.prisma.region.create({ data: dto });
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
        return this.prisma.region.update({ where: { id }, data: dto });
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
            const errors = [];
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
