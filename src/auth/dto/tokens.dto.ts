import { ApiProperty } from '@nestjs/swagger';

export class TokensDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  access_token: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  refresh_token: string;

  @ApiProperty({
    description: 'User information',
    example: {
      id: 1,
      username: 'admin',
      name: 'Admin User',
      role: 'ADMIN'
    }
  })
  user: {
    id: number;
    username: string;
    name: string;
    role: string;
  };
}