import mysql.connector
import pandas as pd
from config import DB_CONFIG

def fetch_room_zones():
    conn = mysql.connector.connect(**DB_CONFIG)
    query = "SELECT batch_id AS Batch, start_room_no, end_room_no FROM room_alloc_zones;"
    df = pd.read_sql(query, conn)
    conn.close()
    
    df.to_excel("outputs/batch_room_zones.xlsx", index=False)
    print("✅ Room zone data fetched → outputs/batch_room_zones.xlsx")
