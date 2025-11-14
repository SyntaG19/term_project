# Hostel Allocation Management System - Frontend

This is the frontend application for the Hostel Allocation Management System.

## Features

- **Dashboard**: View system statistics and overview
- **Hostels Management**: CRUD operations for hostels
- **Students Management**: CRUD operations for students
- **Rooms Management**: CRUD operations for rooms
- **Batches Management**: CRUD operations for batches
- **Administrators Management**: CRUD operations for administrators
- **Roommates Management**: CRUD operations for roommate pairs
- **Allocation Zones Management**: CRUD operations for room allocation zones

## Setup

1. Make sure the backend server is running on `http://localhost:5000`
2. Update the API URL in `static/js/api.js` if your backend is running on a different port
3. Open `index.html` in a web browser or access through the Flask backend

## File Structure

```
web_app/
├── index.html          # Main HTML file
├── static/
│   ├── css/
│   │   └── styles.css  # Main stylesheet
│   └── js/
│       ├── api.js      # API utility functions
│       ├── app.js      # Main application router
│       ├── modal.js    # Modal management
│       ├── utils.js    # Utility functions
│       ├── dashboard.js # Dashboard page
│       ├── hostels.js  # Hostels page
│       ├── students.js # Students page
│       ├── rooms.js    # Rooms page
│       ├── batches.js  # Batches page
│       ├── administrators.js # Administrators page
│       ├── roommates.js # Roommates page
│       └── zones.js    # Allocation zones page
└── README.md
```

## Usage

1. Start the backend server:
   ```bash
   cd backend
   python app.py
   ```

2. Open your browser and navigate to `http://localhost:5000`

3. Use the sidebar navigation to access different sections

## API Configuration

The frontend communicates with the backend API. Make sure the `API_BASE_URL` in `static/js/api.js` matches your backend server URL.

Default: `http://localhost:5000/api`
