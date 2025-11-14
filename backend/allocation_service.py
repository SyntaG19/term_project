"""
Room Allocation Service
Handles room allocation logic based on allotment.py
"""
import pandas as pd
import os
import sys
from datetime import datetime

# Add parent directory to path to import db and config
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import UPLOAD_FOLDER, OUTPUT_FOLDER
from db import get_connection


def normalize_room_value(v):
    """Normalize room preference value"""
    if pd.isna(v):
        return None
    s = str(v).strip()
    if s == "":
        return None
    if s.endswith(".0"):  # handle 2001.0 style
        s = s[:-2]
    # Extract digits only
    digits = "".join(ch for ch in s if ch.isdigit())
    if not digits:
        return None
    if len(digits) >= 4:
        s = digits[-4:]  # last 4 digits form room number
    elif len(digits) == 3 and digits[0] in "234567":
        s = digits[0] + digits[1:].zfill(3)
    else:
        return None
    return s


def run_allocation_pipeline(uploaded_file_path, outputs_folder, occupancy_type='Single'):
    """
    Run the complete allocation pipeline based on allotment.py logic
    
    Args:
        uploaded_file_path: Path to uploaded Excel file
        outputs_folder: Folder to save output files
        occupancy_type: 'Single' or 'Double' occupancy type
    
    Returns:
        dict with final_file path and statistics
    """
    os.makedirs(outputs_folder, exist_ok=True)
    
    # ---------- STEP 1: Read Excel ----------
    df_raw = pd.read_excel(uploaded_file_path, engine="openpyxl")
    df_raw.columns = [str(c).strip() for c in df_raw.columns]  # clean headers
    
    # ---------- STEP 2: Identify preference columns ----------
    pref_cols = [c for c in df_raw.columns if "room preference" in c.lower()]
    if not pref_cols:
        raise ValueError("No 'Room preference' columns found in the Excel file!")
    
    # ---------- STEP 3: Detect timestamp column ----------
    timestamp_col = None
    for possible in ["Timestamp", "timestamp", "TimeStamp"]:
        if possible in df_raw.columns:
            timestamp_col = possible
            break
    if timestamp_col is None:
        raise ValueError("No 'Timestamp' column found in the Excel file!")
    
    # ---------- STEP 4: Sort by Timestamp ----------
    df_raw[timestamp_col] = pd.to_datetime(df_raw[timestamp_col], errors="coerce")
    df = df_raw.sort_values(by=timestamp_col, na_position="last").reset_index(drop=True)
    
    # ---------- STEP 5: Generate available rooms ----------
    # Floors 2–7, Rooms 001–092 → e.g., 2001–2092, 3001–3092, ..., 7001–7092
    available_rooms = {f"{floor}{str(room).zfill(3)}" for floor in range(2, 8) for room in range(1, 93)}
    
    # ---------- STEP 6: Allocation Logic ----------
    allocations = []
    
    for _, row in df.iterrows():
        allocated = None
        for pref_col in pref_cols:
            pref = row.get(pref_col)
            room = normalize_room_value(pref)
            if room and room in available_rooms:
                allocated = room
                available_rooms.remove(room)
                break  # stop checking further preferences
        
        # Store allocation result
        allocations.append({
            "Timestamp": row.get(timestamp_col),
            "Name": row.get("Name") or row.get("Full Name") or "",
            "Student_ID": row.get("Student ID") or row.get("StudentID") or "",
            "Email": row.get("Email Address") or row.get("Email") or "",
            "Batch": row.get("Batch") or row.get("batch") or "",
            "Allocated_Room": allocated
        })
    
    # ---------- STEP 7: Create DataFrame ----------
    out_df = pd.DataFrame(allocations)
    
    # ---------- STEP 8: Sort by Room Number, unallocated last ----------
    allocated_df = out_df[out_df['Allocated_Room'].notna()].copy()
    unallocated_df = out_df[out_df['Allocated_Room'].isna()].copy()
    
    # Convert room numbers to int for sorting
    if len(allocated_df) > 0:
        allocated_df['Room_Sort'] = allocated_df['Allocated_Room'].astype(int)
        allocated_df = allocated_df.sort_values(by='Room_Sort').drop(columns=['Room_Sort'])
    
    # Combine sorted + unallocated
    sorted_df = pd.concat([allocated_df, unallocated_df], ignore_index=True)
    
    # ---------- STEP 9: Save results ----------
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    raw_filename = f"room_allocation_results_{timestamp}.xlsx"
    raw_output = os.path.join(outputs_folder, raw_filename)
    out_df.to_excel(raw_output, index=False)

    final_filename = f"batch_constrained_allocation_{timestamp}.xlsx"
    final_output = os.path.join(outputs_folder, final_filename)
    sorted_df.to_excel(final_output, index=False)
    
    return {
        "final_file": final_filename,
        "final_file_path": final_output,
        "initial_file": raw_filename,
        "initial_file_path": raw_output,
        "total_students": int(len(sorted_df)),
        "allocated_count": int(sorted_df['Allocated_Room'].notna().sum()),
        "unallocated_count": int(sorted_df['Allocated_Room'].isna().sum())
    }


