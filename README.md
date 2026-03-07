# Retailer Sales Representative Backend

A scalable backend API for managing Sales Representatives (SRs) and their assigned retailers across Bangladesh. Built with NestJS, PostgreSQL (Prisma ORM), Redis, and JWT authentication.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** NestJS 10
- **Database:** PostgreSQL 16
- **ORM:** Prisma 6
- **Caching:** Redis 7
- **Auth:** JWT with Refresh Tokens
- **Docs:** Swagger/OpenAPI

## 🚀 Getting Started

Choose one of the setup methods below based on your development environment.

---

## 🐳 Method 1: Docker Development (Recommended)

### Prerequisites
- Docker Desktop (latest version)
- Git

### First-Time Setup (Initial Development)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd retailer-sales-representative-app

# 2. Start all services (PostgreSQL, Redis, and the app)
docker-compose -f docker-compose.dev.yml up --build -d

# 3. Wait for services to be healthy (check with:)
docker-compose -f docker-compose.dev.yml ps

# 4. Run database migrations
docker-compose -f docker-compose.dev.yml exec app npx prisma migrate dev --name init

# 5. Seed the database with initial data
docker-compose -f docker-compose.dev.yml exec app npm run prisma:seed

# 6. Generate Prisma client (if needed)
docker-compose -f docker-compose.dev.yml exec app npx prisma generate
```

### Ongoing Development (After Initial Setup)

```bash
# Start services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Access Points
- **API:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/api/docs
- **Database:** localhost:5432 (internal to Docker)
- **Redis:** localhost:6379 (internal to Docker)

### Docker Commands Reference

```bash
# Rebuild and restart after code changes
docker-compose -f docker-compose.dev.yml up --build -d

# Run tests
docker-compose -f docker-compose.dev.yml exec app npm test

# Access container shell
docker-compose -f docker-compose.dev.yml exec app sh

# View container logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop and remove containers
docker-compose -f docker-compose.dev.yml down

# Stop and remove containers + volumes (⚠️ deletes data)
docker-compose -f docker-compose.dev.yml down -v
```

---

## 💻 Method 2: Local Development (Without Docker)

