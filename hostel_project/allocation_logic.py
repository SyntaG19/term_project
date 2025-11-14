import pandas as pd
import os

def run_hostel_allocation(input_file_path, output_folder_path):
    """
    This is your allotment.py logic, converted to a function.
    It takes an input path and output folder, and returns the
    filename of the generated report.
    """
    try:
        # ---------- STEP 1: Read Excel ----------
        df_raw = pd.read_excel(input_file_path, engine="openpyxl")
        df_raw.columns = [str(c).strip() for c in df_raw.columns]

        # ---------- STEP 2: Identify preference columns ----------
        pref_cols = [c for c in df_raw.columns if "room preference" in c.lower()]
        if not pref_cols:
            raise RuntimeError("No 'Room preference' columns found in the sheet!")

        # ---------- STEP 3: Detect timestamp column ----------
        timestamp_col = None
        # Added more robust timestamp detection
        for possible in ["Timestamp", "timestamp", "TimeStamp", "Submission Time"]:
            if possible in df_raw.columns:
                timestamp_col = possible
                break
        if timestamp_col is None:
            raise RuntimeError("No 'Timestamp' column found! Looked for 'Timestamp', 'Submission Time', etc.")

        # ---------- STEP 4: Sort by Timestamp ----------
        df_raw[timestamp_col] = pd.to_datetime(df_raw[timestamp_col], errors="coerce")
        df_raw = df_raw.dropna(subset=[timestamp_col]) # Drop rows where timestamp is invalid
        df = df_raw.sort_values(by=timestamp_col, na_position="last").reset_index(drop=True)

        # ---------- STEP 5: Generate available rooms ----------
        available_rooms = {f"{floor}{str(room).zfill(3)}" for floor in range(2, 8) for room in range(1, 93)}

        # ---------- Helper: Normalize preference entries ----------
        def normalize_room_value(v):
            if pd.isna(v): return None
            s = str(v).strip().split(".")[0] # Get rid of .0
            if not s: return None
            digits = "".join(ch for ch in s if ch.isdigit())
            if not digits: return None
            if len(digits) >= 4: s = digits[-4:]
            elif len(digits) == 3 and digits[0] in "234567": s = digits[0] + "0" + digits[1:] # Fix for 3-digit rooms like 201 -> 2001
            else: return None
            return s

        # ---------- STEP 6: Allocation Logic ----------
        allocations = []
        
        # Get all relevant columns, default to None if not present
        name_col = next((c for c in df.columns if c.lower() in ["name", "full name"]), "Name")
        id_col = next((c for c in df.columns if c.lower() in ["student id", "studentid", "roll no"]), "Student_ID")
        email_col = next((c for c in df.columns if c.lower() in ["email address", "email"]), "Email")
        batch_col = next((c for c in df.columns if c.lower() in ["batch"]), "Batch")

        for _, row in df.iterrows():
            allocated = None
            for pref_col in pref_cols:
                pref = row.get(pref_col)
                room = normalize_room_value(pref)
                if room and room in available_rooms:
                    allocated = room
                    available_rooms.remove(room)
                    break 

            allocations.append({
                "Timestamp": row.get(timestamp_col),
                "Name": row.get(name_col),
                "Student_ID": row.get(id_col),
                "Email": row.get(email_col),
                "Batch": row.get(batch_col),
                "Allocated_Room": allocated
            })

        # ---------- STEP 7: Create DataFrame ----------
        out_df = pd.DataFrame(allocations)

        # ---------- STEP 8: Sort by Room Number, unallocated last ----------
        allocated_df = out_df[out_df['Allocated_Room'].notna()].copy()
        unallocated_df = out_df[out_df['Allocated_Room'].isna()].copy()

        if not allocated_df.empty:
            allocated_df['Room_Sort'] = allocated_df['Allocated_Room'].astype(int)
            allocated_df = allocated_df.sort_values(by='Room_Sort').drop(columns=['Room_Sort'])

        sorted_df = pd.concat([allocated_df, unallocated_df], ignore_index=True)

        # ---------- STEP 9: Save results to a dynamic path ----------
        output_filename = "room_allocation_sorted.xlsx"
        final_output_path = os.path.join(output_folder_path, output_filename)
        
        sorted_df.to_excel(final_output_path, index=False)
        
        print(f"✅ Allocation complete. Results saved to: {final_output_path}")

        # Return the filename for the download link
        return {"output_filename": output_filename}
    
    except Exception as e:
        print(f"Error during allocation: {e}")
        # Re-raise the exception so Flask can catch it
        raise