import pandas as pd

def fill_remaining_rooms():
    allocation_file = "outputs/room_allocation_results.xlsx"
    zones_file = "outputs/batch_room_zones.xlsx"
    final_output = "outputs/batch_constrained_allocation.xlsx"

    alloc_df = pd.read_excel(allocation_file)
    zones_df = pd.read_excel(zones_file)

    def generate_room_range(start, end):
        prefix = str(start)[0]
        start_suffix = int(str(start)[1:])
        end_suffix = int(str(end)[1:])
        return {f"{prefix}{str(num).zfill(3)}" for num in range(start_suffix, end_suffix + 1)}

    batch_zones = {
        row["Batch"]: generate_room_range(row["start_room_no"], row["end_room_no"])
        for _, row in zones_df.iterrows()
    }

    final_df = alloc_df.copy()

    for batch, room_set in batch_zones.items():
        used_rooms = set(final_df.loc[final_df['Allocated_Room'].notna(), 'Allocated_Room'])
        available = sorted(list(room_set - used_rooms))
        unallocated_idx = final_df[
            (final_df['Batch'] == batch) & (final_df['Allocated_Room'].isna())
        ].index
        for i, idx in enumerate(unallocated_idx):
            if i < len(available):
                final_df.at[idx, 'Allocated_Room'] = available[i]

    allocated = final_df[final_df['Allocated_Room'].notna()].copy()
    unallocated = final_df[final_df['Allocated_Room'].isna()].copy()
    allocated['Room_Sort'] = allocated['Allocated_Room'].astype(int)
    allocated = allocated.sort_values(by='Room_Sort').drop(columns=['Room_Sort'])
    sorted_df = pd.concat([allocated, unallocated], ignore_index=True)

    sorted_df.to_excel(final_output, index=False)
    print(f"✅ Final sorted allocation saved → {final_output}")
