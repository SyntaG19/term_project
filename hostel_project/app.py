import os
import pandas as pd
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Import our allocation logic
from allocation_logic import run_hostel_allocation

# --- CONFIGURATION ---

# Create folders if they don't exist
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

app = Flask(__name__, static_folder='static', static_url_path='')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
CORS(app) # Allow requests from our frontend

# --- STATIC FILE SERVER ---

@app.route('/')
def serve_index():
    """Serves the main index.html file."""
    return send_from_directory(app.static_folder, 'index.html')

# --- API ENDPOINTS ---

@app.route("/api/login", methods=["POST"])
def login():
    """
    A simple, unsecured login endpoint.
    In a real app, you would check a database and return a JWT token.
    """
    data = request.json
    email = data.get("email")
    password = data.get("password")

    # IMPORTANT: This is a dummy login.
    # We'll add real auth later.
    if email == "admin@iitj.ac.in" and password == "admin123":
        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": {"name": "Admin", "email": email}
        }), 200
    else:
        return jsonify({
            "success": False,
            "message": "Invalid email or password"
        }), 401

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handles the raw file upload."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        filename = secure_filename(file.filename)
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(save_path)
        
        # Return the path for the next step
        return jsonify({
            "success": True, 
            "message": "File uploaded successfully",
            "uploaded_path": save_path
        }), 200

@app.route('/api/run-allocation', methods=['POST'])
def run_allocation_endpoint():
    """
    Runs the allocation logic on the uploaded file.
    """
    data = request.json
    uploaded_path = data.get('uploaded_path')

    if not uploaded_path or not os.path.exists(uploaded_path):
        return jsonify({"error": "Uploaded file not found"}), 404

    try:
        # Run your allocation logic from the separate file
        result = run_hostel_allocation(
            input_file_path=uploaded_path,
            output_folder_path=app.config['OUTPUT_FOLDER']
        )
        
        # 'result' contains the filename of the output
        return jsonify({
            "success": True,
            "message": "Allocation completed!",
            "output_filename": result["output_filename"]
        }), 200

    except Exception as e:
        # Return any errors from the allocation script
        return jsonify({"error": f"Allocation failed: {str(e)}"}), 500

@app.route('/api/download/<filename>')
def download_file(filename):
    """Provides the download link for the output file."""
    try:
        return send_from_directory(
            app.config['OUTPUT_FOLDER'],
            filename,
            as_attachment=True
        )
    except FileNotFoundError:
        return jsonify({"error": "File not found"}), 404

# --- RUN THE APP ---

if __name__ == '__main__':
    # We use port 5001 to avoid conflicts
    app.run(debug=True, port=5001)