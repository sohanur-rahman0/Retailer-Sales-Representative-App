import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';

async function bootstrap() {
    // Validate environment variables on startup
    let configService: ConfigService;
    try {
        configService = new ConfigService();
        console.log('✅ Environment variables validated successfully');
    } catch (error) {
        console.error('❌ Environment validation failed:', error.message);
        process.exit(1);
    }

    const app = await NestFactory.create(AppModule);

    // Get config service instance from app context
    configService = app.get(ConfigService);

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
        .addServer(`http://localhost:${configService.port}`)
        .addBearerAuth(
        )
        .addTag('Auth', 'Authentication endpoints')
        .addTag('Retailers', 'Retailer management endpoints')
        .addTag('Admin', 'Admin management endpoints')
        .addTag('Regions', 'Region CRUD')
        .addTag('Areas', 'Area CRUD')
        .addTag('Distributors', 'Distributor CRUD')
        .addTag('Territories', 'Territory CRUD')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            tryItOutEnabled: true,
            displayRequestDuration: true,
            docExpansion: 'none',
            filter: true,
            showExtensions: true,
            showCommonExtensions: true,
            syntaxHighlight: {
                activate: true,
                theme: 'arta',
            },
            requestInterceptor: (req) => {
                // Ensure Authorization header is included in all requests
                if (req.headers && req.headers.Authorization) {
                    return req;
                }
                return req;
            },
            responseInterceptor: (res) => {
                return res;
            },
        },
        customCss: `
            .swagger-ui .topbar { display: none }
            .swagger-ui .info .title { color: #3b4151 }
        `,
        customSiteTitle: 'Retailer SR Backend API Documentation',
        customfavIcon: '/favicon.ico',
    });

    configService = app.get(ConfigService);
    const port = configService.port;
    await app.listen(port);
    console.log(`Application running on port ${port}`);
    console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
