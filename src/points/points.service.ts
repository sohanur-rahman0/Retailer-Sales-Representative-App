import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePointDto } from './dto/create-point.dto';
import { UpdatePointDto } from './dto/update-point.dto';

@Injectable()
export class PointsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePointDto) {
    // Verify territory exists
    const territory = await this.prisma.territory.findUnique({
      where: { id: dto.territoryId },
    });
    if (!territory) {
      throw new NotFoundException(`Territory #${dto.territoryId} not found`);
    }

    return this.prisma.point.create({
      data: dto,
      include: { territory: { include: { area: { include: { region: true } } } } },
    });
  }

  async findAll() {
    return this.prisma.point.findMany({
      include: {
        territory: { include: { area: { include: { region: true } } } },
        _count: { select: { routes: true, retailers: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const point = await this.prisma.point.findUnique({
      where: { id },
      include: {
        territory: { include: { area: { include: { region: true } } } },
        routes: true,
        _count: { select: { retailers: true } },
      },
    });
    if (!point) throw new NotFoundException(`Point #${id} not found`);
    return point;
  }

  async update(id: number, dto: UpdatePointDto) {
    await this.findOne(id);

    // Verify territory exists if territoryId is being updated
    if (dto.territoryId) {
      const territory = await this.prisma.territory.findUnique({
        where: { id: dto.territoryId },
      });
      if (!territory) {
        throw new NotFoundException(`Territory #${dto.territoryId} not found`);
      }
    }

    return this.prisma.point.update({
      where: { id },
      data: dto,
      include: { territory: { include: { area: { include: { region: true } } } } },
    });
  }

  async remove(id: number) {
    const point = await this.findOne(id);

    // Check for child entities that would be orphaned
    const routeCount = await this.prisma.route.count({
      where: { pointId: id },
    });

    const retailerCount = await this.prisma.retailer.count({
      where: { pointId: id },
    });

    if (routeCount > 0 || retailerCount > 0) {
      const errors: string[] = [];
      if (routeCount > 0) {
        errors.push(`${routeCount} route(s) assigned to this point`);
      }
      if (retailerCount > 0) {
        errors.push(`${retailerCount} retailer(s) assigned to this point`);
      }
      throw new ConflictException(
        `Cannot delete point "${point.name}". Please remove the following dependencies first: ${errors.join(', ')}.`
      );
    }

    return this.prisma.point.delete({ where: { id } });
  }
}
