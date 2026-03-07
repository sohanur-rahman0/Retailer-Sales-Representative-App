import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@Injectable()
export class AreasService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateAreaDto) {
        try {
            return await this.prisma.area.create({
                data: dto,
                include: { region: true },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException(`Area with this name already exists in the selected region`);
            }
            throw error;
        }
    }

    async findAll() {
        return this.prisma.area.findMany({
            include: { region: true, _count: { select: { territories: true, retailers: true } } },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: number) {
        const area = await this.prisma.area.findUnique({
            where: { id },
            include: { region: true, territories: true },
        });
        if (!area) throw new NotFoundException(`Area #${id} not found`);
        return area;
    }

    async update(id: number, dto: UpdateAreaDto) {
        await this.findOne(id);
        try {
            return await this.prisma.area.update({
                where: { id },
                data: dto,
                include: { region: true },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException(`Area with this name already exists in the selected region`);
            }
            throw error;
        }
    }

    async remove(id: number) {
        const area = await this.findOne(id);

        // Check for child entities that would be orphaned
        const territoryCount = await this.prisma.territory.count({
            where: { areaId: id },
        });

        const retailerCount = await this.prisma.retailer.count({
            where: { areaId: id },
        });

        if (territoryCount > 0 || retailerCount > 0) {
            const errors: string[] = [];
            if (territoryCount > 0) {
                errors.push(`${territoryCount} territor(ies) assigned to this area`);
            }
            if (retailerCount > 0) {
                errors.push(`${retailerCount} retailer(s) assigned to this area`);
            }
            throw new ConflictException(
                `Cannot delete area "${area.name}". Please remove the following dependencies first: ${errors.join(', ')}.`
            );
        }

        return this.prisma.area.delete({ where: { id } });
    }
}
