# full-stack-take-home-challenge

## Overview

A basic Notification Management system for authenticated users. Each user can manage and send notifications through different channels.

### Functional requirements

#### 1. User authentication
- Register with email and password.
- Login returning an access token.
- All endpoints require a valid token.

#### 2. Notification management
- Create a notification (fields: title, content, channel).
- Update an existing notification.
- Delete a notification.
- List all notifications belonging to the authenticated user.

#### 3. Notification sending
Every time a notification is created, it is dispatched through the specified channel. Available channels:

| Channel | Simulated logic |
|---|---|
| **Email** | Validate recipient format, generate a template, register the send. |
| **SMS** | Limit content to 160 characters, register number and send date. |
| **Push** | Validate device token, format the payload, register delivery status. |

The channel logic follows the Strategy pattern — adding a new channel does not require modifying existing code.

### Technical requirements

- RESTful API built with **NestJS** (Node.js / TypeScript).
- Relational database: **PostgreSQL**.
- JWT-based authentication.
- Containerised with **Docker Compose** (dev and prod).

---

## Technical decisions

### Strategy pattern for notification channels

The notification sending logic uses the **Strategy pattern**: each channel (Email, SMS, Push) is implemented as a concrete class behind a common interface. The `NotificationStrategyFactory` selects and executes the right strategy at runtime.

This approach was chosen because:
- It abstracts the specific sending algorithm behind a shared interface, keeping the service layer clean.
- Adding a new channel only requires creating a new strategy class — no existing code needs to change (**Open/Closed Principle**).
- Each strategy is independently testable.

### Global JWT guard with deny-all by default

The JWT guard is registered globally (`APP_GUARD`), so every endpoint is protected unless explicitly marked with `@Public()`.

This follows the **principle of least privilege**: access is denied by default, and routes are opened up intentionally. The alternative — applying guards per route — risks accidentally exposing private endpoints if a decorator is forgotten.

### Centralised DatabaseErrorHandler

Database errors are caught and mapped in a single `DatabaseErrorHandler` class rather than handled inline at each service method.

This decouples the application logic from database-specific error codes (e.g. PostgreSQL's `23505` for unique violations). If the database engine changes, only `DatabaseErrorHandler` needs to be updated — the services remain untouched.

### Argon2 for password hashing

Argon2 was chosen over bcrypt because it is the more modern algorithm, winner of the Password Hashing Competition (2015), and has first-class TypeScript support. It is more resistant to GPU-based brute-force attacks than bcrypt.

### Mock repositories for notification channels

The Email, SMS, and Push sending implementations use mock repositories (simulated logic, no real external calls). Integrating actual providers (SendGrid, Twilio, Firebase, etc.) is outside the scope of this take-home challenge. The architecture is designed so that replacing a mock with a real implementation only requires swapping the injected repository.

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

---

## 1. Environment variables

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `DB_HOST` | PostgreSQL host (set automatically by Docker) | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `changeme` |
| `DB_DATABASE` | PostgreSQL database name | `postgres` |
| `DB_SYNCHRONIZE` | Auto-sync TypeORM schema on startup | `true` |
| `SECRET_TOKEN` | JWT signing secret | `changeme` |
| `PORT` | HTTP port exposed by the API | `3000` |

> **Note:** `DB_HOST` is overridden to `db` inside Docker Compose so the backend can reach the database container. You do not need to change it manually.

---

## 2. Local development (Docker)

Starts the API with hot-reload and a PostgreSQL database.

```bash
# First time, or after changes to package.json / Dockerfile.dev
docker compose up --build

# Subsequent runs
docker compose up

# Run in the background
docker compose up -d
```

| Service | URL |
|---|---|
| API | http://localhost:3000 |
| PostgreSQL | localhost:5432 |

### Useful commands

```bash
# Stream backend logs
docker compose logs -f backend

# Stop (data is preserved)
docker compose down

# Stop and delete the database volume
docker compose down -v
```

---

## 3. Production (Docker)

```bash
# Start
docker compose -f docker-compose.prod.yml up --build -d

# Stream logs
docker compose -f docker-compose.prod.yml logs -f backend

# Stop
docker compose -f docker-compose.prod.yml down
```

---

## 4. Running tests

Tests run against mocked dependencies — no database required.

```bash
# Run all tests once
npm test

# Watch mode (re-runs on file save)
npm run test:watch

# With coverage report
npm run test:cov
```

To run a specific spec file:

```bash
npm test -- auth.controller
npm test -- notifications.service
```