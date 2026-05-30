# SnapSync

A scalable Event & Media Management Platform (SnapSync) built with Next.js (App Router), TypeScript, and MongoDB.

## Features (Phase 1)
- **Scalable Architecture:** Organized by App Router routes, models, and custom middleware utilities.
- **Authentication:** JWT-based user registration and login.
- **Role-Based Access Control (RBAC):** Custom roles (`Admin`, `Photographer`, `Club Member`, `Viewer`) to restrict API access.
- **Database Schema:** Mongoose models for `User`, `Event`, and a flexible `Media` model.
- **Event CRUD:** Complete RESTful API for Event management with sorting and filtering.

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB connection string

### Installation
1. Clone the repository and install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root of the project with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

3. Run the development server:
```bash
npm run dev
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register a new user (requires `name`, `email`, `password`, `role`).
- `POST /api/auth/login` - Login and get JWT token (requires `email`, `password`).

#### Events (Requires Bearer Token)
- `POST /api/events` - Create a new event (Admin, Photographer only).
- `GET /api/events` - List events (All authenticated users). Supports query params `name`, `category`, `date`, `sort`.
- `PUT /api/events/[id]` - Update an event (Admin, Photographer only).
- `DELETE /api/events/[id]` - Delete an event (Admin only).
