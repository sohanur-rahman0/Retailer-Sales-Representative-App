import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt } from 'class-validator';

export class UpdateRetailerDto {
    @ApiPropertyOptional({ description: 'Point ID this retailer belongs to', example: 1 })
    @IsOptional()
    @IsInt()
    pointId?: number;

    @ApiPropertyOptional({ description: 'Route ID this retailer belongs to', example: 1 })
    @IsOptional()
    @IsInt()
    routeId?: number;

    @ApiPropertyOptional({ description: 'Additional notes', example: 'Prefers morning delivery' })
    @IsOptional()
    notes?: string;
}
