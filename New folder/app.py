from flask import Flask, jsonify, request, send_from_directory, send_file
from flask_cors import CORS
from db import get_connection
import mysql.connector
from mysql.connector import Error
import os
from werkzeug.utils import secure_filename
from allocation_service import run_allocation_pipeline, fill_remaining_rooms
from config import UPLOAD_FOLDER, OUTPUT_FOLDER
import pandas as pd

# Get the base directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB_APP_DIR = os.path.join(BASE_DIR, 'web_app')
WEB_FRONTEND_DIR = os.path.join(BASE_DIR, 'web_frontend')

app = Flask(__name__)
# Enable CORS for all routes
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Helper function to handle database errors
def handle_db_error(e):
    """Handle database errors and return JSON response"""
    print(f"Database error: {str(e)}")
    import traceback
    traceback.print_exc()
    return jsonify({"error": f"Database error: {str(e)}"}), 500

# ========== HOSTELS ==========
@app.route('/api/hostels', methods=['GET'])
def get_hostels():
    try:
        conn = get_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM hostel ORDER BY hostel_id;")
        hostels = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(hostels)
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/hostels/<int:hostel_id>', methods=['GET'])
def get_hostel(hostel_id):
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM hostel WHERE hostel_id = %s;", (hostel_id,))
        hostel = cur.fetchone()
        cur.close()
        conn.close()
        if not hostel:
            return jsonify({"error": "Hostel not found"}), 404
        return jsonify(hostel)
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/hostels', methods=['POST'])
def add_hostel():
    try:
        data = request.json
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO hostel (hostel_name, gender, occupancy_type, total_rooms, phase)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            data.get('hostel_name'),
            data.get('gender'),
            data.get('occupancy_type'),
            data.get('total_rooms'),
            data.get('phase')
        ))
        conn.commit()
        hostel_id = cur.lastrowid
        cur.close()
        conn.close()
        return jsonify({"message": "Hostel added successfully", "hostel_id": hostel_id}), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/hostels/<int:hostel_id>', methods=['PUT'])
def update_hostel(hostel_id):
    try:
        data = request.json
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE hostel 
            SET hostel_name = %s, gender = %s, occupancy_type = %s, 
                total_rooms = %s, phase = %s
            WHERE hostel_id = %s
        """, (
            data.get('hostel_name'),
            data.get('gender'),
            data.get('occupancy_type'),
            data.get('total_rooms'),
            data.get('phase'),
            hostel_id
        ))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Hostel updated successfully"}), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/hostels/<int:hostel_id>', methods=['DELETE'])
def delete_hostel(hostel_id):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM hostel WHERE hostel_id = %s;", (hostel_id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Hostel deleted successfully"}), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

# ========== STUDENTS ==========
@app.route('/api/students', methods=['GET'])
def get_students():
    try:
        conn = get_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT s.*, h.hostel_name, b.batch_id as batch_name
            FROM student s
            LEFT JOIN hostel h ON s.hostel_id = h.hostel_id
            LEFT JOIN batches b ON s.batch_id = b.batch_id
            ORDER BY s.student_id;
        """)
        students = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(students), 200
    except Error as e:
        print(f"Database error: {str(e)}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

@app.route('/api/students/<int:student_id>', methods=['GET'])
def get_student(student_id):
    try:
        conn = get_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT s.*, h.hostel_name, b.batch_id as batch_name
            FROM student s
            LEFT JOIN hostel h ON s.hostel_id = h.hostel_id
            LEFT JOIN batches b ON s.batch_id = b.batch_id
            WHERE s.student_id = %s;
        """, (student_id,))
        student = cur.fetchone()
        cur.close()
        conn.close()
        if not student:
            return jsonify({"error": "Student not found"}), 404
        return jsonify(student), 200
    except Error as e:
        return handle_db_error(e)
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

@app.route('/api/students', methods=['POST'])
def add_student():
    try:
        data = request.json
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO student (roll_no, name, year, gender, department, phone, email, rm_key, hostel_id, batch_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data.get('roll_no'),
            data.get('name'),
            data.get('year'),
            data.get('gender'),
            data.get('department'),
            data.get('phone'),
            data.get('email'),
            data.get('rm_key', 0),
            data.get('hostel_id'),
            data.get('batch_id')
        ))
        conn.commit()
        student_id = cur.lastrowid
        cur.close()
        conn.close()
        return jsonify({"message": "Student added successfully", "student_id": student_id}), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/students/<int:student_id>', methods=['PUT'])
def update_student(student_id):
    try:
        data = request.json
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE student 
            SET roll_no = %s, name = %s, year = %s, gender = %s, 
                department = %s, phone = %s, email = %s, rm_key = %s, 
                hostel_id = %s, batch_id = %s
            WHERE student_id = %s
        """, (
            data.get('roll_no'),
            data.get('name'),
            data.get('year'),
            data.get('gender'),
            data.get('department'),
            data.get('phone'),
            data.get('email'),
            data.get('rm_key', 0),
            data.get('hostel_id'),
            data.get('batch_id'),
            student_id
        ))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Student updated successfully"}), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/students/<int:student_id>', methods=['DELETE'])
