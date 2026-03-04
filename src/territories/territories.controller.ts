import {
    Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TerritoriesService } from './territories.service';
import { CreateTerritoryDto } from './dto/create-territory.dto';
import { UpdateTerritoryDto } from './dto/update-territory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Territories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/territories')
export class TerritoriesController {
    constructor(private readonly territoriesService: TerritoriesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a territory' })
    create(@Body() dto: CreateTerritoryDto) {
        return this.territoriesService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'List all territories' })
    findAll() {
        return this.territoriesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get territory by ID' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.territoriesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a territory' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTerritoryDto) {
        return this.territoriesService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a territory' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.territoriesService.remove(id);
    }
}
