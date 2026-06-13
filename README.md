# FinSight AI

[![License](https://img.shields.io/badge/license-ISC-blue.svg)](#license)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-black?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?logo=postgresql&logoColor=white)](https://neon.tech/)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

FinSight AI is a full-stack personal finance platform built to help users track transactions, understand cash flow, and generate actionable financial insights from their own data.

The app pairs a premium static frontend with a Node.js and Express backend, Prisma ORM, and Neon PostgreSQL. Authentication is handled with JWT, and analytics are calculated only for the signed-in user.

## Project Overview

FinSight AI is designed as a production-ready finance SaaS foundation with:

- Secure email and password authentication
- User-scoped transaction CRUD
- Analytics summary endpoints
- Interactive charts for spending analysis
- AI-style financial insights generated locally from transaction patterns

The UI intentionally keeps the current dashboard design intact while adding new functionality in a way that feels native to the existing product.

## Features

- JWT authentication with signup, login, session validation, and logout
- Transaction management for income and expense entries
- User-specific dashboards and data isolation
- Advanced analytics:
  - Total income
  - Total expenses
  - Net balance
  - Savings rate
  - Monthly cash flow
- Interactive charts:
  - Expense by category
  - Income vs expense
  - Monthly spending trend
- Financial insights engine:
  - Highest spending category
  - Month-over-month spending changes
  - Average monthly expense
  - Savings recommendations
  - Budget warnings
- Prisma-powered PostgreSQL persistence
- Responsive frontend built with HTML, CSS, and JavaScript

## Tech Stack

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript

### Backend

- Node.js
- Express
- JWT
- bcrypt

### Data Layer

- Prisma ORM
- Neon PostgreSQL

## Architecture

```mermaid
flowchart LR
    U[User Browser] --> F[Frontend\nHTML / CSS / JS]
    F -->|JWT requests| B[Node.js + Express API]
    B --> A[Auth Routes]
    B --> T[Transaction Routes]
    B --> N[Analytics Routes]
    A --> P[(Neon PostgreSQL)]
    T --> P
    N --> P
    B --> S[Prisma ORM]
    S --> P
```

## Installation

### 1. Clone the repository

```bash
git clone <repo-url>
cd FinSight-AI
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create `backend/.env` if it does not already exist and add the required values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
JWT_SECRET="your-strong-secret"
JWT_EXPIRES_IN="7d"
PORT=5000
BCRYPT_SALT_ROUNDS=12
```

### 4. Start the backend

```bash
npm start
```

The API will run on `http://localhost:5000`.

### 5. Open the frontend

Open `index.html` in a browser or serve the project root with your preferred static server.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string used by Prisma |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWTs |
| `JWT_EXPIRES_IN` | No | JWT expiration duration, for example `7d` |
| `PORT` | No | Backend port, defaults to `5000` |
| `BCRYPT_SALT_ROUNDS` | No | Password hashing strength, defaults to `12` |

## API Overview

### Authentication

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Transactions

- `GET /api/transactions`
- `POST /api/transactions`
- `DELETE /api/transactions/:id`

### Analytics

- `GET /api/analytics/summary`
- `GET /api/analytics/charts`
- `GET /api/analytics/insights`

All analytics and transaction endpoints require a valid JWT in the `Authorization: Bearer <token>` header.

### Example Analytics Response

```json
{
  "totalIncome": 65000,
  "totalExpenses": 28400,
  "netBalance": 36600,
  "savingsRate": 56.3,
  "monthlyCashFlow": 7200
}
```

## Folder Structure

```text
FinSight-AI/
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
│   └── server.js
├── css/
├── js/
├── index.html
└── README.md
```

## Security Notes

- Every protected route uses JWT authentication.
- Transactions and analytics are filtered by `userId`.
- Users cannot access another user's data through the API.
- Passwords are hashed with bcrypt before storage.

## Future Roadmap

- Export analytics to CSV and PDF
- Category budget planning and alerts
- Recurring transaction support
- Net worth tracking
- Multi-account support
- Email-based insight summaries
- Mobile app companion
- Scheduled financial reports

## Development Notes

- The frontend uses plain JavaScript and does not require a build step.
- Prisma is configured for PostgreSQL and connects to Neon.
- Analytics are computed from stored transaction history without external AI APIs.

## License

ISC

## Screenshots

### Login Page

![Login Page](screenshots/login.png)

### Dashboard

![Dashboard](screenshots/dashboard.png)

### Analytics

![Analytics](screenshots/analytics.png)