def delete_student(student_id):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM student WHERE student_id = %s;", (student_id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Student deleted successfully"}), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

# ========== ROOMS ==========
@app.route('/api/rooms', methods=['GET'])
def get_rooms():
    try:
        conn = get_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT r.*, h.hostel_name, s.name as student_name, s.roll_no
            FROM room r
            LEFT JOIN hostel h ON r.hostel_id = h.hostel_id
            LEFT JOIN student s ON r.allotted_to = s.student_id
            ORDER BY r.hostel_id, r.floor_no, r.room_no;
        """)
        rooms = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(rooms), 200
    except Error as e:
        print(f"Database error: {str(e)}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

@app.route('/api/rooms/<int:room_id>', methods=['GET'])
def get_room(room_id):
    try:
        conn = get_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT r.*, h.hostel_name, s.name as student_name, s.roll_no
            FROM room r
            LEFT JOIN hostel h ON r.hostel_id = h.hostel_id
            LEFT JOIN student s ON r.allotted_to = s.student_id
            WHERE r.room_id = %s;
        """, (room_id,))
        room = cur.fetchone()
        cur.close()
        conn.close()
        if not room:
            return jsonify({"error": "Room not found"}), 404
        return jsonify(room), 200
    except Error as e:
        return handle_db_error(e)
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

@app.route('/api/rooms', methods=['POST'])
def add_room():
    try:
        data = request.json
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO room (hostel_id, wing_code, floor_no, room_no, bed_id, allotted_to)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            data.get('hostel_id'),
            data.get('wing_code'),
            data.get('floor_no'),
            data.get('room_no'),
            data.get('bed_id', 'A1'),
            data.get('allotted_to')
        ))
        conn.commit()
        room_id = cur.lastrowid
        cur.close()
        conn.close()
        return jsonify({"message": "Room added successfully", "room_id": room_id}), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/rooms/<int:room_id>', methods=['PUT'])
