import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { RetailersModule } from './retailers/retailers.module';
import { AdminModule } from './admin/admin.module';
import { RegionsModule } from './regions/regions.module';
import { AreasModule } from './areas/areas.module';
import { DistributorsModule } from './distributors/distributors.module';
import { TerritoriesModule } from './territories/territories.module';

@Module({
    imports: [
        PrismaModule,
        RedisModule,
        AuthModule,
        RetailersModule,
        AdminModule,
        RegionsModule,
        AreasModule,
        DistributorsModule,
        TerritoriesModule,
    ],
})
export class AppModule { }
