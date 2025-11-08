# main.py — orchestrates the full room allocation workflow with summary report
import sys
import pandas as pd
from db_fetch import fetch_room_zones
from initial_allocation import perform_initial_allocation
from fill_remaining import fill_remaining_rooms

def print_summary(final_output_file):
    """Print allocation summary: per batch + totals"""
    df = pd.read_excel(final_output_file)

    total = len(df)
    allocated = df["Allocated_Room"].notna().sum()
    unallocated = df["Allocated_Room"].isna().sum()

    print("\n📊 --- ALLOCATION SUMMARY ---")
    print(f"Total students processed: {total}")
    print(f"Allocated: {allocated}")
    print(f"Unallocated: {unallocated}")

    # Summary by batch
    print("\n🏫 Allocation by Batch:")
    batch_summary = df.groupby("Batch")["Allocated_Room"].apply(lambda x: x.notna().sum())
    print(batch_summary.to_string())

    # Summary by floor (if room numbers present)
    df_alloc = df[df["Allocated_Room"].notna()].copy()
    df_alloc["Floor"] = df_alloc["Allocated_Room"].astype(str).str[0]  # first digit = floor
    floor_summary = df_alloc.groupby("Floor")["Allocated_Room"].count()

    print("\n🏢 Allocation by Floor:")
    for floor, count in floor_summary.items():
        print(f"  Floor {floor}: {count} rooms allocated")

    print("\n✅ Summary report complete.\n")

def main():
    print("🏁 Starting IIT Jammu Hostel Allocation Pipeline...\n")

    try:
        print("Step 1️⃣ : Fetching batch room zones from MySQL...")
        fetch_room_zones()
        print("✅ Room zones fetched successfully.\n")

        print("Step 2️⃣ : Performing initial timestamp-based allocation...")
        perform_initial_allocation()
        print("✅ Initial allocation complete.\n")

        print("Step 3️⃣ : Filling remaining unallocated students...")
        fill_remaining_rooms()
        print("✅ Final batch-constrained allocation complete!\n")

        final_output_file = "outputs/batch_constrained_allocation.xlsx"
        print_summary(final_output_file)

        print("🎯 All done. Check the 'outputs/' folder for generated Excel files.\n")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