def update_room(room_id):
    try:
        data = request.json
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE room 
            SET hostel_id = %s, wing_code = %s, floor_no = %s, 
                room_no = %s, bed_id = %s, allotted_to = %s
            WHERE room_id = %s
        """, (
            data.get('hostel_id'),
            data.get('wing_code'),
            data.get('floor_no'),
            data.get('room_no'),
            data.get('bed_id'),
            data.get('allotted_to'),
            room_id
        ))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Room updated successfully"}), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/rooms/<int:room_id>', methods=['DELETE'])
def delete_room(room_id):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM room WHERE room_id = %s;", (room_id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Room deleted successfully"}), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

# ========== BATCHES ==========
@app.route('/api/batches', methods=['GET'])
def get_batches():
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM batches ORDER BY batch_id;")
        batches = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(batches)
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/batches/<batch_id>', methods=['GET'])
def get_batch(batch_id):
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM batches WHERE batch_id = %s;", (batch_id,))
        batch = cur.fetchone()
        cur.close()
        conn.close()
        if not batch:
            return jsonify({"error": "Batch not found"}), 404
        return jsonify(batch)
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/batches', methods=['POST'])
def add_batch():
    try:
        data = request.json
        conn = get_connection()
        cur = conn.cursor()
        # Check if batch_name column exists, if not use batch_id as batch_name
        cur.execute("SHOW COLUMNS FROM batches LIKE 'batch_name'")
        has_batch_name = cur.fetchone() is not None
        
        if has_batch_name:
            cur.execute("""
                INSERT INTO batches (batch_id, batch_name, program, year_of_study, remarks)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                data.get('batch_id'),
                data.get('batch_name') or data.get('batch_id'),
                data.get('program'),
                data.get('year_of_study'),
                data.get('remarks')
            ))
        else:
            # Fallback for older schema without batch_name
            cur.execute("""
                INSERT INTO batches (batch_id, program, year_of_study, remarks)
                VALUES (%s, %s, %s, %s)
            """, (
                data.get('batch_id'),
                data.get('program'),
                data.get('year_of_study'),
                data.get('remarks')
            ))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Batch added successfully"}), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/batches/<batch_id>', methods=['PUT'])
def update_batch(batch_id):
    try:
        data = request.json
        conn = get_connection()
        cur = conn.cursor()
        # Check if batch_name column exists
        cur.execute("SHOW COLUMNS FROM batches LIKE 'batch_name'")
        has_batch_name = cur.fetchone() is not None
        
        if has_batch_name:
            cur.execute("""
                UPDATE batches 
                SET batch_name = %s, program = %s, year_of_study = %s, remarks = %s
                WHERE batch_id = %s
            """, (
                data.get('batch_name'),
                data.get('program'),
                data.get('year_of_study'),
                data.get('remarks'),
                batch_id
            ))
        else:
            # Fallback for older schema
            cur.execute("""
                UPDATE batches 
                SET program = %s, year_of_study = %s, remarks = %s
                WHERE batch_id = %s
            """, (
                data.get('program'),
                data.get('year_of_study'),
                data.get('remarks'),
                batch_id
            ))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Batch updated successfully"}), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/batches/<batch_id>', methods=['DELETE'])
def delete_batch(batch_id):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM batches WHERE batch_id = %s;", (batch_id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Batch deleted successfully"}), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

# ========== ADMINISTRATORS ==========
@app.route('/api/administrators', methods=['GET'])
def get_administrators():
    try:
        conn = get_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT a.*, h.hostel_name
            FROM administrator a
            LEFT JOIN hostel h ON a.hostel_id = h.hostel_id
            ORDER BY a.admin_id;
        """)
        administrators = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(administrators), 200
    except Error as e:
        print(f"Database error: {str(e)}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

@app.route('/api/administrators/<int:admin_id>', methods=['GET'])
def get_administrator(admin_id):
    try:
        conn = get_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT a.*, h.hostel_name
            FROM administrator a
            LEFT JOIN hostel h ON a.hostel_id = h.hostel_id
            WHERE a.admin_id = %s;
        """, (admin_id,))
        administrator = cur.fetchone()
        cur.close()
        conn.close()
        if not administrator:
            return jsonify({"error": "Administrator not found"}), 404
        return jsonify(administrator), 200
    except Error as e:
        return handle_db_error(e)
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

@app.route('/api/administrators', methods=['POST'])
def add_administrator():
    try:
        data = request.json
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO administrator (first_name, last_name, designation, contact_phone, email, hostel_id)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            data.get('first_name'),
            data.get('last_name'),
            data.get('designation'),
            data.get('contact_phone'),
            data.get('email'),
            data.get('hostel_id')
        ))
        conn.commit()
        admin_id = cur.lastrowid
        cur.close()
        conn.close()
        return jsonify({"message": "Administrator added successfully", "admin_id": admin_id}), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/administrators/<int:admin_id>', methods=['PUT'])
