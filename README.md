# 🏥 Healthcare Appointment System

A production-grade, full-stack Healthcare Appointment platform built with modern industry-standard technologies — designed to showcase skills at the product-company level.

---

## 🏗️ Architecture

```
Client
  ↓
Route
  ↓
Middleware (Auth, RBAC, Validation, Rate Limit)
  ↓
Controller
  ↓
Service (Business Logic)
  ↓
Repository
  ↓
Prisma ORM
  ↓
PostgreSQL
```

---

## 🛠️ Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| ORM | Prisma |
| Database | PostgreSQL 16 |
| Cache / Locking | Redis 7 (IORedis) |
| Authentication | JWT + Refresh Tokens |
| Real-time | Socket.io |
| Email | Nodemailer |
| Payments | Razorpay |
| Validation | Zod |
| API Docs | Swagger / OpenAPI 3.0 |
| Logging | Winston + Morgan |
| Testing | Jest + Supertest |
| Containerization | Docker + Docker Compose |

### Frontend (Phase 12)
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| UI | Shadcn/ui + Tailwind CSS |
| State | Zustand + React Query |
| Forms | React Hook Form + Zod |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- PostgreSQL 16
- Redis 7
- npm

### 1. Clone & Install
```bash
cd backend
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your local values
```

### 3. Database Setup
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Start Dev Server
```bash
npm run dev
```

Server starts at: `http://localhost:5000`

---

## 🐳 Docker (Recommended)

```bash
# Start all services (PostgreSQL + Redis + API)
docker compose up -d

# View logs
docker compose logs -f backend

# Stop
docker compose down
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/         # DB, Redis, env config
│   ├── controllers/    # Route handlers
│   ├── services/       # Business logic
│   ├── repositories/   # Prisma queries
│   ├── middlewares/    # Auth, error, RBAC
│   ├── routes/         # Express routers
│   ├── utils/          # Logger, mailer, helpers
│   ├── types/          # TypeScript interfaces
│   ├── validations/    # Zod schemas
│   ├── jobs/           # Cron jobs
│   ├── app.ts          # Express setup
│   └── server.ts       # Entry point
├── prisma/
│   └── schema.prisma   # DB schema (11 models)
├── tests/
│   ├── integration/    # API tests
│   └── unit/           # Service tests
├── .env.example
├── Dockerfile
└── package.json
```

---

## 🔑 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register patient/doctor |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/logout` | Logout |
| POST | `/api/v1/auth/refresh-token` | Refresh access token |
| POST | `/api/v1/auth/send-otp` | Send OTP |
| POST | `/api/v1/auth/verify-otp` | Verify OTP |
| POST | `/api/v1/auth/forgot-password` | Forgot password |
| POST | `/api/v1/auth/reset-password` | Reset password |

### Doctors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/doctors` | List with filters |
| GET | `/api/v1/doctors/:id` | Doctor details |
| GET | `/api/v1/doctors/:id/availability` | Time slots |
| GET | `/api/v1/doctors/:id/reviews` | Reviews |
| PUT | `/api/v1/doctors/profile` | Update profile |
| PUT | `/api/v1/doctors/availability` | Set schedule |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/appointments` | Book appointment |
| GET | `/api/v1/appointments` | My appointments |
| GET | `/api/v1/appointments/:id` | Appointment detail |
| PUT | `/api/v1/appointments/:id/cancel` | Cancel |
| PUT | `/api/v1/appointments/:id/complete` | Mark complete (Doctor) |
| GET | `/api/v1/appointments/available-slots` | Get free slots |

### Medical Records
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/medical-records` | Create record (Doctor) |
| GET | `/api/v1/medical-records/:appointmentId` | Get record |
| GET | `/api/v1/patients/:id/records` | Patient history |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/payments/create-order` | Create Razorpay order |
| POST | `/api/v1/payments/verify` | Verify payment |
| POST | `/api/v1/payments/webhook` | Razorpay webhook |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/dashboard-stats` | Overview stats |
| GET | `/api/v1/admin/users` | All users |
| PUT | `/api/v1/admin/doctors/:id/approve` | Approve doctor |

---

## 🧪 Testing

```bash
# Run all tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 🔒 Security Features
- JWT with 15min access token + 7-day refresh token rotation
- OTP-based email verification (bcrypt hashed OTPs)
- Role-based access control: `PATIENT | DOCTOR | ADMIN`
- Redis distributed locking (prevents double booking)
- Rate limiting (100 req/15min per IP)
- Helmet.js security headers
- Zod input validation on all routes
- Prisma parameterized queries (SQL injection proof)
- bcrypt password hashing (salt rounds: 12)

---

## 📊 Database Schema

11 models: `User`, `Doctor`, `Patient`, `DoctorAvailability`, `Appointment`, `MedicalRecord`, `Review`, `Notification`, `Payment`, `OTPVerification`, `RefreshToken`

---

## 📖 API Documentation

Swagger UI: `http://localhost:5000/api/v1/docs`
*(Available after Phase 10)*

---

## 🗺️ Roadmap

- [x] Phase 0 — Project Setup
- [x] Phase 1 — Backend Core (Express + Prisma + Redis)
- [ ] Phase 2 — Authentication & RBAC
- [ ] Phase 3 — Doctor Module
- [ ] Phase 4 — Appointment Engine ⭐
- [ ] Phase 5 — Medical Records
- [ ] Phase 6 — Payments (Razorpay)
- [ ] Phase 7 — Notifications (Socket.io)
- [ ] Phase 8 — Admin APIs
- [ ] Phase 9 — Testing (Jest)
- [ ] Phase 10 — Swagger Docs
- [ ] Phase 11 — Docker Production
- [ ] Phase 12 — Next.js Frontend

---

## 👤 Roles

| Role | Capabilities |
|------|-------------|
| **PATIENT** | Browse doctors, book appointments, view records, pay |
| **DOCTOR** | Manage schedule, confirm/complete appointments, add records |
| **ADMIN** | Approve doctors, view all data, analytics |
