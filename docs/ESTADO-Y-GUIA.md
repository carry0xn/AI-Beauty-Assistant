# Aura — Estado del proyecto y guía de desarrollo

> Documento vivo: se actualiza a medida que avanzamos. Sirve para que alguien nuevo
> en el equipo (desarrollador/a, colaborador/a) entienda qué hay, cómo correrlo y qué sigue.

## 1. Qué es Aura

SaaS de asesoría de imagen con IA. El usuario sube fotos (rostro y cuerpo) y la IA
analiza sus características para recomendar maquillaje, cortes, colores, outfits y
accesorios, con un asistente conversacional que recuerda sus preferencias.

## 2. Stack actual

| Capa | Tecnología |
|---|---|
| Web | Next.js 14 (App Router) + React + Tailwind |
| Backend (BFF) | NestJS + TypeScript + Prisma + JWT |
| Servicio de visión | Python 3.12+ / FastAPI + MediaPipe (en curso) |
| Base de datos | PostgreSQL 16 (una DB por servicio) |
| Cola de mensajes | RabbitMQ 3 |
| Objetos/imágenes | MinIO (S3 local), luego S3 en prod |
| Cache | Redis 7 |
| Repo | Monorepo pnpm + Turborepo |

## 3. Estructura del monorepo

```
aura/
  apps/
    web/                # Frontend Next.js (puerto 3000)
    api/                # BFF NestJS (puerto 3001) — auth + orquestación
  services/
    vision-service/     # Python FastAPI (puerto 8000) + worker de análisis
    assistant-service/  # NestJS (3002) — LLM/chat (stub)
    catalog-service/    # NestJS (3003) — catálogo (stub)
  packages/
    shared/             # tipos y utilidades TS
    contracts/          # DTOs compartidos
  infra/docker/         # docker-compose con postgres, redis, minio, rabbitmq
  docs/                 # esta documentación
```

## 4. Cómo correr el entorno local

Requisitos: Node 20+, pnpm 9, Docker Desktop, Python 3.12+.

```bash
# 1) Infraestructura (Postgres, Redis, MinIO, RabbitMQ)
cd infra/docker && docker compose up -d

# 2) Bases de datos (una por servicio)
docker exec aura-postgres psql -U postgres -c "CREATE DATABASE aura_api;"
docker exec aura-postgres psql -U postgres -c "CREATE DATABASE aura_catalog;"
docker exec aura-postgres psql -U postgres -c "CREATE DATABASE aura_assistant;"

# 3) Migraciones Prisma
cd apps/api && pnpm exec prisma migrate dev

# 4) Dependencias + dev servers (web + api + servicios Node)
cd ../.. && pnpm install && pnpm dev

# 5) Servicio de visión (Python) — por separado
cd services/vision-service
python -m venv .venv
.venv\Scripts\python -m pip install -e ".[dev]"
# worker (procesa la cola) en una terminal:
.venv\Scripts\python -m app.worker
# API HTTP (stub) en otra:
.venv\Scripts\python -m uvicorn app.main:app --port 8000
```

> El modelo de MediaPipe se descarga una sola vez a `services/vision-service/models/face_landmarker.task`
> (desde `https://storage.googleapis.com/mediapipe-models/...`). Si no está, el worker falla al analizar.

URLs: web `http://localhost:3000` · API `http://localhost:3001/health` ·
MinIO consola `http://localhost:9001` (minioadmin/minioadmin) ·
RabbitMQ management `http://localhost:15672` (guest/guest).

## 5. Estado por módulo

### ✅ Hecho — Autenticación (vertical completa)
- [x] `POST /auth/register` — crea usuario, contraseña hasheada (bcrypt). 409 si el email existe.
- [x] `POST /auth/login` — valida credenciales y devuelve JWT. 401 si son inválidas.
- [x] `GET /users/me` — protegido con JWT (401 sin token).
- [x] PrismaService conectado, migración `add_password_auth`.
- [x] CORS habilitado para la web.
- [x] Web: página `/auth` (ingresar/crear cuenta), `/dashboard` con sesión y logout.
- [x] Verificado: registro, login, /me, 409, 401, preflight CORS.