def generate_room_range(start, end):
    """Generate room numbers in a range"""
    prefix = str(start)[0]
    start_suffix = int(str(start)[1:])
    end_suffix = int(str(end)[1:])
    return {f"{prefix}{str(num).zfill(3)}" for num in range(start_suffix, end_suffix + 1)}


def fill_remaining_rooms(initial_file_path, outputs_folder):
    """
    Fill remaining unallocated rooms based on batch zones
    
    Args:
        initial_file_path: Path to initial allocation results file
        outputs_folder: Folder to save output files
    
    Returns:
        dict with final_file path and statistics
    """
    import traceback
    
    try:
        os.makedirs(outputs_folder, exist_ok=True)
        
        # Read initial allocation file
        print(f"Reading allocation file: {initial_file_path}")
        if not os.path.exists(initial_file_path):
            raise FileNotFoundError(f"File not found: {initial_file_path}")
        
        alloc_df = pd.read_excel(initial_file_path, engine='openpyxl')
        print(f"Loaded {len(alloc_df)} rows from allocation file")
        
        # Check if required columns exist
        if 'Allocated_Room' not in alloc_df.columns:
            raise ValueError("'Allocated_Room' column not found in the Excel file")
        
        # Ensure Batch column exists, create if not
        if 'Batch' not in alloc_df.columns:
            print("Warning: 'Batch' column not found, creating empty batch column")
            alloc_df['Batch'] = ''
        
        # Try to fetch zones from database, otherwise use fixed ranges
        batch_zones = {}
        try:
            conn = get_connection()
            if conn:
                query = """
                    SELECT batch_id AS Batch, start_room_no, end_room_no 
                    FROM room_alloc_zones
                    ORDER BY batch_id, start_room_no;
                """
                zones_df = pd.read_sql(query, conn)
                conn.close()
                
                if len(zones_df) > 0:
                    # Create batch zones dictionary
                    for _, row in zones_df.iterrows():
                        batch = str(row["Batch"]).strip()
                        room_range = generate_room_range(row["start_room_no"], row["end_room_no"])
                        if batch in batch_zones:
                            batch_zones[batch].update(room_range)
                        else:
                            batch_zones[batch] = room_range
                    
                    # Save zones file for reference
                    zones_file = os.path.join(outputs_folder, "batch_room_zones.xlsx")
                    zones_df.to_excel(zones_file, index=False)
                    print(f"Loaded {len(zones_df)} batch zones from database")
                else:
                    # No zones in database, use fixed ranges
                    all_rooms = {f"{floor}{str(room).zfill(3)}" for floor in range(2, 8) for room in range(1, 93)}
                    batch_zones[""] = all_rooms
                    print("No zones in database, using fixed ranges")
            else:
                # Fallback to fixed ranges if no database connection
                all_rooms = {f"{floor}{str(room).zfill(3)}" for floor in range(2, 8) for room in range(1, 93)}
                batch_zones[""] = all_rooms
                print("No database connection, using fixed ranges")
        except Exception as e:
            print(f"Warning: Could not fetch zones from database: {e}")
            # Fallback to fixed ranges
            all_rooms = {f"{floor}{str(room).zfill(3)}" for floor in range(2, 8) for room in range(1, 93)}
            batch_zones[""] = all_rooms
        
        # If no batch zones found, use all available rooms for all batches
        if not batch_zones:
            all_rooms = {f"{floor}{str(room).zfill(3)}" for floor in range(2, 8) for room in range(1, 93)}
            batch_zones[""] = all_rooms
        
        # Create final dataframe
        final_df = alloc_df.copy()
        
        # Fill unallocated rooms by batch
        # Get all used rooms globally (convert to string for comparison)
        print("Calculating used rooms...")
        allocated_mask = final_df['Allocated_Room'].notna()
        if allocated_mask.any():
            used_rooms = set(final_df.loc[allocated_mask, 'Allocated_Room'].astype(str).str.strip())
            # Remove 'nan' strings
            used_rooms = {r for r in used_rooms if r.lower() != 'nan' and r != ''}
        else:
            used_rooms = set()
        
        print(f"Found {len(used_rooms)} already allocated rooms")
        print(f"Total students: {len(final_df)}, Unallocated: {final_df['Allocated_Room'].isna().sum()}")
        
        # Get all unique batches from the allocation data
        if 'Batch' in final_df.columns:
            final_df['Batch'] = final_df['Batch'].astype(str).fillna('')
            unique_batches = set(final_df['Batch'].str.strip().unique())
            print(f"Found batches in data: {unique_batches}")
        else:
            final_df['Batch'] = ''
            unique_batches = {''}
        
        # Process each batch zone
        total_allocated_in_this_step = 0
        for batch_key, room_set in batch_zones.items():
            print(f"Processing batch zone: '{batch_key}' with {len(room_set)} rooms")
            
            # Get available rooms for this batch (convert to string)
            available = sorted([str(r) for r in room_set if str(r) not in used_rooms])
            print(f"Available rooms for batch '{batch_key}': {len(available)}")
            
            # Find matching batches - either exact match or use default batch
            if batch_key == "":
                # Default batch - assign to all unallocated students regardless of batch
                unallocated_mask = final_df['Allocated_Room'].isna()
                unallocated_idx = final_df[unallocated_mask].index
            else:
                # Match by batch
                batch_match = final_df['Batch'].str.strip() == batch_key
                unallocated_mask = final_df['Allocated_Room'].isna() & batch_match
                unallocated_idx = final_df[unallocated_mask].index
            
            print(f"Found {len(unallocated_idx)} unallocated students for batch '{batch_key}'")
            
            # Allocate available rooms
            allocated_count = 0
            for i, idx in enumerate(unallocated_idx):
                if i < len(available):
                    final_df.at[idx, 'Allocated_Room'] = available[i]
                    used_rooms.add(available[i])  # Mark as used globally
                    allocated_count += 1
            
            total_allocated_in_this_step += allocated_count
            print(f"Allocated {allocated_count} rooms for batch '{batch_key}'")
        
        # If there are still unallocated students and we have a default batch zone, use it
        remaining_unallocated = final_df[final_df['Allocated_Room'].isna()]
        if len(remaining_unallocated) > 0 and "" in batch_zones:
            print(f"Still {len(remaining_unallocated)} unallocated students, using default batch zone")
            available = sorted([str(r) for r in batch_zones[""] if str(r) not in used_rooms])
            unallocated_idx = remaining_unallocated.index
            for i, idx in enumerate(unallocated_idx):
                if i < len(available):
                    final_df.at[idx, 'Allocated_Room'] = available[i]
                    used_rooms.add(available[i])
                    total_allocated_in_this_step += 1
        
        print(f"Total rooms allocated in fill step: {total_allocated_in_this_step}")
    
        # Sort results: allocated first (by room number), then unallocated
        print("Sorting results...")
        allocated_mask = final_df['Allocated_Room'].notna()
        allocated = final_df[allocated_mask].copy()
        unallocated = final_df[~allocated_mask].copy()
        
        if len(allocated) > 0:
            try:
                # Clean room numbers for sorting
                allocated['Room_Sort'] = allocated['Allocated_Room'].astype(str).str.replace(r'[^\d]', '', regex=True)
                # Convert to int, handling errors
                allocated['Room_Sort'] = pd.to_numeric(allocated['Room_Sort'], errors='coerce').fillna(0).astype(int)
                allocated = allocated.sort_values(by='Room_Sort').drop(columns=['Room_Sort'], errors='ignore')
            except Exception as e:
                print(f"Warning: Could not sort by room number: {e}")
                # Just sort by Allocated_Room as string
                allocated = allocated.sort_values(by='Allocated_Room')
        
        # Combine sorted allocated and unallocated
        sorted_df = pd.concat([allocated, unallocated], ignore_index=True)
        
        # Save final output with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        final_filename = f"batch_constrained_allocation_{timestamp}.xlsx"
        final_output = os.path.join(outputs_folder, final_filename)
        
        print(f"Saving final output to: {final_output}")
        sorted_df.to_excel(final_output, index=False)
        
        allocated_count = int(sorted_df['Allocated_Room'].notna().sum())
        unallocated_count = int(sorted_df['Allocated_Room'].isna().sum())
        
        print(f"Final results: {allocated_count} allocated, {unallocated_count} unallocated")
        
        return {
            "final_file": final_filename,
            "final_file_path": final_output,
            "total_students": int(len(sorted_df)),
            "allocated_count": allocated_count,
            "unallocated_count": unallocated_count
        }
    
    except Exception as e:
        error_msg = f"Error in fill_remaining_rooms: {str(e)}"
        print(error_msg)
        traceback.print_exc()
        raise Exception(error_msg)
