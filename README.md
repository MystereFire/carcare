# 🏎️ CarCare Manager

A modern, high-performance, and feature-rich **Progressive Web Application (PWA)** designed to manage multi-vehicle expenses, fuel consumption, mileage logs, and maintenance schedules. 

Featuring a brand-new, premium **Dark Cockpit & Glassmorphism Design System** with real-time analytics, dynamic charting, and smooth interactive comparisons.

---

## 🌌 Key Features

- **👥 User Authentication & Security**: Complete authentication flow with JWT-secured sessions, encrypted passwords, and OAuth2 Google Login integration.
- **🚗 Multi-Vehicle Garage**: Manage multiple cars with custom nicknames, technical specifications (brand, model, tank size, VIN, plate), purchase logs, and customizable car photo uploads.
- **📊 Interactive Cockpit Dashboards**:
  - Live mileage counter (Odometer) with quick-update controls.
  - Interactive expense charts (monthly breakdown, category distributions, cumulative spending).
  - Real-time fuel economy telemetry (average L/100km, average range tracking).
  - Quick status indicators for next Technical Inspection (CT) and upcoming service intervals.
- **💸 Expense Logs & Telemetry**:
  - Category-based tracking (Fuel, Maintenance, Repairs, Others).
  - Full fuel fill-up calculation logic with consumption metrics.
  - CSV Import and Export for easy backups and bulk updates.
- **📅 Smart Maintenance Logbook**:
  - Distance (km) and time (days) frequency trackers for regular tasks (oil changes, tires, brakes).
  - Dedicated tracker for the **Technical Inspection (CT)** with automatic due-date expiration calculations and colored priority alerts (Urgent, Bientôt, OK).
- **⚔️ Dual Vehicle Comparator**: A visual telemetry comparison dashboard with custom score calculation and dynamic bar charts to see which of your vehicles is the most cost-efficient.
- **📱 Progressive Web App (PWA)**: Access offline, add to the home screen, and enjoy native app-like speeds.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18+ (with React Router DOM)
- **Bundler**: Vite & Rolldown
- **Styling**: TailwindCSS & Custom Vanilla CSS (Glassmorphism & Neon Glow engine)
- **Charts**: Recharts & ApexCharts
- **Animation**: Framer Motion
- **Testing**: Playwright (End-to-End)

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: PostgreSQL (Sequelize ORM)
- **Authentication**: JSON Web Tokens (JWT) & Passport.js (Google OAuth2.0 Strategy)
- **Testing**: Jest & Supertest
- **Documentation**: Swagger UI (`/api-docs` API specifications explorer)

---

## ⚙️ Configuration & Environment Variables

Create `.env` files in both the `backend` and `frontend` subdirectories.

### 🔌 Backend configuration (`backend/.env`)

```env
# Server Port
PORT=5000

# PostgreSQL Connection String (Fallback uses localhost)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/carcare

# Security Key for JWT and Session Encryption
JWT_SECRET=your_super_secret_jwt_key_here

# Allowed Frontend URL for CORS configuration
FRONTEND_URL=http://localhost:5173

# Google OAuth2.0 Secrets (For social login)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 💻 Frontend configuration (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **PostgreSQL** database instance (or Docker)

### 2. Backend Setup
```bash
cd backend
npm install
# Start server in development mode (with hot-reloading)
npm run dev
```
*The database and tables will be auto-created and synced automatically via Sequelize ORM.*

### 3. Frontend Setup
```bash
cd ../frontend
npm install
# Start dev server
npm run dev
```
*Your application is now running locally on **http://localhost:5173**.*

---

## 🐳 Docker Deployment

The project is fully containerized and configured with Docker Compose. To run the complete stack (PostgreSQL Database, Node Backend, and React Frontend):

1. Make sure you have created the appropriate `.env` files.
2. Run the build and launch command:

```bash
docker-compose up --build
```
The application will be accessible at:
- **Frontend App**: `http://localhost:3001`
- **Backend API**: `http://localhost:4001`

---

## 🧪 Testing

### Backend Tests (Jest)
To run the database and API test suite:
```bash
cd backend
npm test
```

### Frontend Tests (Playwright)
To execute the End-to-End UI validation scenarios:
```bash
cd frontend
npx playwright test
```

---

## 📖 API Endpoints Summary

### 📂 Pagination Response format
paginated endpoints return data in this schema:
```json
{
  "page": 1,
  "totalPages": 3,
  "data": [ ... ]
}
```

### 🛣️ Routes List
- **Auth**:
  - `POST /api/auth/register` - Create user profile
  - `POST /api/auth/login` - Secure session token
  - `GET /api/auth/google` - Initiate Google Passport OAuth flow
- **Vehicles**:
  - `GET /api/vehicles?page=1&limit=10` - List user garage
  - `GET /api/vehicles/:id` - Fetch vehicle specs
  - `POST /api/vehicles` - Add new car (supports image upload)
  - `PATCH /api/vehicles/:id` - Edit specifications
  - `DELETE /api/vehicles/:id` - Delete car and its logs
- **Expenses**:
  - `GET /api/expenses/:vehicleId?page=1&limit=20` - Fetch expense history
  - `POST /api/expenses` - Log expense (Fuel fill-up, repairs, etc.)
  - `PUT /api/expenses/:id` - Update log entry
  - `DELETE /api/expenses/:id` - Delete entry
- **Maintenance**:
  - `GET /api/maintenance/:vehicleId` - Retrieve maintenance dashboard tasks
  - `POST /api/maintenance/:vehicleId` - Setup new recurring/inspection task
  - `PATCH /api/maintenance/:id` - Edit task interval
  - `POST /api/maintenance/:taskId/complete` - Log task accomplishment
- **Stats**:
  - `GET /api/stats/dashboard/:vehicleId` - Load precalculated telemetry stats
