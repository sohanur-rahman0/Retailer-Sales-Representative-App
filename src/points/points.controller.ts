import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PointsService } from './points.service';
import { CreatePointDto } from './dto/create-point.dto';
import { UpdatePointDto } from './dto/update-point.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Points')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a point' })
  create(@Body() dto: CreatePointDto) {
    return this.pointsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all points' })
  findAll() {
    return this.pointsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get point by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pointsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a point' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePointDto) {
    return this.pointsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a point' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pointsService.remove(id);
  }
}
