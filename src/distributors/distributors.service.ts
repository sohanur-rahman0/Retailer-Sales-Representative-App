import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDistributorDto } from './dto/create-distributor.dto';
import { UpdateDistributorDto } from './dto/update-distributor.dto';

@Injectable()
export class DistributorsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateDistributorDto) {
        return this.prisma.distributor.create({ data: dto });
    }

    async findAll() {
        return this.prisma.distributor.findMany({
            include: { _count: { select: { retailers: true } } },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: number) {
        const distributor = await this.prisma.distributor.findUnique({
            where: { id },
            include: { _count: { select: { retailers: true } } },
        });
        if (!distributor) throw new NotFoundException(`Distributor #${id} not found`);
        return distributor;
    }

    async update(id: number, dto: UpdateDistributorDto) {
        await this.findOne(id);
        return this.prisma.distributor.update({ where: { id }, data: dto });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.prisma.distributor.delete({ where: { id } });
    }
}
