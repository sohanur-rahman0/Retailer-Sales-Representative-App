import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString, Min } from 'class-validator';

export class UpdateRetailerDto {
    @ApiPropertyOptional({ description: 'Retailer loyalty points', example: 150 })
    @IsOptional()
    @IsInt()
    @Min(0)
    points?: number;

    @ApiPropertyOptional({ description: 'Delivery routes', example: 'Route A, Route B' })
    @IsOptional()
    @IsString()
    routes?: string;

    @ApiPropertyOptional({ description: 'Additional notes', example: 'Prefers morning delivery' })
    @IsOptional()
    @IsString()
    notes?: string;
}
