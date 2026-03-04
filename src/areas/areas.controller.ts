import {
    Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Areas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/areas')
export class AreasController {
    constructor(private readonly areasService: AreasService) { }

    @Post()
    @ApiOperation({ summary: 'Create an area' })
    create(@Body() dto: CreateAreaDto) {
        return this.areasService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'List all areas' })
    findAll() {
        return this.areasService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get area by ID' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.areasService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an area' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAreaDto) {
        return this.areasService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an area' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.areasService.remove(id);
    }
}
