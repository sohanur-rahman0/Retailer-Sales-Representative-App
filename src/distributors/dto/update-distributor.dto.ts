import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateDistributorDto {
    @ApiPropertyOptional({ example: 'XYZ Distribution Ltd' })
    @IsOptional()
    @IsString()
    name?: string;
}
