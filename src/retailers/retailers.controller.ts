import {
    Controller,
    Get,
    Patch,
    Param,
    Body,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { RetailersService } from './retailers.service';
import { QueryRetailersDto } from './dto/query-retailers.dto';
import { UpdateRetailerDto } from './dto/update-retailer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Retailers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('retailers')
export class RetailersController {
    constructor(private readonly retailersService: RetailersService) { }

    @Get()
    @ApiOperation({ summary: 'List retailers (paginated, filtered)' })
    @ApiResponse({ status: 200, description: 'Paginated list of retailers' })
    async findAll(
        @CurrentUser() user: any,
        @Query() query: QueryRetailersDto,
    ) {
        if (user.role === 'ADMIN') {
            return this.retailersService.findAll(query);
        }
        return this.retailersService.findAssigned(user.id, query);
    }

    @Get(':uid')
    @ApiOperation({ summary: 'Get retailer details by UID' })
    @ApiParam({ name: 'uid', description: 'Retailer UID' })
    @ApiResponse({ status: 200, description: 'Retailer details' })
    @ApiResponse({ status: 404, description: 'Retailer not found' })
    async findOne(@Param('uid') uid: string, @CurrentUser() user: any) {
        return this.retailersService.findByUid(uid, user.id, user.role);
    }

    @Patch(':uid')
    @ApiOperation({ summary: 'Update retailer allowed fields (points, routes, notes)' })
    @ApiParam({ name: 'uid', description: 'Retailer UID' })
    @ApiResponse({ status: 200, description: 'Retailer updated' })
    @ApiResponse({ status: 404, description: 'Retailer not found' })
    @ApiResponse({ status: 403, description: 'Not assigned to this retailer' })
    async update(
        @Param('uid') uid: string,
        @Body() updateDto: UpdateRetailerDto,
        @CurrentUser() user: any,
    ) {
        return this.retailersService.update(uid, updateDto, user.id, user.role);
    }
}
