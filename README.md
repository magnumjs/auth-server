# Federated Login Server

A lightweight, modular federated login service built with Fastify, supporting:

- JWT-based login and session management
- Secure password hashing (bcrypt)
- `refreshToken` cookie and short-lived access tokens
- Form-based login with `returnUrl` redirects (for external apps)
- JSON login for API clients and tests
- `/me` endpoint for identity introspection
- End-to-end test coverage with seeded users
- Docker + PostgreSQL support for local and production environments

---

## ✨ Features

- ✅ Secure login with JWT & bcrypt
- ✅ HTTP-only refresh token cookie
- ✅ Short-lived access token (15m)
- ✅ `/refresh` endpoint for new access tokens
- ✅ `/me` endpoint to return current user info
- ✅ `/docs` endpoint to show swapper API
- ✅ Login form that redirects using `returnUrl`
- ✅ Form + API login both supported
- ✅ End-to-end tests with supertest
- ✅ Dockerized with PostgreSQL
- ✅ GitHub Actions CI/CD ready

---

## 🚀 Quickstart (Local Dev)

### 1. Clone and configure

```bash
cp .env.example .env
# edit secrets if needed

docker-compose up --build

npm install
npm run test