def update_administrator(admin_id):
    try:
        data = request.json
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE administrator 
            SET first_name = %s, last_name = %s, designation = %s, 
                contact_phone = %s, email = %s, hostel_id = %s
            WHERE admin_id = %s
        """, (
            data.get('first_name'),
            data.get('last_name'),
            data.get('designation'),
            data.get('contact_phone'),
            data.get('email'),
            data.get('hostel_id'),
            admin_id
        ))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Administrator updated successfully"}), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/administrators/<int:admin_id>', methods=['DELETE'])
def delete_administrator(admin_id):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM administrator WHERE admin_id = %s;", (admin_id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Administrator deleted successfully"}), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

# ========== ROOMMATES ==========
@app.route('/api/roommates', methods=['GET'])
def get_roommates():
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT rm.*, 
                   s1.name as student1_name, s1.roll_no as student1_roll,
                   s2.name as student2_name, s2.roll_no as student2_roll
            FROM roommates rm
            LEFT JOIN student s1 ON rm.student1_id = s1.student_id
            LEFT JOIN student s2 ON rm.student2_id = s2.student_id
            ORDER BY rm.rm_key;
        """)
        roommates = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(roommates)
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/roommates/<int:rm_key>', methods=['GET'])
def get_roommate(rm_key):
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT rm.*, 
                   s1.name as student1_name, s1.roll_no as student1_roll,
                   s2.name as student2_name, s2.roll_no as student2_roll
            FROM roommates rm
            LEFT JOIN student s1 ON rm.student1_id = s1.student_id
            LEFT JOIN student s2 ON rm.student2_id = s2.student_id
            WHERE rm.rm_key = %s;
        """, (rm_key,))
        roommate = cur.fetchone()
        cur.close()
        conn.close()
        if not roommate:
            return jsonify({"error": "Roommate pair not found"}), 404
        return jsonify(roommate)
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/roommates', methods=['POST'])
def add_roommate():
    try:
        data = request.json
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO roommates (rm_key, student1_id, student2_id)
            VALUES (%s, %s, %s)
        """, (
            data.get('rm_key'),
            data.get('student1_id'),
            data.get('student2_id')
        ))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Roommate pair added successfully"}), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/roommates/<int:rm_key>', methods=['PUT'])
def update_roommate(rm_key):
    try:
        data = request.json
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE roommates 
            SET student1_id = %s, student2_id = %s
            WHERE rm_key = %s
        """, (
            data.get('student1_id'),
            data.get('student2_id'),
            rm_key
        ))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Roommate pair updated successfully"}), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/roommates/<int:rm_key>', methods=['DELETE'])
def delete_roommate(rm_key):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM roommates WHERE rm_key = %s;", (rm_key,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Roommate pair deleted successfully"}), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

# ========== ROOM ALLOC ZONES ==========
@app.route('/api/room-alloc-zones', methods=['GET'])
def get_room_alloc_zones():
    try:
        conn = get_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT raz.*, h.hostel_name, b.batch_id as batch_name
            FROM room_alloc_zones raz
            LEFT JOIN hostel h ON raz.hostel_id = h.hostel_id
            LEFT JOIN batches b ON raz.batch_id = b.batch_id
            ORDER BY raz.zone_id;
        """)
        zones = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(zones), 200
    except Error as e:
        print(f"Database error: {str(e)}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

@app.route('/api/room-alloc-zones/<int:zone_id>', methods=['GET'])
def get_room_alloc_zone(zone_id):
    try:
        conn = get_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT raz.*, h.hostel_name, b.batch_id as batch_name
            FROM room_alloc_zones raz
            LEFT JOIN hostel h ON raz.hostel_id = h.hostel_id
            LEFT JOIN batches b ON raz.batch_id = b.batch_id
            WHERE raz.zone_id = %s;
        """, (zone_id,))
        zone = cur.fetchone()
        cur.close()
        conn.close()
        if not zone:
            return jsonify({"error": "Room allocation zone not found"}), 404
        return jsonify(zone), 200
    except Error as e:
        return handle_db_error(e)
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

@app.route('/api/room-alloc-zones', methods=['POST'])
def add_room_alloc_zone():
    try:
        data = request.json
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO room_alloc_zones (hostel_id, batch_id, start_room_no, end_room_no, remarks)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            data.get('hostel_id'),
            data.get('batch_id'),
            data.get('start_room_no'),
            data.get('end_room_no'),
            data.get('remarks')
        ))
        conn.commit()
        zone_id = cur.lastrowid
        cur.close()
        conn.close()
        return jsonify({"message": "Room allocation zone added successfully", "zone_id": zone_id}), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/room-alloc-zones/<int:zone_id>', methods=['PUT'])
def update_room_alloc_zone(zone_id):
    try:
        data = request.json
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE room_alloc_zones 
            SET hostel_id = %s, batch_id = %s, start_room_no = %s, 
                end_room_no = %s, remarks = %s
            WHERE zone_id = %s
        """, (
            data.get('hostel_id'),
            data.get('batch_id'),
            data.get('start_room_no'),
            data.get('end_room_no'),
            data.get('remarks'),
            zone_id
        ))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Room allocation zone updated successfully"}), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/room-alloc-zones/<int:zone_id>', methods=['DELETE'])
