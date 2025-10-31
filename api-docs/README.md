# Kayak Simulation API Docs

This repo snapshot captures the API contract and readoc tooling for the Kayak-style distributed system group project.

## Contents
- `api-docs/openapi.yaml` — comprehensive OpenAPI 3.1 specification covering users, listings, bookings, billing, admin flows, analytics, concierge agents, and Kafka deal webhooks.
- `docker-compose.yml` — launches doc viewers (Swagger UI and Redoc) backed by the shared spec.

## Quick Start
```bash
docker compose up -d
```

Then browse:
- Swagger UI — <http://localhost:8081>
- Redoc — <http://localhost:8082>

To stop the viewers:
```bash
docker compose down
```