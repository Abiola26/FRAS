# fras (Fleet Reporting and Analytics System) - Project Overview

## 📋 Executive Summary

The **Fleet Reporting and Analytics System (fras)** is a full-stack web application designed to manage, analyze, and report on fleet data. The system provides comprehensive analytics, data visualization, file upload capabilities, and automated reporting features.

---

## 🏗️ Architecture Overview

### Technology Stack

#### **Backend** (FastAPI + PostgreSQL)
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL 12+
- **ORM**: SQLAlchemy 2.0
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Pydantic 2.0
- **Password Hashing**: Passlib with bcrypt
- **Data Processing**: Pandas
- **Report Generation**: openpyxl (Excel), ReportLab (PDF)
- **Email**: FastAPI-Mail

#### **Frontend** (React + Material-UI)
- **Framework**: React 18.3
- **Build Tool**: Vite 5
- **UI Library**: Material-UI (MUI) v5.15
- **Routing**: React Router DOM v6.20
- **Charts**: Chart.js with react-chartjs-2
- **HTTP Client**: Axios
- **Notifications**: Notistack
- **Date Handling**: date-fns

---

## 📁 Project Structure

```
c:\Projects\fras\
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── routers/           # API route handlers
│   │   │   ├── auth_routes.py      # Authentication endpoints
│   │   │   ├── fleet_routes.py     # Fleet CRUD operations
│   │   │   ├── file_routes.py      # File upload/processing
│   │   │   └── analytics_routes.py # Analytics & reporting
│   │   ├── auth.py            # JWT and authentication logic
│   │   ├── config.py          # Configuration management
│   │   ├── crud.py            # Database CRUD operations
│   │   ├── database.py        # Database connection
│   │   ├── dependencies.py    # FastAPI dependencies
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── schemas.py         # Pydantic schemas
│   │   └── utils.py           # Utilities (data processing, report generation)
│   ├── create_admin.py        # Script to create admin user
│   ├── create_tables.py       # Database initialization
│   ├── main.py                # Application entry point
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example          # Environment variable template
│   └── ARCHITECTURE.md        # Detailed architecture documentation
│
└── frontend/                  # React frontend
    ├── src/
    │   ├── components/        # Reusable React components
    │   │   └── layout/
    │   │       └── MainLayout.jsx
    │   ├── context/          # React context providers
    │   │   └── AuthContext.jsx
    │   ├── pages/            # Application pages
    │   │   ├── Login.jsx      # Login page
    │   │   ├── Dashboard.jsx  # Dashboard with stats
    │   │   ├── Upload.jsx     # File upload interface
    │   │   ├── Reports.jsx    # Reports viewing/download
    │   │   └── Analytics.jsx  # Analytics dashboard
    │   ├── services/         # API services
    │   │   └── api.js         # Axios instance with interceptors
    │   ├── theme/            # Material-UI theme
    │   │   └── theme.js
    │   ├── App.jsx           # Main app component
    │   └── main.jsx          # Entry point
    ├── package.json          # Node dependencies
    └── vite.config.js        # Vite configuration
```

---

## 🔑 Key Features

### 1. **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (Admin/User)
- Secure password hashing with bcrypt
- Token expiration and refresh handling

### 2. **Fleet Data Management**
- CRUD operations for fleet records
- Data validation and cleaning
- Bulk import via CSV/Excel files
- File size validation (10MB limit)
- Support for multiple file formats

### 3. **Analytics & Reporting**
- Comprehensive analytics dashboard
- Fleet performance summaries
- Daily subtotals and trends
- Filterable reports (by date range, fleet)
- Data visualization with charts

### 4. **File Operations**
- **Upload**: CSV/Excel file upload with validation
- **Download**: Export reports as Excel or PDF
- **Email**: Automated report delivery via email

### 5. **User Interface**
- Modern, responsive Material-UI design
- Real-time notifications
- Loading states and error handling
- Protected routes
- File drag-and-drop upload

---

## 🔄 Data Flow

### Authentication Flow
```
User enters credentials → Frontend sends to /auth/token
                       ↓
Backend validates credentials with database
                       ↓
JWT token generated and returned
                       ↓
Frontend stores token in localStorage
                       ↓
Token included in all subsequent API requests
```

### File Upload Flow
```
User selects file → Frontend validates file type/size
                  ↓
File sent to /files/upload-summary (multipart/form-data)
                  ↓
Backend validates and parses file (Pandas)
                  ↓
Data cleaned and validated
                  ↓
Records inserted into database
                  ↓
Summary Excel file generated
                  ↓
File returned to user for download
```

### Analytics Flow
```
User selects filters → Frontend requests /analytics/summary
                     ↓
Backend queries filtered records
                     ↓
DataProcessor analyzes data:
  - Calculates statistics
  - Groups by fleet
  - Calculates daily totals
                     ↓
Structured analytics returned
                     ↓
Frontend displays charts and tables
```

---

## 🗄️ Database Schema

