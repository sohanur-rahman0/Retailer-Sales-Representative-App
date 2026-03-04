import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@Injectable()
export class AreasService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateAreaDto) {
        return this.prisma.area.create({
            data: dto,
            include: { region: true },
        });
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
        return this.prisma.area.update({
            where: { id },
            data: dto,
            include: { region: true },
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.prisma.area.delete({ where: { id } });
    }
}
