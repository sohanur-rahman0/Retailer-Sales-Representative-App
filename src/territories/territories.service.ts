import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateTerritoryDto } from './dto/create-territory.dto';
import { UpdateTerritoryDto } from './dto/update-territory.dto';

@Injectable()
export class TerritoriesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateTerritoryDto) {
        try {
            return await this.prisma.territory.create({
                data: dto,
                include: { area: { include: { region: true } } },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException(`Territory with this name already exists in the selected area`);
            }
            throw error;
        }
    }

    async findAll() {
        return this.prisma.territory.findMany({
            include: {
                area: { include: { region: true } },
                _count: { select: { retailers: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: number) {
        const territory = await this.prisma.territory.findUnique({
            where: { id },
            include: {
                area: { include: { region: true } },
                _count: { select: { retailers: true } },
            },
        });
        if (!territory) throw new NotFoundException(`Territory #${id} not found`);
        return territory;
    }

    async update(id: number, dto: UpdateTerritoryDto) {
        await this.findOne(id);
        try {
            return await this.prisma.territory.update({
                where: { id },
                data: dto,
                include: { area: { include: { region: true } } },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException(`Territory with this name already exists in the selected area`);
            }
            throw error;
        }
    }

    async remove(id: number) {
        const territory = await this.findOne(id);

        // Check for child entities that would be orphaned
        const retailerCount = await this.prisma.retailer.count({
            where: { territoryId: id },
        });

        if (retailerCount > 0) {
            throw new ConflictException(
                `Cannot delete territory "${territory.name}". Please remove the ${retailerCount} retailer(s) assigned to this territory first.`
            );
        }

        return this.prisma.territory.delete({ where: { id } });
    }
}
