# Incident Desk System

A Laravel + React incident management system for handling citizen reports. Citizens can report issues like broken streetlights or potholes, operators assign them to agents, and agents work on resolving them.

## What it does

**Citizens** can report incidents and track their status
**Operators** can see all incidents, assign them to agents, and import data from CSV files  
**Agents** can see their assigned incidents and update the status
**Admins** can manage users, view system stats, and configure settings

## Main features

- Report incidents with photos and location data
- Assign incidents to specific agents
- Real-time notifications when status changes
- CSV import for bulk data
- File attachments for evidence
- Complete audit trail of all actions
- Rate limiting to prevent abuse
- Background job processing
- User role management

## Tech stack

**Backend**: Laravel 11 with PostgreSQL
**Frontend**: React 18 with CSS modules
**Auth**: Laravel Sanctum (JWT tokens)
**Database**: PostgreSQL with migrations
**File storage**: Laravel storage system
**Background jobs**: Laravel queues

## Setup

You'll need PHP 8.2+, Node.js 18+, PostgreSQL, and Composer installed.

### Backend setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Edit .env file with your database credentials
php artisan migrate
php artisan db:seed
php artisan serve
```

### Frontend setup
```bash
cd frontend
npm install
npm start
```

The app will be available at http://localhost:3000

## Test accounts

| Role | Email | Password |
|------|-------|----------|
| Citizen | citizen@test.com | password |
| Operator | operator@test.com | password |
| Agent | agent@test.com | password |
| Admin | admin@test.com | password |

## How to use

**Citizens**: Login and click "Report New Incident" to create reports. You can track status and get notifications when things change.

**Operators**: See all incidents, assign them to agents, set priorities, and import CSV files.

**Agents**: View your assigned incidents, update status, and add progress notes.

**Admins**: Manage users, view system stats, configure rate limits, and see audit logs.

## API

All endpoints need a Bearer token. Login with POST /api/login to get one.

Main endpoints:
- `GET /api/incidents` - List incidents (operators/admins)
- `POST /api/incidents` - Create incident (citizens)
- `GET /api/my-incidents` - Your incidents (citizens)
- `POST /api/incidents/{id}/assign` - Assign incident (operators)
- `POST /api/incidents/{id}/status` - Update status (agents)
- `GET /api/notifications` - Get notifications
- `GET /api/users` - List users (admins)

## Database

Main tables: users, incidents, categories, attachments, incident_notes, audit_logs, notifications, rate_limits

Users create incidents, incidents belong to categories, agents get assigned incidents, and incidents can have attachments and notes.

## 🔧 Configuration

### **Rate Limiting**
The system includes configurable rate limiting:
- **Login**: 50 attempts per hour
- **API**: 1000 requests per hour
- **Incident Creation**: 100 per hour
- **File Upload**: 200 per hour
- **CSV Import**: 20 per hour

Admins can modify these limits through the admin dashboard.

### **Background Jobs**
The system uses Laravel Queues for:
- Email notifications
- CSV import processing
- System cleanup tasks
- Report generation

## 🧪 Testing

### **Backend Tests**
```bash
cd backend
php artisan test
```

### **Frontend Tests**
```bash
cd frontend
npm test
```

### **Manual Testing**
1. Use the provided test users
2. Test all user roles and permissions
3. Verify notification system
4. Test file uploads and CSV imports
5. Check rate limiting functionality

## 🚀 Deployment

### **Production Setup**
1. **Environment**: Set `APP_ENV=production` in `.env`
2. **Database**: Use production PostgreSQL instance
3. **Storage**: Configure cloud storage for file uploads
4. **Queue**: Set up Redis or database queue driver
5. **Web Server**: Configure Apache/Nginx for Laravel
6. **Frontend**: Build and serve static files

### **Environment Variables**
```env
APP_ENV=production
APP_DEBUG=false
DB_CONNECTION=pgsql
DB_HOST=your-db-host
DB_DATABASE=incident_desk
DB_USERNAME=your-username
DB_PASSWORD=your-password
QUEUE_CONNECTION=database
```

## 🎯 Project Status

- ✅ **Core Functionality**: Complete
- ✅ **User Management**: Complete
- ✅ **Notification System**: Complete
- ✅ **File Handling**: Complete
- ✅ **Admin Features**: Complete
- ✅ **Rate Limiting**: Complete
- ✅ **Background Jobs**: Complete
- ✅ **Frontend Interface**: Complete
- ⚠️ **Idempotency**: Pending (for production use)

---

**Built using Laravel and React**
