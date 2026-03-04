import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt } from 'class-validator';

export class UpdateTerritoryDto {
    @ApiPropertyOptional({ example: 'Mirpur-12' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ example: 2 })
    @IsOptional()
    @IsInt()
    areaId?: number;
}
