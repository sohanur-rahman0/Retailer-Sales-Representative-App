import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsNotEmpty } from 'class-validator';

export class CreateRouteDto {
  @ApiProperty({ example: 'Morning Route', description: 'Route name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1, description: 'Point ID this route belongs to' })
  @IsInt()
  pointId: number;
}
