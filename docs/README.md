# Aura Monorepo

AI Beauty Assistant scaffold based on Turborepo + pnpm workspaces.

## Monorepo Map

- apps/web: Next.js App Router + Tailwind + shadcn/ui
- apps/api: NestJS BFF/API Gateway
- services/vision-service: FastAPI (face/body analysis stubs)
- services/assistant-service: NestJS (chat stub)
- services/catalog-service: NestJS (product stub)
- packages/shared: shared domain types/utilities
- packages/contracts: shared API DTO contracts
- infra/docker: local infrastructure compose

## Prerequisites

- Node.js 20 (see .nvmrc)
- pnpm 9+
- Python 3.12+
- Docker + Docker Compose

## Setup

1. Install workspace dependencies:

```bash
pnpm install
```

2. Start local infrastructure:

```bash
docker compose -f infra/docker/docker-compose.yml --env-file .env.example up -d
```

3. Run all JavaScript/TypeScript apps in dev mode:

```bash
pnpm dev
```

4. Run only specific apps/services when needed:

```bash
pnpm --filter web dev
pnpm --filter api dev
pnpm --filter assistant-service dev
pnpm --filter catalog-service dev
```

5. Run the vision service (from services/vision-service):

```bash
pip install -e .
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Build

```bash
pnpm build
```

## Health Endpoints

- BFF API: http://localhost:3001/health
- Assistant Service: http://localhost:3002/health
- Catalog Service: http://localhost:3003/health
- Vision Service: http://localhost:8000/health

## Notes

- Prisma schemas are included in apps/api and services/catalog-service.
- Database migrations are intentionally not run in this scaffold stage.