def delete_room_alloc_zone(zone_id):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM room_alloc_zones WHERE zone_id = %s;", (zone_id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Room allocation zone deleted successfully"}), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

# ========== DASHBOARD STATS ==========
@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        
        stats = {}
        
        # Total hostels
        cur.execute("SELECT COUNT(*) as count FROM hostel;")
        stats['total_hostels'] = cur.fetchone()['count']
        
        # Total students
        cur.execute("SELECT COUNT(*) as count FROM student;")
        stats['total_students'] = cur.fetchone()['count']
        
        # Total rooms
        cur.execute("SELECT COUNT(*) as count FROM room;")
        stats['total_rooms'] = cur.fetchone()['count']
        
        # Occupied rooms
        cur.execute("SELECT COUNT(*) as count FROM room WHERE allotted_to IS NOT NULL;")
        stats['occupied_rooms'] = cur.fetchone()['count']
        
        # Available rooms
        stats['available_rooms'] = stats['total_rooms'] - stats['occupied_rooms']
        
        # Total batches
        cur.execute("SELECT COUNT(*) as count FROM batches;")
        stats['total_batches'] = cur.fetchone()['count']
        
        # Total administrators
        cur.execute("SELECT COUNT(*) as count FROM administrator;")
        stats['total_administrators'] = cur.fetchone()['count']
        
        # Total roommate pairs
        cur.execute("SELECT COUNT(*) as count FROM roommates;")
        stats['total_roommate_pairs'] = cur.fetchone()['count']
        
        cur.close()
        conn.close()
        return jsonify(stats)
    except Error as e:
        return jsonify({"error": str(e)}), 500

