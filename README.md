# Aura | AI Beauty Assistant

Aura is a computer-vision application that turns a portrait into explainable beauty and personal-style recommendations.

The project explores how an AI-assisted experience can combine facial landmarks, image analysis, colorimetry knowledge and a modular web architecture. It was built as a learning project focused on applying artificial intelligence to a concrete, user-facing problem.

## Why this project

Choosing makeup, hair and clothing colors can be difficult without personalized guidance. Aura analyzes a user-provided image and extracts visual characteristics that can be used to generate practical recommendations, while keeping the analysis understandable instead of presenting a black-box result.

## What it does

- Detects facial landmarks with MediaPipe Face Landmarker.
- Estimates face shape from facial proportions.
- Classifies approximate skin tone and undertone using color analysis in the LAB color space.
- Estimates eye and hair color from image regions.
- Calculates an experimental facial-symmetry score.
- Uses a knowledge base related to colorimetry and facial analysis to build recommendations.
- Provides authentication, image upload and a web dashboard through a service-oriented architecture.

## Architecture

```text
Next.js web app
        |
NestJS API / BFF ---- PostgreSQL + Prisma
        |
FastAPI vision service ---- MediaPipe + OpenCV
        |
Assistant service + Catalog service
```

The repository is organized as a pnpm/Turborepo monorepo:

- `apps/web`: Next.js frontend with the App Router.
- `apps/api`: NestJS API and integration layer.
- `services/vision-service`: Python/FastAPI image-analysis service.
- `services/assistant-service`: recommendation and assistant service boundary.
- `services/catalog-service`: product catalog service boundary.
- `packages/contracts`: shared API contracts.
- `packages/shared`: shared types and utilities.

## Technology

**Frontend:** Next.js, React, TypeScript, Tailwind CSS  
**Backend:** NestJS, Prisma, PostgreSQL  
**Computer vision:** Python, FastAPI, MediaPipe, OpenCV, NumPy  
**Architecture:** pnpm workspaces, Turborepo, Docker Compose

## Run locally

Requirements: Node.js 20, pnpm 9+, Python 3.12+ and Docker Compose.

```bash
pnpm install
docker compose -f infra/docker/docker-compose.yml --env-file .env.example up -d
pnpm dev
```

To run the vision service separately:

```bash
cd services/vision-service
pip install -e .
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Project status

This is an active prototype. The image-analysis pipeline is implemented and the surrounding services establish the foundation for a complete assistant experience. Classification thresholds and recommendation quality are experimental and are intended to be improved with better datasets, evaluation metrics and user testing.

## Motivation

Aura is an example of my interest in building practical AI systems: taking a real-world input, transforming it through a computer-vision pipeline and presenting the result in a useful, accessible interface.