import pandas as pd
from pathlib import Path

# ---------- CONFIG ----------
input_file = "data_to_be_fed.xlsx"       # your input Excel
output_file = "room_allocation_results.xlsx"  # output Excel

# ---------- STEP 1: Read Excel ----------
df_raw = pd.read_excel(input_file, engine="openpyxl")
df_raw.columns = [str(c).strip() for c in df_raw.columns]  # clean headers

# ---------- STEP 2: Identify preference columns ----------
pref_cols = [c for c in df_raw.columns if "room preference" in c.lower()]
if not pref_cols:
    raise RuntimeError("No 'Room preference' columns found in the sheet!")

# ---------- STEP 3: Detect timestamp column ----------
timestamp_col = None
for possible in ["Timestamp", "timestamp", "TimeStamp"]:
    if possible in df_raw.columns:
        timestamp_col = possible
        break
if timestamp_col is None:
    raise RuntimeError("No 'Timestamp' column found in the sheet!")

# ---------- STEP 4: Sort by Timestamp ----------
df_raw[timestamp_col] = pd.to_datetime(df_raw[timestamp_col], errors="coerce")
df = df_raw.sort_values(by=timestamp_col, na_position="last").reset_index(drop=True)

# ---------- STEP 5: Generate available rooms ----------
# Floors 2–7, Rooms 001–092 → e.g., 2001–2092, 3001–3092, ..., 7001–7092
available_rooms = {f"{floor}{str(room).zfill(3)}" for floor in range(2, 8) for room in range(1, 93)}

# ---------- Helper: Normalize preference entries ----------
def normalize_room_value(v):
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

    # If no preference could be allocated, keep None
    allocations.append({
        "Timestamp": row.get(timestamp_col),
        "Name": row.get("Name") or row.get("Full Name"),
        "Student_ID": row.get("Student ID") or row.get("StudentID"),
        "Email": row.get("Email Address") or row.get("Email"),
        "Batch": row.get("Batch") or row.get("batch"),
        "Allocated_Room": allocated
    })

# ---------- STEP 7: Save output ----------
out_df = pd.DataFrame(allocations)
out_df.to_excel(output_file, index=False)

print("✅ Allocation complete.")
print(f"Output saved to: {output_file}")
print(f"Total students: {len(out_df)}, Allocated: {out_df['Allocated_Room'].notna().sum()}, Unallocated: {out_df['Allocated_Room'].isna().sum()}")
