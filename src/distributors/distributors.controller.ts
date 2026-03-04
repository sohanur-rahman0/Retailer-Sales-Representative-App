import {
    Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DistributorsService } from './distributors.service';
import { CreateDistributorDto } from './dto/create-distributor.dto';
import { UpdateDistributorDto } from './dto/update-distributor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Distributors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/distributors')
export class DistributorsController {
    constructor(private readonly distributorsService: DistributorsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a distributor' })
    create(@Body() dto: CreateDistributorDto) {
        return this.distributorsService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'List all distributors' })
    findAll() {
        return this.distributorsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get distributor by ID' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.distributorsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a distributor' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDistributorDto) {
        return this.distributorsService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a distributor' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.distributorsService.remove(id);
    }
}