### ✅ Hecho — Análisis facial (vertical slice completa)
- [x] Bucket MinIO `aura-photos` con CORS (creado en el arranque del BFF).
- [x] Modelo `Analysis` en Prisma (status PENDING/PROCESSING/COMPLETED/FAILED, imageKey, kind, resultJson, error). Migración `analysis_pipeline`.
- [x] BFF: `POST /uploads/presign` (JWT) → URL firmada para subir directo a MinIO.
- [x] BFF: `POST /analyses` (JWT) → crea el análisis y publica el trabajo en RabbitMQ.
- [x] BFF: `GET /analyses/:id` (JWT) → polling de estado y resultado.
- [x] BFF: `PATCH /analyses/:id/result` (solo interno, header `x-internal-key`) → guarda el resultado.
- [x] vision-service: worker `app.worker` que consume la cola, baja la imagen de MinIO y analiza con **MediaPipe FaceLandmarker (478 puntos)**.
- [x] Métricas v1: forma de rostro (oval/redonda/cuadrada/corazón/alargada), tono+subtono de piel (Lab), color de ojos, color de cabello, simetría (2D, sensible a pose), proporciones (distancia interpupilar, boca, nariz, ojos).
- [x] Web: página `/analyze` con subida, progreso y tarjetas de resultado.
- [x] Prueba end-to-end verificada (login → presign → PUT MinIO → cola → worker → resultado en DB).

### ⏳ Pendiente
- Colorimetría (temperatura, estación de color).
- Análisis corporal (tipo de cuerpo).
- Motor de recomendaciones con LLM + memoria del usuario.
- Prueba virtual (IA generativa).
- Catálogo inteligente de productos.
- Chat asistente.
- Auth social, reset de password, verificación de email.

## 6. Flujo de datos del análisis facial (objetivo)

```
Web sube foto → BFF da presigned URL → Web sube directo a MinIO
  → Web pide POST /analyses {kind, imageKey}
  → BFF guarda Analysis(PROCESSING) en Postgres y publica en cola RabbitMQ
  → vision-service (worker) consume, baja la imagen de MinIO
  → MediaPipe FaceLandmarker extrae 478 landmarks → calcula métricas
  → vision-service hace callback PATCH /analyses/:id/result
  → BFF guarda resultado (COMPLETED)
  → Web hace polling GET /analyses/:id hasta ver el resultado
```

Patrones clave: procesamiento **100% asíncrono** (la visión nunca bloquea el BFF),
`database-per-service`, y la visión solo toca imágenes temporales (no persiste fotos).

## 6.1 APIs disponibles (BFF, puerto 3001)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/register` | — | Crear cuenta (email + password + nombre opcional) |
| POST | `/auth/login` | — | Login → `{ accessToken, user }` |
| GET | `/users/me` | JWT | Perfil del usuario actual |
| POST | `/uploads/presign` | JWT | Devuelve `{ uploadUrl, key, getUrl }` para subir a MinIO |
| POST | `/analyses` | JWT | Crea análisis `{ kind: 'face'\|'body', imageKey }` → `{ analysisId, status }` |
| GET | `/analyses/:id` | JWT | Estado + `resultJson` (polling) |
| PATCH | `/analyses/:id/result` | `x-internal-key` | Callback del vision-service (solo interno) |

## 7. Convenciones

- Carpetas/archivos kebab-case, clases PascalCase, variables camelCase, SQL snake_case.
- Endpoints REST kebab-case y plurales.
- Servicios: `{sustantivo}-service`. Paquetes: `@aura/*`.
- Dominios en NestJS: users, auth, analyses, uploads, recommendations, chat, products.
- No commits de `.env`, tokens ni fotos de usuarios.
