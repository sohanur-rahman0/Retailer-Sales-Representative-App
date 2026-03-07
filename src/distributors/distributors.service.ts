import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateDistributorDto } from './dto/create-distributor.dto';
import { UpdateDistributorDto } from './dto/update-distributor.dto';

@Injectable()
export class DistributorsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateDistributorDto) {
        try {
            return await this.prisma.distributor.create({ data: dto });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException(`Distributor with name "${dto.name}" already exists`);
            }
            throw error;
        }
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
        try {
            return await this.prisma.distributor.update({ where: { id }, data: dto });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException(`Distributor with name "${dto.name}" already exists`);
            }
            throw error;
        }
    }

    async remove(id: number) {
        const distributor = await this.findOne(id);

        // Check for child entities that would be orphaned
        const retailerCount = await this.prisma.retailer.count({
            where: { distributorId: id },
        });

        if (retailerCount > 0) {
            throw new ConflictException(
                `Cannot delete distributor "${distributor.name}". Please remove the ${retailerCount} retailer(s) assigned to this distributor first.`
            );
        }

        return this.prisma.distributor.delete({ where: { id } });
    }
}
