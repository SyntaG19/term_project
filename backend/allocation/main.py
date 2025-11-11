# backend/allocation/main.py
from .db_fetch import fetch_room_zones  # optional, if you fetch from DB
from .initial_allocation import perform_initial_allocation
from .fill_remaining import fill_remaining_rooms

def run_pipeline(uploaded_input_path, outputs_folder):
    """
    Main entry to run the pipeline.
    - uploaded_input_path: path to the uploaded excel (preferences)
    - outputs_folder: directory to write outputs into
    Returns: dict with paths/files produced
    """

    # 1) Ensure zones are available (db_fetch can write outputs/batch_room_zones.xlsx)
    # If you fetch zones from DB, call fetch_room_zones() which writes to outputs folder
    try:
        # example: fetch_room_zones()  # optional if you want fresh DB zones
        pass
    except Exception:
        # handle or log; optional
        pass

    # 2) Run initial allocation — make sure your function accepts the input file path
    # Adapt your perform_initial_allocation to accept input_file and output folder
    perform_initial_allocation(input_file=uploaded_input_path, outputs_folder=outputs_folder)

    # 3) Fill remaining rooms
    fill_remaining_rooms(outputs_folder=outputs_folder)

    # Expected produced file:
    final_file = f"{outputs_folder}/batch_constrained_allocation.xlsx"
    return {"final_file": final_file}
