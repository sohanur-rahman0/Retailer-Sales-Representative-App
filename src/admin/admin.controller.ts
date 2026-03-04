import {
    Controller,
    Post,
    Delete,
    Get,
    Body,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    ParseIntPipe,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { BulkAssignDto } from './dto/bulk-assign.dto';
import { BulkUnassignDto } from './dto/bulk-unassign.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Post('assignments/bulk')
    @ApiOperation({ summary: 'Bulk assign retailers to a sales rep' })
    bulkAssign(@Body() dto: BulkAssignDto) {
        return this.adminService.bulkAssign(dto);
    }

    @Delete('assignments/bulk')
    @ApiOperation({ summary: 'Bulk unassign retailers from a sales rep' })
    bulkUnassign(@Body() dto: BulkUnassignDto) {
        return this.adminService.bulkUnassign(dto);
    }

    @Post('retailers/import')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Import retailers from CSV file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary', description: 'CSV file' },
            },
        },
    })
    async importRetailers(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('CSV file is required');
        }
        if (!file.originalname.endsWith('.csv')) {
            throw new BadRequestException('File must be a CSV');
        }
        return this.adminService.importRetailersFromCsv(file.buffer);
    }

    @Get('sales-reps')
    @ApiOperation({ summary: 'List all sales reps with assignment counts' })
    getSalesReps() {
        return this.adminService.getSalesReps();
    }

    @Get('assignments/:salesRepId')
    @ApiOperation({ summary: 'Get assignments for a sales rep' })
    getAssignments(@Param('salesRepId', ParseIntPipe) salesRepId: number) {
        return this.adminService.getAssignments(salesRepId);
    }
}
