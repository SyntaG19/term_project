# backend/app.py
import os
from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
from flask_cors import CORS
from config import UPLOAD_FOLDER, OUTPUT_FOLDER
from allocation.main import run_pipeline
from flask import jsonify
from db import get_connection


ALLOWED_EXTENSIONS = {"xls", "xlsx", "csv"}

# Ensure upload/output folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

app = Flask(__name__)
CORS(app)  # allow requests from frontend dev server; configure origins in prod

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["OUTPUT_FOLDER"] = OUTPUT_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB max upload

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/upload", methods=["POST"])
def upload_file():
    """
    Uploads an Excel/CSV file and saves it to uploads/.
    Returns the saved path in JSON for later processing.
    """
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    f = request.files["file"]
    if f.filename == "":
        return jsonify({"error": "No selected file"}), 400
    if not allowed_file(f.filename):
        return jsonify({"error": "Invalid file type"}), 400

    filename = secure_filename(f.filename)
    saved_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    f.save(saved_path)

    return jsonify({"message": "File uploaded", "path": saved_path}), 200

@app.route("/run-allocation", methods=["POST"])
def run_allocation_route():
    """
    Trigger the allocation pipeline.
    Expects JSON: { "uploaded_path": "<uploads/xxx.xlsx>" }
    Runs the pipeline synchronously and returns final file path on success.
    """
    data = request.get_json() or {}
    uploaded_path = data.get("uploaded_path")
    if not uploaded_path or not os.path.exists(uploaded_path):
        return jsonify({"error": "uploaded_path missing or not found"}), 400

    try:
        result = run_pipeline(uploaded_input_path=uploaded_path, outputs_folder=app.config["OUTPUT_FOLDER"])
        return jsonify({"message": "Allocation completed", "result": result}), 200
    except Exception as e:
        # IMPORTANT: surface errors during development — sanitize for production
        return jsonify({"error": str(e)}), 500

@app.route("/download-results", methods=["GET"])
def download_results():
    """
    Download the latest final allocation file.
    Optionally accept ?filename=path to be explicit.
    """
    filename = request.args.get("filename")
    if filename:
        path = filename
    else:
        # default expected output in outputs folder
        path = os.path.join(app.config["OUTPUT_FOLDER"], "batch_constrained_allocation.xlsx")

    if not os.path.exists(path):
        return jsonify({"error": "File not found", "path": path}), 404

    return send_file(path, as_attachment=True)

# Example query endpoint (read-only), later replace with real DB queries
@app.route("/students", methods=["GET"])
def students_query():
    """
    Demo endpoint to return students from the last output file.
    Supports ?batch=UG3 and ?limit=100
    """
    path = os.path.join(app.config["OUTPUT_FOLDER"], "batch_constrained_allocation.xlsx")
    if not os.path.exists(path):
        return jsonify({"error": "Allocation results not present"}), 404

    import pandas as pd
    df = pd.read_excel(path)
    batch = request.args.get("batch")
    if batch:
        df = df[df["Batch"].astype(str) == batch]
    limit = request.args.get("limit")
    if limit:
        df = df.head(int(limit))
    return jsonify(df.to_dict(orient="records")), 200

# Example update endpoint (demo only) — for real DB updates use parametrized queries
@app.route("/update-student", methods=["POST"])
def update_student():
    """
    Demo: updates the allocation Excel (not DB) — expects JSON with Student_ID and Allocated_Room
    In production, update the DB instead.
    """
    payload = request.get_json() or {}
    sid = payload.get("Student_ID")
    new_room = payload.get("Allocated_Room")
    if sid is None or new_room is None:
        return jsonify({"error":"Student_ID and Allocated_Room required"}), 400

    import pandas as pd
    path = os.path.join(app.config["OUTPUT_FOLDER"], "batch_constrained_allocation.xlsx")
    if not os.path.exists(path):
        return jsonify({"error": "Allocation results not present"}), 404

    df = pd.read_excel(path)
    mask = df["Student_ID"].astype(str) == str(sid)
    if mask.sum() == 0:
        return jsonify({"error": "Student_ID not found"}), 404

    df.loc[mask, "Allocated_Room"] = new_room
    df.to_excel(path, index=False)
    return jsonify({"message": "Updated file saved", "path": path}), 200


# @app.route("/test-db", methods=["GET"])
# def test_db():
#     conn = get_connection()
#     if not conn:
#         return jsonify({"error": "Failed to connect to database"}), 500

#     cursor = conn.cursor()
#     cursor.execute("SHOW TABLES;")
#     tables = [row[0] for row in cursor.fetchall()]
#     cursor.close()
#     conn.close()

#     return jsonify({"message": "Connected successfully!", "tables": tables})

@app.route("/tables", methods=["GET"])
def show_tables():
    """
    List all tables in the connected MySQL database.
    """
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor()
    cursor.execute("SHOW TABLES;")
    tables = [t[0] for t in cursor.fetchall()]
    cursor.close()
    conn.close()

    return jsonify({"tables": tables})

@app.route("/table/<table_name>", methods=["GET"])
def show_table_data(table_name):
    """
    Show all data from a given table.
    """
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 100;")  # limit to 100 rows for safety
        rows = cursor.fetchall()
    except Exception as e:
        cursor.close()
        conn.close()
        return jsonify({"error": str(e)}), 400

    cursor.close()
    conn.close()

    return jsonify({"table": table_name, "count": len(rows), "data": rows})

# @app.route("/db-info")
# def db_info():
#     conn = get_connection()
#     cursor = conn.cursor()
#     cursor.execute("SELECT DATABASE();")
#     db_name = cursor.fetchone()[0]
#     cursor.execute("SHOW TABLES;")
#     tables = [t[0] for t in cursor.fetchall()]
#     cursor.close()
#     conn.close()
#     return jsonify({"database": db_name, "tables": tables})



if __name__ == "__main__":
    app.run(debug=True, port=5000)


