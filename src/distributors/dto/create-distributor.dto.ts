import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDistributorDto {
    @ApiProperty({ example: 'ABC Distribution Ltd', description: 'Distributor name' })
    @IsString()
    @IsNotEmpty()
    name: string;
}
