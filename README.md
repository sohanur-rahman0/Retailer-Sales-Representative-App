# Retailer Sales Representative Backend

A scalable backend API for managing Sales Representatives (SRs) and their assigned retailers across Bangladesh. Built with NestJS, PostgreSQL (Prisma ORM), Redis, and JWT authentication.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** NestJS 10
- **Database:** PostgreSQL 16
- **ORM:** Prisma 5
- **Caching:** Redis 7
- **Auth:** JWT (Passport)
- **Docs:** Swagger/OpenAPI

## Quick Start

### Prerequisites

- Node.js ≥ 20
- PostgreSQL ≥ 14
- Redis ≥ 6
- Docker & Docker Compose (optional)

### Option 1: Docker Compose (Recommended)

```bash
# Start all services
docker-compose up --build

# In a new terminal, run migrations and seed
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npm run prisma:seed
```

The API will be available at `http://localhost:3000`.  
Swagger docs at `http://localhost:3000/api/docs`.

### Option 2: Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and configure
cp .env.example .env
# Edit .env with your DB and Redis connection details

# 3. Generate Prisma client
npx prisma generate

# 4. Run migrations
npx prisma migrate dev

# 5. Seed the database
npm run prisma:seed

# 6. Start development server
npm run start:dev
```

## Default Credentials

| Role  | Username | Password    |
|-------|----------|-------------|
| Admin | admin    | password123 |
| SR    | sr1–sr5  | password123 |

## API Endpoints

### Authentication

| Method | Endpoint       | Description              |
|--------|----------------|--------------------------|
| POST   | `/auth/login`  | Login & receive JWT      |

### Retailers (JWT Required)

| Method | Endpoint           | Description                                  |
|--------|--------------------|----------------------------------------------|
| GET    | `/retailers`       | Paginated list (SR: assigned only, Admin: all) |
| GET    | `/retailers/:uid`  | Get retailer details by UID                  |
| PATCH  | `/retailers/:uid`  | Update allowed fields (points, routes, notes) |

**Query Parameters for `GET /retailers`:**

- `search` — Search by name, UID, or phone
- `region_id`, `area_id`, `distributor_id`, `territory_id` — Filters
- `page`, `limit` — Pagination (default: page=1, limit=20)

### Admin (Admin JWT Required)

| Method | Endpoint                        | Description                    |
|--------|---------------------------------|--------------------------------|
| POST   | `/admin/assignments/bulk`       | Bulk assign retailers to SR    |
| DELETE | `/admin/assignments/bulk`       | Bulk unassign retailers        |
| GET    | `/admin/assignments/:salesRepId`| Get SR's assignments           |
| POST   | `/admin/retailers/import`       | Import retailers from CSV      |
| GET    | `/admin/sales-reps`             | List all SRs with counts       |

### Admin CRUD (Admin JWT Required)

| Method | Endpoint                   | Description          |
|--------|----------------------------|----------------------|
| CRUD   | `/admin/regions`           | Region management    |
| CRUD   | `/admin/areas`             | Area management      |
| CRUD   | `/admin/distributors`      | Distributor management |
| CRUD   | `/admin/territories`       | Territory management |

## CSV Import Format

```csv
uid,name,phone,region_id,area_id,distributor_id,territory_id,points,routes,notes
RTL-NEW-001,New Shop,+8801700000001,1,1,1,1,0,Route-A,
```

## Running Tests

```bash
npm run test
```

## Project Structure

```
src/
├── auth/            # JWT authentication, guards, decorators
├── retailers/       # Retailer listing, detail, update (cached)
├── admin/           # Bulk import, assignments, SR management
├── regions/         # Region CRUD
├── areas/           # Area CRUD
├── distributors/    # Distributor CRUD
├── territories/     # Territory CRUD
├── prisma/          # Database client module
├── redis/           # Cache client module
├── app.module.ts
└── main.ts
prisma/
├── schema.prisma    # Data model & migrations
└── seed.ts          # Initial seed data
```

## Scaling Approach

This backend is designed for horizontal scalability to handle 1M+ retailers and thousands of concurrent SRs:

**Database layer:** PostgreSQL indexes on all foreign keys, UID, name, and phone columns guarantee sub-millisecond lookups even at 1M rows. The `sales_rep_retailers` mapping table with composite unique indexes enables O(1) assignment checks. For reads at extreme scale, PostgreSQL read replicas can be added behind a connection pooler like PgBouncer, with the application routing read queries to replicas. Table partitioning on `region_id` would further optimize regional queries.

**Caching & Application layer:** Redis caches retailer detail records with a 5-minute TTL, reducing DB load for the most common read path. At scale, this extends to a Redis Cluster with consistent hashing. The stateless NestJS application can be horizontally scaled behind a load balancer (e.g., Kubernetes + Nginx Ingress). Bulk CSV imports use streaming parsers with batch inserts (500 records/batch) to avoid memory spikes. For very large imports (100K+ rows), a background job queue (e.g., BullMQ) with Redis as the broker would process imports asynchronously, providing progress tracking via WebSocket or polling.
