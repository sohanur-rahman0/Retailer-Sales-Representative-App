import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Swagger setup
    const config = new DocumentBuilder()
        .setTitle('Retailer SR Backend')
        .setDescription(
            'Backend API for Sales Representatives managing retailers across Bangladesh',
        )
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('Auth', 'Authentication endpoints')
        .addTag('Retailers', 'Retailer management endpoints')
        .addTag('Admin', 'Admin management endpoints')
        .addTag('Regions', 'Region CRUD')
        .addTag('Areas', 'Area CRUD')
        .addTag('Distributors', 'Distributor CRUD')
        .addTag('Territories', 'Territory CRUD')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Application running on port ${port}`);
    console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
