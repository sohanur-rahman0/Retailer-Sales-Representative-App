import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRouteDto) {
    // Verify point exists
    const point = await this.prisma.point.findUnique({
      where: { id: dto.pointId },
    });
    if (!point) {
      throw new NotFoundException(`Point #${dto.pointId} not found`);
    }

    return this.prisma.route.create({
      data: dto,
      include: {
        point: {
          include: {
            territory: { include: { area: { include: { region: true } } } }
          }
        }
      },
    });
  }

  async findAll() {
    return this.prisma.route.findMany({
      include: {
        point: {
          include: {
            territory: { include: { area: { include: { region: true } } } }
          }
        },
        _count: { select: { retailers: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: {
        point: {
          include: {
            territory: { include: { area: { include: { region: true } } } }
          }
        },
        _count: { select: { retailers: true } },
      },
    });
    if (!route) throw new NotFoundException(`Route #${id} not found`);
    return route;
  }

  async update(id: number, dto: UpdateRouteDto) {
    await this.findOne(id);

    // Verify point exists if pointId is being updated
    if (dto.pointId) {
      const point = await this.prisma.point.findUnique({
        where: { id: dto.pointId },
      });
      if (!point) {
        throw new NotFoundException(`Point #${dto.pointId} not found`);
      }
    }

    return this.prisma.route.update({
      where: { id },
      data: dto,
      include: {
        point: {
          include: {
            territory: { include: { area: { include: { region: true } } } }
          }
        }
      },
    });
  }

  async remove(id: number) {
    const route = await this.findOne(id);

    // Check for child entities that would be orphaned
    const retailerCount = await this.prisma.retailer.count({
      where: { routeId: id },
    });

    if (retailerCount > 0) {
      throw new ConflictException(
        `Cannot delete route "${route.name}". Please remove the ${retailerCount} retailer(s) assigned to this route first.`
      );
    }

    return this.prisma.route.delete({ where: { id } });
  }
}
