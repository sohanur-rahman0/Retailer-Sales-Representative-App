import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryRetailersDto {
    @ApiPropertyOptional({ description: 'Search by name, UID, or phone', example: 'Rahim' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Filter by region ID' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    region_id?: number;

    @ApiPropertyOptional({ description: 'Filter by area ID' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    area_id?: number;

    @ApiPropertyOptional({ description: 'Filter by distributor ID' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    distributor_id?: number;

    @ApiPropertyOptional({ description: 'Filter by territory ID' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    territory_id?: number;

    @ApiPropertyOptional({ description: 'Page number', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Items per page', default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}
