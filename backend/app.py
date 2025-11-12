from flask import Flask, jsonify, request
from flask_cors import CORS
from db import get_connection
from allocation.main import run_pipeline
from config import OUTPUT_FOLDER, UPLOAD_FOLDER
import os

app = Flask(__name__)
CORS(app)

# ---------- TEST ----------
@app.route("/")
def home():
    return jsonify({"message": "Flask backend running successfully!"})

@app.route("/test-db")
def test_db():
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Failed to connect to DB"}), 500
    cur = conn.cursor()
    cur.execute("SHOW TABLES;")
    tables = [t[0] for t in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify({"tables": tables})

# ---------- HOSTELS ----------
@app.route('/api/hostels', methods=['GET'])
def get_hostels():
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM hostel;")
    hostels = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(hostels)

@app.route('/api/hostels', methods=['POST'])
def add_hostel():
    data = request.json
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO hostel (hostel_name, gender, occupancy_type, total_rooms, year_allocated)
        VALUES (%s, %s, %s, %s, %s)
    """, (
        data['hostel_name'],
        data['gender'],
        data['occupancy_type'],
        data['total_rooms'],
        data.get('year_allocated', 2025)
    ))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"message": "Hostel added successfully"}), 201

#--------------------------
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"xls", "xlsx"}
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/api/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part in request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    from werkzeug.utils import secure_filename
    UPLOAD_FOLDER = "uploads"
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    filename = secure_filename(file.filename)
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(save_path)
    return jsonify({"message": "File uploaded successfully", "uploaded_path": save_path}), 200

# ---------- RUN ALLOCATION ----------
@app.route("/api/run-allocation", methods=["POST"])
def run_allocation():
    """
    Trigger the room allocation pipeline using the uploaded Excel file path.
    """
    data = request.get_json()
    uploaded_path = data.get("uploaded_path")

    if not uploaded_path or not os.path.exists(uploaded_path):
        return jsonify({"error": "Uploaded file not found"}), 400

    try:
        # Run the pipeline dynamically with uploaded file path
        result = run_pipeline(uploaded_input_path=uploaded_path, outputs_folder=OUTPUT_FOLDER)
        return jsonify({"message": "Allocation completed successfully", "result": result}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