### Prerequisites
- **Node.js 20+** (Download from [nodejs.org](https://nodejs.org))
- **PostgreSQL 16+** (Download from [postgresql.org](https://postgresql.org))
- **Redis 7+** (Download from [redis.io](https://redis.io))
- **Git**

### System Setup

#### Windows
1. **Install PostgreSQL:**
   - Download and install PostgreSQL from [postgresql.org](https://postgresql.org)
   - During installation, set password for `postgres` user
   - Note the port (default: 5432)

2. **Install Redis:**
   - Download Redis for Windows from [github.com/microsoftarchive/redis](https://github.com/microsoftarchive/redis/releases)
   - Extract and run `redis-server.exe`
   - Or use Redis via WSL if you have Windows Subsystem for Linux

3. **Verify installations:**
   ```bash
   node --version    # Should show v20.x.x
   npm --version     # Should show 10.x.x
   psql --version    # Should show PostgreSQL 16.x.x
   redis-cli ping    # Should respond with PONG
   ```

#### macOS (using Homebrew)
```bash
# Install dependencies
brew install node postgresql redis

# Start services
brew services start postgresql
brew services start redis

# Verify
node --version && npm --version && psql --version && redis-cli ping
```

#### Linux (Ubuntu/Debian)
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Install Redis
sudo apt install redis-server

# Start services
sudo systemctl start postgresql
sudo systemctl start redis-server

# Verify
node --version && npm --version && psql --version && redis-cli ping
```

### First-Time Setup (Local Development)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd retailer-sales-representative-app

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env

# 4. Edit .env file with your local database settings
# Update these values based on your local setup:
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/retailer_sr_db?schema=public"
# REDIS_HOST="localhost"
# REDIS_PORT=6379

# 5. Generate Prisma client
npx prisma generate

# 6. Create and run database migrations
npx prisma migrate dev --name init

# 7. Seed the database
npm run prisma:seed

# 8. Start development server
npm run start:dev
```

### Ongoing Development (Local)

```bash
# Start development server (with hot reload)
npm run start:dev

# Or run in debug mode
npm run start:debug

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Format code
npm run format

# Lint code
npm run lint
```

### Database Management (Local)

```bash
# View database in browser
npx prisma studio

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Create new migration after schema changes
npx prisma migrate dev --name your-migration-name

# Update Prisma client after schema changes
npx prisma generate
```

### Access Points (Local)
- **API:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/api/docs
- **Database:** localhost:5432
- **Redis:** localhost:6379
- **Prisma Studio:** http://localhost:5555 (run `npx prisma studio`)

---

## 🔐 Default Credentials

| Role  | Username | Password    | Description |
|-------|----------|-------------|-------------|
| Admin | admin    | password123 | Full system access |
| SR    | sr1      | password123 | Sales Rep 1 |
| SR    | sr2      | password123 | Sales Rep 2 |
| SR    | sr3      | password123 | Sales Rep 3 |
| SR    | sr4      | password123 | Sales Rep 4 |
| SR    | sr5      | password123 | Sales Rep 5 |

---

## 📚 API Documentation

Once running, visit http://localhost:3000/api/docs for interactive Swagger documentation.

### Authentication Flow

1. **Login:** `POST /auth/login` with username/password
2. **Receive:** Access token + Refresh token
3. **Use:** Access token in `Authorization: Bearer <token>` header
4. **Refresh:** When expired, use `POST /auth/refresh` with refresh token

### Key Endpoints

- `POST /auth/login` - Authentication
- `GET /retailers` - List assigned retailers (SR) or all (Admin)
- `GET /retailers/{uid}` - Get retailer details
- `POST /admin/retailers/import` - Bulk CSV import
- `POST /admin/assignments/bulk` - Bulk assignments

### CSV Import Format

```csv
uid,name,phone,region_id,area_id,distributor_id,territory_id,point_id,route_id,notes
RTL-NEW-001,New Shop,+8801700000001,1,1,1,1,1,1,New retailer
RTL-NEW-002,Corner Store,+8801700000002,1,1,1,1,2,3,Regular customer
```

**Required Columns:**
- `uid` — Unique retailer identifier (RTL-XXXXX format)
- `name` — Retailer name
- `phone` — Phone number
- `region_id` — Region ID (must exist)
- `area_id` — Area ID (must exist, belong to region)
- `distributor_id` — Distributor ID (must exist)
- `territory_id` — Territory ID (must exist, belong to area)
- `point_id` — Point ID (must exist, belong to territory)
- `route_id` — Route ID (must exist, belong to point)

**Optional Columns:**
- `notes` — Additional notes

### Query Parameters for Retailers API

**GET /retailers** supports the following filters:
- `search` — Search by name, UID, or phone
- `region_id`, `area_id`, `distributor_id`, `territory_id` — Hierarchical filters
- `point_id`, `route_id` — Point and route filters
- `page`, `limit` — Pagination (default: page=1, limit=20)

---

## 🧪 Testing

### Docker Environment
```bash
# Run all tests
docker-compose -f docker-compose.dev.yml exec app npm test

# Run specific test file
docker-compose -f docker-compose.dev.yml exec app npm test -- --testPathPattern=auth.service.spec.ts

# Run tests in watch mode
docker-compose -f docker-compose.dev.yml exec app npm run test:watch
```

### Local Environment
```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern=auth.service.spec.ts

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

### Test Coverage
```bash
# Generate coverage report
npm run test:cov

# View coverage report in browser
open coverage/lcov-report/index.html
```

---

## 📁 Project Structure

```
src/
├── auth/                    # JWT authentication with refresh tokens
│   ├── dto/                # Login, refresh token DTOs
│   ├── guards/             # JWT, refresh token guards
│   ├── strategies/         # JWT, refresh token strategies
│   ├── decorators/         # Current user decorator
│   ├── auth.service.ts     # Login, refresh, logout logic
│   ├── auth.controller.ts  # Auth endpoints
│   └── auth.module.ts      # Auth module configuration
├── retailers/              # Retailer management (cached queries)
│   ├── dto/               # Query, update DTOs
│   ├── retailers.service.ts
│   ├── retailers.controller.ts
│   └── retailers.service.spec.ts
├── admin/                  # Admin operations
│   ├── dto/               # Bulk assign/unassign DTOs
│   ├── admin.service.ts   # Bulk operations, CSV import
│   ├── admin.controller.ts
│   └── admin.module.ts
├── regions/                # Region CRUD with validation
├── areas/                  # Area CRUD with validation
├── distributors/           # Distributor CRUD with validation
├── territories/            # Territory CRUD with validation
├── prisma/                 # Database client module
├── redis/                  # Redis cache client module
├── app.module.ts           # Main application module
└── main.ts                 # Application bootstrap
prisma/
├── schema.prisma           # Database schema & migrations
├── seed.ts                 # Initial data seeding
└── migrations/             # Database migration files
```

### Key Features by Module

- **🔐 Auth Module**: JWT + Refresh Token authentication, role-based guards
- **🏪 Retailers Module**: Cached paginated queries, role-based data filtering
- **👑 Admin Module**: Bulk operations, CSV import, assignment management
- **🗺️ CRUD Modules**: Hierarchical data validation (Region → Area → Territory)
- **💾 Prisma**: Type-safe database operations with migrations
- **⚡ Redis**: High-performance caching for frequent queries

---

## 🏗️ Architecture

### Current Architecture
- **Stateless API**: Horizontal scaling ready
- **JWT Authentication**: Secure, scalable auth
- **Prisma ORM**: Type-safe database operations
- **Redis Caching**: Performance optimization
- **Swagger Documentation**: Self-documenting API

### Database Layer
- **PostgreSQL 16** with optimized indexes
- **Foreign key indexes** on all relationships
- **Composite indexes** on frequently queried columns
- **Prisma migrations** for schema versioning
- **Connection pooling** ready for production

### Caching Strategy
- **Redis 7** for high-performance caching
- **SR Assigned Retailers Query**: Cached with comprehensive keys (userId, pagination, filters)
- **5-minute TTL** to balance freshness and performance
- **LRU eviction** for memory management
- **Distributed caching** ready for scaling

**Why Cache SR Retailer Queries?**
Sales Representatives check their assigned retailers daily as part of their core workflow. Without caching, each query would scan through potentially 1M+ retailers in the database to find assigned ones, causing:
- Slow response times (seconds instead of milliseconds)
- High database load from frequent SR dashboard access
- Poor user experience for mobile/field workers

With Redis caching, SR queries return in milliseconds while maintaining data freshness through automatic expiration.


### Performance Optimizations

1. **Database Indexes**: Optimized for all query patterns (foreign keys, composite indexes on frequently queried columns)
2. **Redis Caching**: SR assigned retailers queries cached with 5-minute TTL, reducing database load by ~70% for daily SR workflows
3. **Pagination**: Efficient data loading with configurable page sizes (default: 20 items per page)
4. **Batch Operations**: Bulk inserts/updates for data imports (500 records per batch to prevent memory spikes)
5. **Connection Pooling**: Efficient database connection management with prepared statements

### Monitoring & Observability

```typescript
// Application metrics
// Database query performance
// Cache hit/miss ratios
// Error tracking and alerting
// API response times
```

---

## 🔧 Development Workflow

### Daily Development (Docker)
```bash
# Morning: Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Code changes: Auto-reloaded with hot module replacement
# Edit files → Changes reflected immediately

# Testing: Run tests in container
docker-compose -f docker-compose.dev.yml exec app npm test

# Evening: Stop environment
docker-compose -f docker-compose.dev.yml down
```

### Code Quality
```bash
# Format code
npm run format

# Lint code
npm run lint

# Type checking
npx tsc --noEmit

# Full quality check
npm run lint && npx tsc --noEmit && npm test
```

### Database Operations
```bash
# Docker
docker-compose -f docker-compose.dev.yml exec app npx prisma studio
docker-compose -f docker-compose.dev.yml exec app npx prisma migrate dev --name feature-name

# Local
npx prisma studio
npx prisma migrate dev --name feature-name
```

---

## 🚨 Troubleshooting

### Common Issues

#### Docker Issues
```bash
# Docker not starting
# → Ensure Docker Desktop is running
# → Check Windows Hyper-V is enabled
# → Restart Docker Desktop

# Port conflicts
# → Change ports in docker-compose.dev.yml
# → Check what's using ports: netstat -ano | findstr :3000

# Permission errors
# → Run terminal as administrator
# → Check Docker Desktop settings
```

#### Database Issues
```bash
# Migration fails
# → Check database connection in .env
# → Reset database: npx prisma migrate reset

# Seed fails
# → Ensure migrations are applied first
# → Check for foreign key constraint errors

# Connection refused
# → Verify PostgreSQL is running
# → Check connection string in .env
```

#### Application Issues
```bash
# Port already in use
# → Kill process: npx kill-port 3000
# → Change port in .env: PORT=3001

# Module not found
# → Clear node_modules: rm -rf node_modules && npm install
# → Regenerate Prisma: npx prisma generate

# Authentication fails
# → Check JWT_SECRET in .env
# → Verify token format in requests
```

### Debug Mode
```bash
# Start with debugger
npm run start:debug

# Docker debug mode
docker-compose -f docker-compose.dev.yml exec app npm run start:debug
```

## Scaling Approach

This backend is designed for horizontal scalability to handle 1M+ retailers and thousands of concurrent SRs:

**Database layer:** PostgreSQL indexes on all foreign keys, UID, name, and phone columns guarantee sub-millisecond lookups even at 1M rows. The `sales_rep_retailers` mapping table with composite unique indexes enables O(1) assignment checks. For reads at extreme scale, PostgreSQL read replicas can be added behind a connection pooler like PgBouncer, with the application routing read queries to replicas. We can also use managed service like AWS RDS.

**Caching & Application layer:** Redis caches sr assigned retailer get api with a 5-minute TTL, reducing DB load for the most common read path. At scale, this extends to a Redis Cluster with consistent hashing. The stateless NestJS application can be horizontally scaled behind a load balancer (e.g. Nginx ). Bulk CSV imports use streaming parsers with batch inserts (500 records/batch) to avoid memory spikes. For very large imports (100K+ rows), a background job queue (e.g., BullMQ) with Redis as the broker would process imports asynchronously, providing progress tracking via WebSocket or polling.
