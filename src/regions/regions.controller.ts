import {
    Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Regions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/regions')
export class RegionsController {
    constructor(private readonly regionsService: RegionsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a region' })
    create(@Body() dto: CreateRegionDto) {
        return this.regionsService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'List all regions' })
    findAll() {
        return this.regionsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get region by ID' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.regionsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a region' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRegionDto) {
        return this.regionsService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a region' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.regionsService.remove(id);
    }
}
