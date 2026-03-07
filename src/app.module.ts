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
import { PointsModule } from './points/points.module';
import { RoutesModule } from './routes/routes.module';
import { ConfigModule } from './config/config.module';

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
        PointsModule,
        RoutesModule,
        ConfigModule,
    ],
})
export class AppModule { }
