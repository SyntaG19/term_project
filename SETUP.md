# Hostel Allocation Management System - Setup Guide

## Prerequisites

1. Python 3.8 or higher
2. MySQL Database (PopSQL or local MySQL server)
3. Node.js (optional, for package management)

## Database Setup

1. Create the database using the provided SQL script:
   ```sql
   CREATE DATABASE IF NOT EXISTS hostel_allocation;
   USE hostel_allocation;
   ```

2. Run all the SQL commands from your SQL file to create tables and insert initial data.

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Update database configuration in `backend/config.py`:
   ```python
   DB_CONFIG = {
       "host": "localhost",  # or your PopSQL host
       "user": "your_username",
       "password": "your_password",
       "database": "hostel_allocation"
   }
   ```

4. Run the Flask backend server:
   ```bash
   python app.py
   ```

   The server will start on `http://localhost:5000`

## Frontend Setup

The frontend is already set up in the `web_app` directory. It will be served by the Flask backend.

1. Make sure the backend is running
2. Open your browser and navigate to `http://localhost:5000`
3. The frontend will be automatically served

## API Endpoints

All API endpoints are prefixed with `/api/`:

- `/api/hostels` - Hostel management
- `/api/students` - Student management
- `/api/rooms` - Room management
- `/api/batches` - Batch management
- `/api/administrators` - Administrator management
- `/api/roommates` - Roommate pair management
- `/api/room-alloc-zones` - Room allocation zone management
- `/api/dashboard/stats` - Dashboard statistics

## Testing

1. Test database connection:
   ```bash
   curl http://localhost:5000/test-db
   ```

2. Test API endpoint:
   ```bash
   curl http://localhost:5000/api/hostels
   ```

## Troubleshooting

1. **Database connection error**: 
   - Check database credentials in `backend/config.py`
   - Ensure MySQL server is running
   - Verify database exists

2. **CORS errors**:
   - Make sure `flask-cors` is installed
   - Check that CORS is enabled in `backend/app.py`

3. **Frontend not loading**:
   - Ensure backend is running
   - Check browser console for errors
   - Verify API URL in `web_app/static/js/api.js`

## Project Structure

```
.
├── backend/
│   ├── app.py              # Flask application
│   ├── config.py           # Database configuration
│   ├── db.py               # Database connection
│   └── requirements.txt    # Python dependencies
├── web_app/
│   ├── index.html          # Main HTML file
│   └── static/
│       ├── css/
│       │   └── styles.css  # Styles
│       └── js/
│           ├── api.js      # API utilities
│           ├── app.js      # Main router
│           └── ...         # Page modules
└── SETUP.md                # This file
```
