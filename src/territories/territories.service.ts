import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTerritoryDto } from './dto/create-territory.dto';
import { UpdateTerritoryDto } from './dto/update-territory.dto';

@Injectable()
export class TerritoriesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateTerritoryDto) {
        return this.prisma.territory.create({
            data: dto,
            include: { area: { include: { region: true } } },
        });
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
        return this.prisma.territory.update({
            where: { id },
            data: dto,
            include: { area: { include: { region: true } } },
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.prisma.territory.delete({ where: { id } });
    }
}
