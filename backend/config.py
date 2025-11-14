import os

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "password",
    "database": "hostel_allocation"
}

# Get the backend directory (where this config.py file is located)
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))

# Paths used by backend - use absolute paths
UPLOAD_FOLDER = os.path.join(BACKEND_DIR, "uploads")
OUTPUT_FOLDER = os.path.join(BACKEND_DIR, "outputs")

# Create folders if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

print(f"Using database config: {DB_CONFIG['database']} on {DB_CONFIG['host']}")
print(f"Upload folder: {UPLOAD_FOLDER}")
print(f"Output folder: {OUTPUT_FOLDER}")
