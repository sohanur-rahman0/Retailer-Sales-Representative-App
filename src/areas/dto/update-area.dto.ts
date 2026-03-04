import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt } from 'class-validator';

export class UpdateAreaDto {
    @ApiPropertyOptional({ example: 'Mirpur West' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ example: 2 })
    @IsOptional()
    @IsInt()
    regionId?: number;
}
