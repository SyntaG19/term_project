# In a new file, e.g., 'allocation/db_update.py'
import pandas as pd
from db import get_connection

def update_students_from_excel(excel_filepath):
    try:
        df = pd.read_excel(excel_filepath)
        conn = get_connection()
        cur = conn.cursor()

        updated_count = 0
        
        # You may need to change 'Roll_No' and 'Allocated_Room' to match your
        # Excel file's column names
        for _, row in df.iterrows():
            if pd.notna(row['Allocated_Room']) and pd.notna(row['Student_ID']):
                
                # This is a basic update. You might need to first
                # find the room_id from the room_no.
                # This is a simplified example.
                
                # A better way would be to get the room_id from the rooms table
                # based on the room_no and hostel.
                
                cur.execute("""
                    UPDATE students 
                    SET allocated_room_no = %s 
                    WHERE roll_no = %s
                """, (
                    str(row['Allocated_Room']), 
                    str(row['Student_ID'])
                ))
                updated_count += cur.rowcount

        conn.commit()
        cur.close()
        conn.close()
        return {"updated": updated_count}
    
    except Exception as e:
        print(f"DB Update Error: {e}")
        return {"error": str(e)}