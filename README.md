# Sentinel Core Security Platform

Sentinel Core is a full-stack security operations platform for managing operators, teams, authentication events, and audit activity. The project is split into a Spring Boot backend and a Vite React frontend.

## Features

- JWT-based authentication and protected routes
- Role-based access control for `ADMIN`, `ANALYST`, and `VIEWER`
- Operator registration, login, logout, and profile management
- User directory with search, filters, pagination, status updates, and admin CRUD actions
- Team management with team leads, members, search, and admin CRUD actions
- Dashboard metrics for users, teams, recent registrations, and login activity
- Audit logs for admin and analyst review
- MongoDB persistence

## Tech Stack

Backend:

- Java 22
- Spring Boot 3.3.1
- Spring Security
- Spring Data MongoDB
- JWT with `jjwt`
- Gradle

Frontend:

- React 19
- Vite 8
- React Router
- Axios
- Tailwind CSS 4
- Lucide React icons
- Oxlint

## Project Structure

```text
Sentinel_Core_Security_Platform/
+-- backend/      # Spring Boot API
+-- frontend/     # Vite React app
```

## Prerequisites

- Java 22
- Node.js and npm
- MongoDB running locally

The backend expects MongoDB at:

```text
mongodb://localhost:27017/sentinelcore
```

## Run The Backend

From the project root:

```powershell
cd backend
.\gradlew.bat bootRun
```

If PowerShell blocks the Gradle wrapper, run:

```powershell
cmd /c gradlew.bat bootRun
```

The backend runs at:

```text
http://localhost:8080
```

## Run The Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

If PowerShell blocks `npm.ps1`, use:

```powershell
npm.cmd run dev
```

The frontend runs at:

```text
http://localhost:5173
```

## Default Local URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- MongoDB: `mongodb://localhost:27017/sentinelcore`

## Environment Configuration

Backend configuration is in:

```text
backend/src/main/resources/application.yml
```

Important values:

```yaml
server:
  port: 8080

spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/sentinelcore
```

The frontend API base URL is configured in:

```text
frontend/src/context/AuthContext.jsx
```

Current value:

```js
axios.defaults.baseURL = 'http://localhost:8080';
```

## API Overview

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/profile`

Dashboard:

- `GET /api/dashboard/stats`

Users:

- `GET /api/users`
- `GET /api/users/{id}`
- `POST /api/users`
- `PUT /api/users/{id}`
- `PUT /api/users/{id}/status`
- `DELETE /api/users/{id}`

Teams:

- `GET /api/teams`
- `GET /api/teams/{id}`
- `POST /api/teams`
- `PUT /api/teams/{id}`
- `DELETE /api/teams/{id}`

Audit Logs:

- `GET /api/audit-logs`

Authenticated requests should include:

```text
Authorization: Bearer <jwt-token>
```

## Role Permissions

`ADMIN`

- Full user and team management
- Dashboard access
- Audit log access

`ANALYST`

- View users and teams
- Update permitted user/profile data
- Dashboard access
- Audit log access

`VIEWER`

- View users and teams
- Dashboard access

## Useful Commands

Backend:

```powershell
cd backend
.\gradlew.bat bootRun
.\gradlew.bat test
```

Frontend:

```powershell
cd frontend
npm install
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
```

## Notes

- Make sure MongoDB is running before starting the backend.
- CORS is configured for `http://localhost:5173`.
- The JWT secret currently lives in `application.yml`; use environment variables or a secret manager before deploying outside local development.
