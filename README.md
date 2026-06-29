# Track23 - Fleet Management System

A comprehensive full-stack fleet management platform for tracking buses, managing drivers, remittance reconciliation, and maintenance workflows.

## 🚀 Features

- **Fleet Management**: Track and manage bus fleet with real-time status
- **Driver Management**: Register, approve, and manage drivers
- **Live Tracking**: Real-time GPS tracking of vehicles
- **Shift Management**: Dispatch shifts, handover confirmation, and close-out tracking
- **Remittance Reconciliation**: Track revenue collection with variance alerts
- **Maintenance Management**: Record maintenance tickets and track repairs
- **Trip Performance**: Monitor completed trips and passenger metrics
- **Role-Based Access**: Admin, Supervisor, Mechanic, and Driver roles
- **API Documentation**: Full Swagger/OpenAPI documentation

## 🛠 Tech Stack

### Backend

- **Framework**: Express.js 5.x
- **Database**: MySQL 8.0 with Prisma ORM
- **Authentication**: JWT with bcryptjs
- **Validation**: Zod
- **Security**: Helmet, rate limiting, CORS configuration
- **Logging**: Winston
- **Documentation**: Swagger/OpenAPI

### Frontend

- **Framework**: React 19
- **Routing**: React Router 7
- **HTTP Client**: Axios
- **Maps**: Leaflet + React-Leaflet
- **Build Tool**: Vite 7

## 📋 Prerequisites

- Node.js 20+
- MySQL 8.0+
- npm or yarn
- Docker & Docker Compose (optional)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/KAYDA23rd/Track-23.git
cd Track-23
```

### 2. Environment Setup

#### Backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
DATABASE_URL="mysql://user:password@localhost:3306/track23"
PORT=4000
NODE_ENV=development
JWT_SECRET=your_secure_jwt_secret_key_here
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

#### Frontend

Create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:4000
```

### 3. Database Setup

```bash
cd backend

# Install dependencies
npm install

# Run Prisma migrations
npx prisma migrate deploy

# (Optional) Seed the database
npx prisma db seed
```

### 4. Start the Application

#### Option A: Local Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Backend will run on `http://localhost:4000`
Frontend will run on `http://localhost:5173`

#### Option B: Docker Compose

```bash
docker-compose up --build
```

Access the application:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- API Documentation: `http://localhost:4000/api/docs`

## 📚 API Documentation

Once the backend is running, access the Swagger UI at:

```
http://localhost:4000/api/docs
```

### Key Endpoints

#### Authentication

- `POST /auth/login` - User login
- `POST /auth/driver/signup` - Driver self-signup
- `POST /auth/mechanic/signup` - Mechanic signup
- `POST /auth/supervisor/signup` - Supervisor signup
- `POST /auth/register` - Register user (admin only)
- `GET /auth/session` - Get current user session
- `GET /auth/pending-approvals` - Get pending approvals
- `POST /auth/approve/:userId` - Approve user account

#### Buses

- `GET /buses` - Get all buses
- `POST /buses` - Create new bus
- `GET /buses/:id` - Get bus details
- `PUT /buses/:id` - Update bus
- `DELETE /buses/:id` - Delete bus

#### Shifts

- `GET /shifts` - Get all shifts
- `POST /shifts` - Create shift
- `PUT /shifts/:id` - Update shift
- `POST /shifts/:id/complete` - Mark shift as complete
- `POST /shifts/:id/close` - Close shift

#### Remittances

- `GET /remittances` - Get remittances
- `POST /remittances` - Create remittance
- `PUT /remittances/:id/approve` - Approve remittance
- `PUT /remittances/:id/escalate` - Escalate remittance

## 🔐 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcryptjs (10 rounds)
- ✅ HTTP security headers (Helmet)
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ CORS with origin whitelisting
- ✅ Input validation with Zod
- ✅ Request payload size limits (10MB)
- ✅ Error message sanitization
- ✅ Graceful shutdown handling
- ✅ Centralized error handling

## 🧪 Testing

```bash
cd backend
npm test

cd ../frontend
npm test
```

## 📊 Project Structure

```
Track-23/
├── backend/
│   ├── src/
│   │   ├── auth/              # Authentication routes, controller, service
│   │   ├── buses/             # Bus management
│   │   ├── drivers/           # Driver management
│   │   ├── shifts/            # Shift management
│   │   ├── remittances/       # Remittance tracking
│   │   ├── maintenance/       # Maintenance tickets
│   │   ├── tracking/          # Live driver tracking
│   │   ├── reports/           # Analytics and reports
│   │   ├── middleware/        # Express middleware
│   │   ├── config/            # Configuration (database, swagger)
│   │   └── utils/             # Utilities (error handling, validation, logging)
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # DB migrations
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── api/               # API client configuration
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Admin console
│   │   ├── driver/            # Driver app
│   │   ├── mechanic/          # Mechanic app
│   │   ├── supervisor/        # Supervisor app
│   │   ├── styles/            # CSS styles
│   │   └── utils/             # Utility functions
│   └── .env.example
│
├── docker-compose.yml
└── README.md
```

## 🔄 Database Migrations

### Create a new migration

```bash
cd backend
npx prisma migrate dev --name add_new_feature
```

### Apply pending migrations

```bash
npx prisma migrate deploy
```

### View database

```bash
npx prisma studio
```

## 📈 Improvements Implemented

### Backend Enhancements

✅ Centralized error handling middleware
✅ Input validation with Zod schemas
✅ Security hardening (Helmet, rate limiting, CORS)
✅ Prisma singleton pattern (fixes N+1 queries)
✅ Service layer architecture (separation of concerns)
✅ Winston logging infrastructure
✅ Constants and configuration management
✅ Graceful shutdown handling
✅ Comprehensive error responses

### Frontend Enhancements

✅ Custom `useApi` hook with retry logic
✅ Error alert component with dismissal
✅ Loading spinner component
✅ Enhanced API interceptor with error formatting
✅ Structured error handling
✅ CSS components for reusability

### Infrastructure

✅ Docker and Docker Compose setup
✅ Environment configuration template
✅ Swagger/OpenAPI documentation
✅ CI/CD ready structure

## 🚀 Deployment

### Using Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Manual Deployment

1. **Install dependencies**:

```bash
cd backend && npm ci --production
cd ../frontend && npm ci --production
```

2. **Build frontend**:

```bash
cd frontend
npm run build
# Output goes to dist/
```

3. **Set production environment variables**

4. **Start backend**:

```bash
cd backend
NODE_ENV=production npm start
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check MySQL is running
docker ps | grep mysql

# Reset database
npx prisma migrate reset
```

### Port Already in Use

```bash
# Change port in .env
PORT=4001

# Or kill process using the port
lsof -i :4000
kill -9 <PID>
```

### Node Modules Issues

```bash
rm -rf node_modules package-lock.json
npm install
```

## 📝 Best Practices

- Always validate input using Zod schemas
- Use the error handler for consistent error responses
- Leverage services for business logic reusability
- Write tests for critical paths
- Follow the established folder structure
- Use Winston logger for debugging
- Handle database transactions for multi-step operations

## 📞 Support

For issues and questions:

- Create a GitHub issue
- Check existing documentation
- Review Swagger API docs at `/api/docs`

## 📄 License

ISC License - See LICENSE file for details

## 👥 Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

---

**Last Updated**: June 29, 2026
**Version**: 1.0.0