### **Users Table**
```sql
users
├── id (Primary Key, Integer)
├── username (String, Unique, NOT NULL)
├── hashed_password (String, NOT NULL)
└── role (String, NOT NULL) -- 'admin' or 'user'
```

### **Fleet Records Table**
```sql
fleet_records
├── id (Primary Key, Integer)
├── date (Date, NOT NULL)
├── fleet (String, NOT NULL)
└── amount (Float, NOT NULL)
```

---

## 🌐 API Endpoints

### **Authentication**
- `POST /auth/token` - Login and get JWT token

### **Fleet Records**
- `POST /fleet/` - Create fleet record (authenticated)
- `GET /fleet/` - Get all fleet records with pagination (authenticated)
- `DELETE /fleet/{record_id}` - Delete fleet record (admin only)

### **File Upload**
- `POST /files/upload-summary` - Upload CSV/Excel and get summary (admin only)

### **Analytics & Reporting**
- `GET /analytics/summary` - Get analytics summary with filters
- `GET /analytics/filters` - Get available filter options
- `GET /analytics/download/excel` - Download Excel report
- `GET /analytics/download/pdf` - Download PDF report
- `POST /analytics/email-report` - Email report to user

### **Health Check**
- `GET /` - Root endpoint
- `GET /health` - Health check

---

## 🔐 Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Password Hashing**: bcrypt for password storage
3. **CORS Protection**: Configurable allowed origins
4. **Role-Based Access**: Admin-only endpoints protected
5. **Input Validation**: Pydantic schemas validate all inputs
6. **File Validation**: Type and size checks
7. **Environment Variables**: Sensitive data in .env files
8. **SQL Injection Protection**: SQLAlchemy ORM

---

## 📊 Current Status

### ✅ Completed Features
- Full authentication system
- Fleet data CRUD operations
- File upload and processing
- Analytics engine
- Excel/PDF report generation
- Email automation support
- Frontend UI with all major pages
- Protected routing
- Error handling and notifications

### 🚧 Development Status
- **Backend**: Production-ready, recently refactored (Dec 15, 2025)
- **Frontend**: Running on dev server (Vite)
- **Database**: PostgreSQL configured
- **Development Server**: Frontend running on `npm run dev` (51+ minutes uptime)

### 📝 Known Considerations
- Default admin credentials should be changed in production
- Email configuration needs SMTP settings in .env
- Frontend currently pointing to `localhost:8000` for API
- Some placeholder data in Dashboard (needs real API integration)

---

## 🚀 Getting Started

### Prerequisites
- **Backend**: Python 3.10+, PostgreSQL 12+
- **Frontend**: Node.js 16+, npm/yarn

### Backend Setup
```powershell
cd c:\Projects\FRAS\backend
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt

# Configure .env file (copy from .env.example)
# Setup database
python create_tables.py
python create_admin.py

# Run server
uvicorn main:app --reload
```

### Frontend Setup
```powershell
cd c:\Projects\FRAS\frontend
npm install
npm run dev
```

### Access
- **Frontend**: http://localhost:5173 (Vite default)
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🎯 Use Cases

1. **Fleet Manager**: Upload daily fleet data via CSV/Excel
2. **Analyst**: View analytics dashboard with filterable reports
3. **Executive**: Download PDF/Excel reports for presentations
4. **Admin**: Manage users and access control
5. **Operations**: Receive automated daily/weekly email reports

---

## 🔧 Configuration

### Backend Environment Variables
```env
DATABASE_URL=postgresql://user:password@localhost:5432/fleetdb
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Frontend Environment Variables
```env
VITE_API_URL=http://localhost:8000
```

---

## 📈 Recent Refactoring (December 15, 2025)

The backend underwent significant refactoring to improve:
- **Security**: Removed hardcoded secrets, improved JWT handling
- **Configuration**: Centralized settings management
- **Code Quality**: Added type hints, docstrings, better error handling
- **Features**: Enhanced file upload, analytics routes, PDF generation
- **Documentation**: Comprehensive README and architecture docs

See `backend/REFACTORING_SUMMARY.md` for detailed changes.

---

## 🔮 Future Enhancements

### Immediate
- [ ] Integrate real-time data in Dashboard
- [ ] Add unit tests (pytest for backend, Jest for frontend)
- [ ] Add database migrations (Alembic)

### Medium-term
- [ ] Rate limiting
- [ ] Redis caching
- [ ] Advanced data visualization
- [ ] User management UI
- [ ] Audit logging

### Long-term
- [ ] Microservices architecture
- [ ] Real-time notifications (WebSockets)
- [ ] Mobile app
- [ ] Machine learning predictions
- [ ] Multi-tenancy support

---

## 📞 Support & Maintenance

- **Documentation**: See backend/README.md and ARCHITECTURE.md
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Conversation History**: Recent work focused on resolving frontend build errors and backend refactoring

---

## 📄 License

This project is proprietary. All rights reserved.

---

**Last Updated**: December 16, 2025
**Project Status**: Active Development
**Current Version**: Backend v1.0.0, Frontend v0.0.0
