import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRegionDto {
    @ApiPropertyOptional({ example: 'Dhaka Division' })
    @IsOptional()
    @IsString()
    name?: string;
}
