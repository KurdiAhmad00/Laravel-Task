# Incident Desk System

A full-stack web application for managing citizen reports and incident tracking. Think of it like a digital helpdesk where people can report problems (like broken streetlights or potholes), and city workers can track and fix them.

## How it works

- **Citizens** report problems and get updates on their status
- **Operators** see all reports and assign them to field workers
- **Agents** (field workers) handle assigned reports and update progress
- **Admins** manage the system and users

## Key Features

- **Report Issues**: Citizens can report problems with photos and location
- **Smart Assignment**: Operators assign reports to the right field workers
- **Real-time Updates**: Everyone gets notified when something changes
- **File Management**: Upload photos and documents as evidence
- **Bulk Import**: Operators can import lots of data from CSV files
- **Security**: Rate limiting prevents spam and abuse
- **Audit Trail**: Track who did what and when
- **Admin Controls**: Manage users and system settings

## What's Under the Hood

- **Backend**: Laravel 11 (PHP framework)
- **Frontend**: React 18 (JavaScript library)
- **Database**: PostgreSQL (stores all the data)
- **Authentication**: JWT tokens (secure login)
- **File Storage**: Local storage system
- **Background Jobs**: Queue system for heavy tasks

## Getting Started

**Prerequisites**: PHP 8.2+, Node.js 18+, PostgreSQL, and Composer

### 1. Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Edit .env file with your database details
php artisan migrate
php artisan db:seed
php artisan serve
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 3. Access the App
Open http://localhost:3000 in your browser

**Note**: Make sure PostgreSQL is running and update the database credentials in the `.env` file!

## Try It Out

Use these test accounts to explore different user roles:

| Role | Email | Password | What they can do |
|------|-------|----------|------------------|
| **Citizen** | citizen@test.com | password | Report issues, track status |
| **Operator** | operator@test.com | password | Assign reports, import data |
| **Agent** | agent@test.com | password | Handle assigned reports |
| **Admin** | admin@test.com | password | Manage system and users |

## How Each Role Works

**👤 Citizens**: 
- Report new incidents with photos and location
- Track the status of their reports
- Get notifications when things change

**👥 Operators**: 
- See all incidents in the system
- Assign reports to field workers
- Set priority levels
- Import bulk data from CSV files

**🔧 Agents**: 
- View only their assigned incidents
- Update status and add progress notes
- Upload photos as proof of work

**⚙️ Admins**: 
- Manage all users and their roles
- View system statistics
- Configure rate limits
- Monitor audit logs

## Project Structure

```
Laravel-Task/
├── backend/                 # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/    # API endpoints
│   │   ├── Models/              # Database models
│   │   ├── Jobs/                # Background jobs
│   │   └── Services/            # Business logic
│   ├── database/
│   │   ├── migrations/          # Database schema
│   │   └── seeders/             # Sample data
│   └── routes/api.php           # API routes
├── frontend/                # React app
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── services/            # API calls
│   │   └── routes/              # App routing
│   └── public/                  # Static files
└── README.md
```

## API Endpoints

All API calls need authentication. Login first to get a token.

**Main endpoints:**
- `POST /api/login` - Get authentication token
- `GET /api/incidents` - List all incidents (operators/admins)
- `POST /api/incidents` - Create new incident (citizens)
- `GET /api/my-incidents` - Your incidents (citizens)
- `POST /api/incidents/{id}/assign` - Assign incident (operators)
- `POST /api/incidents/{id}/status` - Update status (agents)
- `GET /api/notifications` - Get notifications
- `GET /api/users` - List users (admins only)

## Database Schema

The system uses these main tables:

- **users** - All system users (citizens, operators, agents, admins)
- **incidents** - Citizen reports with status and location
- **categories** - Types of incidents (streetlight, pothole, etc.)
- **attachments** - Photos and files uploaded with incidents
- **incident_notes** - Progress updates and comments
- **audit_logs** - Track all system changes
- **notifications** - User notifications
- **rate_limits** - Configurable API limits

**How it all connects**: Users create incidents, incidents belong to categories, agents get assigned incidents, and incidents can have attachments and notes.

## System Features

### Rate Limiting
Prevents spam and abuse with these limits:
- **Login**: 50 attempts per hour
- **API**: 1000 requests per hour  
- **Incident Creation**: 100 per hour
- **File Upload**: 200 per hour
- **CSV Import**: 20 per hour

*Admins can adjust these limits through the dashboard.*

### Background Jobs
Heavy tasks run in the background:
- Email notifications
- CSV file processing
- System cleanup
- Report generation

*This keeps the app responsive even with large files.*

## Testing the System

### Quick Test
1. Use the test accounts above
2. Try each user role to see different features
3. Test file uploads and notifications
4. Check that rate limiting works

### Running Tests
```bash
# Backend tests
cd backend && php artisan test

# Frontend tests  
cd frontend && npm test
```

### What to Test
- ✅ All user roles work correctly
- ✅ File uploads and downloads
- ✅ Notifications appear when expected
- ✅ CSV import functionality
- ✅ Rate limiting prevents abuse
- ✅ Admin controls work properly

## Going Live (Production)

### What You Need
- A web server (Apache/Nginx)
- PostgreSQL database
- PHP 8.2+ and Node.js 18+
- SSL certificate for security

### Key Settings
```env
APP_ENV=production
APP_DEBUG=false
DB_CONNECTION=pgsql
DB_HOST=your-database-server
DB_DATABASE=incident_desk
DB_USERNAME=your-username
DB_PASSWORD=your-password
```

### Steps
1. Set up your production database
2. Update the `.env` file with production settings
3. Run migrations and seeders
4. Build the frontend: `npm run build`
5. Configure your web server
6. Set up file storage for uploads

## What's Complete ✅

- **User Management**: All roles work perfectly
- **Incident System**: Full CRUD operations
- **Notifications**: Real-time updates
- **File Handling**: Upload and download
- **Admin Dashboard**: Complete management tools
- **Security**: Rate limiting and authentication
- **Background Jobs**: Heavy tasks run smoothly
- **Frontend**: Clean, responsive interface

## What's Next 🔄

- **Idempotency**: For production-grade API reliability
- **Email Notifications**: Configure SMTP for real emails
- **Cloud Storage**: Move file storage to AWS/S3
- **Monitoring**: Add logging and error tracking

---

*Built with Laravel 11 and React 18*