# ========== TEST ENDPOINT ==========
@app.route("/test-db", methods=['GET'])
def test_db():
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Failed to connect to DB"}), 500
    cur = conn.cursor()
    cur.execute("SHOW TABLES;")
    tables = [t[0] for t in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify({"tables": tables, "status": "Database connected successfully"})

# ========== ROOM ALLOCATION ==========
# Ensure upload and output folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'xlsx', 'xls'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/allocation/upload', methods=['POST'])
def upload_allocation_file():
    """Upload Excel file for room allocation"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type. Only Excel files (.xlsx, .xls) are allowed"}), 400
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        upload_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(upload_path)
        
        return jsonify({
            "message": "File uploaded successfully",
            "filename": filename,
            "upload_path": upload_path
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/allocation/run', methods=['POST'])
def run_allocation():
    """Run room allocation on uploaded file"""
    try:
        data = request.json
        filename = data.get('filename')
        
        if not filename:
            return jsonify({"error": "Filename not provided"}), 400
        
        upload_path = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.exists(upload_path):
            return jsonify({"error": "File not found"}), 404
        
        occupancy_type = data.get('occupancy_type', 'Single')  # Default to Single
        
        # Run allocation pipeline (occupancy_type can be used for future double occupancy logic)
        result = run_allocation_pipeline(upload_path, OUTPUT_FOLDER, occupancy_type)
        
        return jsonify({
            "message": "Allocation completed successfully",
            "result": result
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/allocation/fill-remaining', methods=['POST'])
def fill_remaining():
    """Fill remaining unallocated rooms"""
    try:
        data = request.json
        initial_filename = data.get('initial_filename')
        
        if not initial_filename:
            return jsonify({"error": "Initial filename not provided"}), 400
        
        initial_file_path = os.path.join(OUTPUT_FOLDER, initial_filename)
        if not os.path.exists(initial_file_path):
            return jsonify({"error": "Initial allocation file not found"}), 404
        
        # Run fill remaining rooms
        result = fill_remaining_rooms(initial_file_path, OUTPUT_FOLDER)
        
        return jsonify({
            "message": "Remaining rooms allocated successfully",
            "result": result
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/allocation/clear', methods=['POST'])
def clear_allocations():
    """Clear all room allocations from database"""
    try:
        conn = get_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        
        # Clear all room allocations (set allotted_to to NULL)
        cur.execute("UPDATE room SET allotted_to = NULL WHERE allotted_to IS NOT NULL")
        
        affected_rows = cur.rowcount
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            "message": f"Successfully cleared {affected_rows} room allocations",
            "cleared_count": affected_rows
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/allocation/download/<filename>', methods=['GET'])
def download_allocation_file(filename):
    """Download allocation result file"""
    try:
        file_path = os.path.join(OUTPUT_FOLDER, filename)
        if not os.path.exists(file_path):
            return jsonify({"error": "File not found"}), 404
        
        return send_file(file_path, as_attachment=True, download_name=filename)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/allocation/list', methods=['GET'])
def list_allocation_files():
    """List available allocation output files"""
    try:
        files = []
        if os.path.exists(OUTPUT_FOLDER):
            for file in os.listdir(OUTPUT_FOLDER):
                if file.endswith(('.xlsx', '.xls')):
                    file_path = os.path.join(OUTPUT_FOLDER, file)
                    file_size = os.path.getsize(file_path)
                    files.append({
                        "filename": file,
                        "size": file_size,
                        "size_mb": round(file_size / (1024 * 1024), 2)
                    })
        
        return jsonify({"files": files}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/allocation/upload-to-db', methods=['POST'])
def upload_to_database():
    """Upload final allocated rooms Excel and insert/update students and rooms in database"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        hostel_id = request.form.get('hostel_id')
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not hostel_id:
            return jsonify({"error": "Hostel ID not provided"}), 400
        
        try:
            hostel_id = int(hostel_id)
        except:
            return jsonify({"error": "Invalid hostel ID"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type. Only Excel files (.xlsx, .xls) are allowed"}), 400
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        temp_path = os.path.join(UPLOAD_FOLDER, f"temp_{filename}")
        file.save(temp_path)
        
        # Read Excel file
        df = pd.read_excel(temp_path, engine='openpyxl')
        df.columns = [str(c).strip() for c in df.columns]
        
        # Find columns in Excel
        name_col = None
        student_id_col = None
        email_col = None
        batch_col = None
        room_col = None
        year_col = None
        department_col = None
        phone_col = None
        
        for col in df.columns:
            col_lower = col.lower()
            if 'name' in col_lower and 'full' not in col_lower:
                if not name_col:
                    name_col = col
            elif 'full name' in col_lower:
                name_col = col
            elif 'student' in col_lower and 'id' in col_lower:
                student_id_col = col
            elif 'email' in col_lower:
                email_col = col
            elif 'batch' in col_lower:
                batch_col = col
            elif 'allocated' in col_lower and 'room' in col_lower:
                room_col = col
            elif 'year' in col_lower:
                year_col = col
            elif 'department' in col_lower or 'dept' in col_lower:
                department_col = col
            elif 'phone' in col_lower or 'contact' in col_lower:
                phone_col = col
        
        if not room_col:
            return jsonify({"error": "Could not find 'Allocated_Room' column in the Excel file"}), 400
        
        if not name_col:
            return jsonify({"error": "Could not find 'Name' column in the Excel file"}), 400
        
        conn = get_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        # Verify hostel exists
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT hostel_id FROM hostel WHERE hostel_id = %s", (hostel_id,))
        hostel_check = cur.fetchone()
        if not hostel_check:
            cur.close()
            conn.close()
            return jsonify({"error": f"Hostel with ID {hostel_id} not found"}), 400
        
        students_created = 0
        students_updated = 0
        rooms_allocated = 0
        error_count = 0
        errors = []
        
        # Helper function to extract gender from batch
        def extract_gender_from_batch(batch_str):
            if pd.isna(batch_str):
                return None
            batch_str = str(batch_str).strip().lower()
            if 'male' in batch_str:
                return 'Male'
            elif 'female' in batch_str:
                return 'Female'
            return None
        
        # Helper function to extract batch_id from batch string
        def extract_batch_id(batch_str):
            if pd.isna(batch_str):
                return None
            batch_str = str(batch_str).strip()
            # Remove gender words and clean
            batch_str = batch_str.replace('Male', '').replace('Female', '').replace('male', '').replace('female', '').strip()
            return batch_str if batch_str else None
        
        # Process each row
        for idx, row in df.iterrows():
            try:
                allocated_room = str(row.get(room_col)).strip() if pd.notna(row.get(room_col)) else None
                
                # Skip if no room allocated
                if not allocated_room or allocated_room.lower() == 'nan' or allocated_room == '':
                    continue
                
                # Extract data from Excel
                name = str(row.get(name_col)).strip() if pd.notna(row.get(name_col)) else None
                if not name:
                    error_count += 1
                    errors.append(f"Row {idx + 2}: Name is required")
                    continue
                
                roll_no = None
                if student_id_col and pd.notna(row.get(student_id_col)):
                    roll_no = str(row.get(student_id_col)).strip()
                
                if not roll_no:
                    error_count += 1
                    errors.append(f"Row {idx + 2}: Student ID/Roll No is required")
                    continue
                
                email = str(row.get(email_col)).strip() if email_col and pd.notna(row.get(email_col)) else None
                if email and email.lower() == 'nan':
                    email = None
                
                batch_str = str(row.get(batch_col)).strip() if batch_col and pd.notna(row.get(batch_col)) else None
                if batch_str and batch_str.lower() == 'nan':
                    batch_str = None
                
                gender = extract_gender_from_batch(batch_str) if batch_str else None
                batch_id = extract_batch_id(batch_str) if batch_str else None
                
                # Verify batch_id exists in database if provided
                if batch_id:
                    cur.execute("SELECT batch_id FROM batches WHERE batch_id = %s", (batch_id,))
                    batch_check = cur.fetchone()
                    if not batch_check:
                        batch_id = None  # Don't assign invalid batch_id
                
                year = None
                if year_col and pd.notna(row.get(year_col)):
                    try:
                        year = int(float(row.get(year_col)))
                    except:
                        pass
                
                department = str(row.get(department_col)).strip() if department_col and pd.notna(row.get(department_col)) else None
                if department and department.lower() == 'nan':
                    department = None
                
                phone = str(row.get(phone_col)).strip() if phone_col and pd.notna(row.get(phone_col)) else None
                if phone and phone.lower() == 'nan':
                    phone = None
                
                # Default gender if not found
                if not gender:
                    gender = 'Other'
                
                # Check if student exists
                cur.execute("SELECT student_id FROM student WHERE roll_no = %s", (roll_no,))
                existing_student = cur.fetchone()
                
                if existing_student:
                    # Update existing student
                    student_id = existing_student['student_id']
                    update_fields = []
                    update_values = []
                    
                    if name:
                        update_fields.append("name = %s")
                        update_values.append(name)
                    if email:
                        update_fields.append("email = %s")
                        update_values.append(email)
                    if gender:
                        update_fields.append("gender = %s")
                        update_values.append(gender)
                    if year:
                        update_fields.append("year = %s")
                        update_values.append(year)
                    if department:
                        update_fields.append("department = %s")
                        update_values.append(department)
                    if phone:
                        update_fields.append("phone = %s")
                        update_values.append(phone)
                    if batch_id:
                        update_fields.append("batch_id = %s")
                        update_values.append(batch_id)
                    if hostel_id:
                        update_fields.append("hostel_id = %s")
                        update_values.append(hostel_id)
                    
                    if update_fields:
                        update_values.append(student_id)
                        update_query = f"UPDATE student SET {', '.join(update_fields)} WHERE student_id = %s"
                        cur.execute(update_query, update_values)
                        students_updated += 1
                else:
                    # Create new student
                    if not gender:
                        gender = 'Other'  # Required field
                    
                    cur.execute("""
                        INSERT INTO student (roll_no, name, year, gender, department, phone, email, 
                                           rm_key, hostel_id, batch_id)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        roll_no, name, year, gender, department, phone, email, 0, hostel_id, batch_id
                    ))
                    student_id = cur.lastrowid
                    students_created += 1
                
                # Handle room allocation
                room_no = allocated_room
                
                # Try to extract floor from room number
                floor_no = None
                if len(room_no) >= 4 and room_no[0].isdigit():
                    try:
                        floor_no = int(room_no[0])
                    except:
                        pass
                
                # Check if room exists
                cur.execute("""
                    SELECT room_id, allotted_to FROM room 
                    WHERE hostel_id = %s AND room_no = %s AND bed_id = 'A1'
                    LIMIT 1
                """, (hostel_id, room_no))
                room_info = cur.fetchone()
                
                if room_info:
                    # Update existing room
                    if room_info['allotted_to'] and room_info['allotted_to'] != student_id:
                        # Clear old allocation first
                        cur.execute("UPDATE room SET allotted_to = NULL WHERE room_id = %s", (room_info['room_id'],))
                    
                    cur.execute("""
                        UPDATE room SET allotted_to = %s 
                        WHERE room_id = %s
                    """, (student_id, room_info['room_id']))
                    rooms_allocated += 1
                else:
                    # Create new room
                    cur.execute("""
                        INSERT INTO room (hostel_id, room_no, floor_no, bed_id, allotted_to)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (hostel_id, room_no, floor_no, 'A1', student_id))
                    rooms_allocated += 1
                
            except Exception as e:
                error_count += 1
                error_msg = str(e)
                errors.append(f"Row {idx + 2}: {error_msg}")
                continue
        
        conn.commit()
        cur.close()
        conn.close()
        
        # Clean up temp file
        try:
            os.remove(temp_path)
        except:
            pass
        
        message = f"Successfully processed: {students_created} students created, {students_updated} students updated, {rooms_allocated} rooms allocated"
        if error_count > 0:
            message += f". {error_count} errors occurred."
        
        return jsonify({
            "message": message,
            "students_created": students_created,
            "students_updated": students_updated,
            "rooms_allocated": rooms_allocated,
            "error_count": error_count,
            "errors": errors[:20]  # Return first 20 errors
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ========== SERVE FRONTEND ==========
# These routes must be defined AFTER all API routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    # Don't serve frontend for API routes
    if path and path.startswith('api/'):
        return jsonify({"error": "API endpoint not found"}), 404
    
    # Try web_frontend first, then web_app
    for frontend_dir in [WEB_FRONTEND_DIR, WEB_APP_DIR]:
        # Serve index.html for root
        if path == '' or path == 'index.html':
            index_path = os.path.join(frontend_dir, 'index.html')
            if os.path.exists(index_path):
                return send_from_directory(frontend_dir, 'index.html')
        
        # Check if it's a static file
        file_path = os.path.join(frontend_dir, path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return send_from_directory(frontend_dir, path)
    
    # For all other routes, try to serve index.html from web_frontend
    index_path = os.path.join(WEB_FRONTEND_DIR, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(WEB_FRONTEND_DIR, 'index.html')
    
    # Fallback to web_app
    return send_from_directory(WEB_APP_DIR, 'index.html')

if __name__ == "__main__":
    app.run(debug=True, port=5000, host='0.0.0.0')