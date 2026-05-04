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

### Rate limiting via @nestjs/throttler

Rate limiting is applied globally using `@nestjs/throttler` with the `ThrottlerGuard` registered as a global guard (`APP_GUARD`).

Since the API is deployed on a public server, it is exposed to the internet and vulnerable to brute-force and abuse. The limits are intentionally strict because the server is only expected to handle manual testing traffic:

| Scope | Limit |
|---|---|
| All endpoints | 20 requests / minute |
| Auth endpoints (`/login`, `/register`) | 5 requests / minute |

Auth endpoints have a tighter limit to prevent credential brute-forcing. Exceeding any limit returns `429 Too Many Requests`.

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

---

## 5. API examples (curl)

Base URL: `https://full-stack-take-home-challenge.onrender.com`

### Auth

**Register**
```bash
curl -s -X POST https://full-stack-take-home-challenge.onrender.com/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret123"}'
```

**Login** — returns `access_token`
```bash
curl -s -X POST https://full-stack-take-home-challenge.onrender.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret123"}'
```

Store the token for subsequent requests:
```bash
TOKEN=$(curl -s -X POST https://full-stack-take-home-challenge.onrender.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret123"}' | jq -r '.access_token')
```

---

### Notifications

All notifications endpoints require the `Authorization: Bearer <token>` header.

**Create — Email**
```bash
curl -s -X POST https://full-stack-take-home-challenge.onrender.com/v1/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Welcome",
    "content": "Thanks for signing up!",
    "channel": "email",
    "payload": {
      "recipient": "user@example.com",
      "templateId": "welcome-v1"
    }
  }'
```

**Create — SMS**
```bash
curl -s -X POST https://full-stack-take-home-challenge.onrender.com/v1/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "OTP",
    "content": "Your verification code is 482910.",
    "channel": "sms",
    "payload": {
      "phoneNumber": "+15550001234",
      "content": "Your verification code is 482910."
    }
  }'
```

**Create — Push**
```bash
curl -s -X POST https://full-stack-take-home-challenge.onrender.com/v1/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "New message",
    "content": "You have a new message.",
    "channel": "push",
    "payload": {
      "deviceToken": "abc123devicetoken",
      "title": "New message",
      "data": {"messageId": "42"}
    }
  }'
```

**List** (supports `?page=1&limit=10`)
```bash
curl -s "https://full-stack-take-home-challenge.onrender.com/v1/notifications?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Update**
```bash
curl -s -X PATCH https://full-stack-take-home-challenge.onrender.com/v1/notifications/<id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title": "Updated title"}'
```

**Delete**
```bash
curl -s -X DELETE https://full-stack-take-home-challenge.onrender.com/v1/notifications/<id> \
  -H "Authorization: Bearer $TOKEN"
```