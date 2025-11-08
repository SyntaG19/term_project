import pandas as pd

def perform_initial_allocation():
    input_file = "data_to_be_fed.xlsx"
    zones_file = "outputs/batch_room_zones.xlsx"
    output_file = "outputs/room_allocation_results.xlsx"

    batch_room_zones = pd.read_excel(zones_file)

    def generate_room_range(start, end):
        prefix = str(start)[0]
        start_suffix = int(str(start)[1:])
        end_suffix = int(str(end)[1:])
        return {f"{prefix}{str(num).zfill(3)}" for num in range(start_suffix, end_suffix + 1)}

    batch_zones = {
        row["Batch"]: generate_room_range(row["start_room_no"], row["end_room_no"])
        for _, row in batch_room_zones.iterrows()
    }

    df_raw = pd.read_excel(input_file, engine="openpyxl")
    df_raw.columns = [str(c).strip() for c in df_raw.columns]
    pref_cols = [c for c in df_raw.columns if "room preference" in c.lower()]
    timestamp_col = next(c for c in df_raw.columns if "timestamp" in c.lower())

    df_raw[timestamp_col] = pd.to_datetime(df_raw[timestamp_col], errors="coerce")
    df = df_raw.sort_values(by=timestamp_col, na_position="last").reset_index(drop=True)

    def normalize_room_value(v):
        if pd.isna(v): return None
        s = str(v).strip()
        if s.endswith(".0"): s = s[:-2]
        digits = "".join(ch for ch in s if ch.isdigit())
        return digits[-4:] if len(digits) >= 4 else None

    allocated_rooms = set()
    allocations = []

    for _, row in df.iterrows():
        batch = str(row.get("Batch")).strip() if pd.notna(row.get("Batch")) else None
        batch_rooms = batch_zones.get(batch, set())
        allocated = None
        for pref_col in pref_cols:
            pref = normalize_room_value(row.get(pref_col))
            if pref and pref in batch_rooms and pref not in allocated_rooms:
                allocated = pref
                allocated_rooms.add(pref)
                break
        allocations.append({
            "Timestamp": row.get(timestamp_col),
            "Name": row.get("Name"),
            "Student_ID": row.get("Student ID"),
            "Email": row.get("Email Address"),
            "Batch": batch,
            "Allocated_Room": allocated
        })

    out_df = pd.DataFrame(allocations)
    out_df.to_excel(output_file, index=False)
    print(f"✅ Initial allocation saved → {output_file}")
