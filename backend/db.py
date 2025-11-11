import mysql.connector
from mysql.connector import Error
from config import DB_CONFIG

def get_connection():
    """
    Create and return a connection to the MySQL database.
    """
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        if conn.is_connected():
            print("✅ Connected to MySQL Database:", DB_CONFIG["database"])
            return conn
    except Error as e:
        print("❌ MySQL connection error:", e)
        return None
