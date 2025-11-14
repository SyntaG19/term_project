# How to Get Error Logs

## Method 1: Backend Terminal/Console (Recommended)
When you run `python app.py` in the backend folder, all error messages and print statements will appear in that terminal window.

**Steps:**
1. Open a terminal/command prompt
2. Navigate to the backend folder: `cd backend`
3. Run: `python app.py`
4. Keep this terminal window open and watch for error messages
5. When an error occurs, copy the entire error message and traceback from the terminal

## Method 2: Browser Console
1. Open your browser (Chrome/Firefox/Edge)
2. Press `F12` or right-click → "Inspect" → "Console" tab
3. Try the operation that's failing
4. Look for red error messages in the console
5. Right-click on the error → "Copy" to copy the full error

## Method 3: Check Backend Logs File (if configured)
If you see a log file in the backend folder, you can check it for errors.

## What to Share
When reporting an error, please share:
1. The exact error message
2. The full traceback (if available)
3. What action you were performing (e.g., "Clicking 'Allot Remaining People' button")
4. Any relevant file names or data

## Current Logging
The code now includes detailed print statements that will show:
- File paths being used
- Number of rows processed
- Batch zones loaded
- Rooms allocated
- Any errors with full traceback

All of this will appear in the backend terminal when you run `python app.py`.

