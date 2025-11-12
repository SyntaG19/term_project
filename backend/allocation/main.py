# backend/allocation/main.py
from .db_fetch import fetch_room_zones  # optional, if you fetch from DB
from .initial_allocation import perform_initial_allocation
from .fill_remaining import fill_remaining_rooms

def run_pipeline(uploaded_input_path, outputs_folder):
    """
    Main entry to run the full pipeline dynamically.
    uploaded_input_path: path to the uploaded Excel file
    outputs_folder: where to save results
    """
    os.makedirs(outputs_folder, exist_ok=True)

    # 1️⃣ Fetch latest room zones (optional)
    # fetch_room_zones()  # only if needed

    # 2️⃣ Run initial allocation
    perform_initial_allocation(input_file=uploaded_input_path, outputs_folder=outputs_folder)

    # 3️⃣ Fill remaining unallocated rooms
    fill_remaining_rooms(outputs_folder=outputs_folder)

    final_file = os.path.join(outputs_folder, "batch_constrained_allocation.xlsx")
    return {"final_file": final_file}
