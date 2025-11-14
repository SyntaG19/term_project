# Room Allocation Feature

## Overview

The Room Allocation feature allows administrators to upload Excel files with student preferences and automatically allocate rooms based on:
1. Student room preferences
2. Batch-based room allocation zones from the database
3. Timestamp-based priority (first come, first served)

## Features

### 1. Excel File Upload
- Drag and drop or click to upload
- Supports `.xlsx` and `.xls` formats
- File validation and error handling

### 2. Room Allocation Process
- **Step 1**: Initial allocation based on student preferences
  - Reads student preferences from Excel
  - Matches preferences with available rooms in their batch
  - Allocates rooms based on timestamp priority
- **Step 2**: Fill remaining rooms
  - Allocates remaining students to available rooms in their batch
  - Ensures all students in a batch get rooms within their allocated zone

### 3. Results Display
- Shows total students processed
- Shows number of allocated students
- Shows number of unallocated students
- Download results as Excel file

### 4. Previous Allocations
- View list of previous allocation files
- Download previous allocation results
- File size information

## Excel File Format

The Excel file should contain the following columns:

### Required Columns:
- **Timestamp**: Submission timestamp (for priority)
- **Name** or **Full Name**: Student name
- **Student ID** or **StudentID**: Student ID
- **Batch**: Batch ID (e.g., "UG2022", "UG2023")
- **Room Preference 1**, **Room Preference 2**, etc.: Room preference columns

### Optional Columns:
- **Email Address** or **Email**: Student email

### Example Format:
```
Timestamp | Name | Student ID | Batch | Room Preference 1 | Room Preference 2 | Email
2024-01-01 10:00:00 | John Doe | 2022BCS001 | UG2022 | 2001 | 2002 | john@example.com
```

## API Endpoints

### Upload File
```
POST /api/allocation/upload
Content-Type: multipart/form-data
Body: file (Excel file)
```

### Run Allocation
```
POST /api/allocation/run
Content-Type: application/json
Body: { "filename": "uploaded_file.xlsx" }
```

### Download Result
```
GET /api/allocation/download/<filename>
```

### List Files
```
GET /api/allocation/list
```

## Allocation Logic

### 1. Fetch Room Zones from Database
- Reads room allocation zones from `room_alloc_zones` table
- Groups rooms by batch
- Creates room ranges for each batch

### 2. Process Student Preferences
- Sorts students by timestamp (earliest first)
- For each student:
  - Checks room preferences in order
  - Matches preference with available rooms in their batch
  - Allocates first available preference
  - Marks room as allocated

### 3. Fill Remaining Rooms
- For each batch:
  - Finds unallocated students
  - Finds available rooms in batch zone
  - Allocates available rooms to unallocated students

### 4. Generate Output
- Creates Excel file with allocation results
- Sorts allocated rooms by room number
- Places unallocated students at the end

## Output Format

The output Excel file contains:
- **Timestamp**: Original submission timestamp
- **Name**: Student name
- **Student_ID**: Student ID
- **Email**: Student email
- **Batch**: Batch ID
- **Allocated_Room**: Allocated room number (or empty if not allocated)

## Usage

1. **Navigate to Room Allocation Page**
   - Click "Room Allocation" in the sidebar

2. **Upload Excel File**
   - Drag and drop or click to upload
   - Wait for upload confirmation

3. **Run Allocation**
   - Click "Run Allocation" button
   - Wait for processing to complete
   - View results

4. **Download Results**
   - Click "Download Results" button
   - Save the Excel file

5. **View Previous Allocations**
   - Scroll down to see previous allocations
   - Click "Download" to get previous results

## Database Requirements

The allocation feature requires:
- **room_alloc_zones** table with:
  - `batch_id`: Batch ID
  - `start_room_no`: Starting room number
  - `end_room_no`: Ending room number

## Error Handling

The system handles:
- Invalid file formats
- Missing required columns
- Database connection errors
- Room allocation conflicts
- File upload errors

## Notes

- Rooms are allocated based on batch zones from the database
- Students can only be allocated rooms within their batch zone
- Allocation respects timestamp priority (first come, first served)
- Unallocated students are placed at the end of the output file
- Previous allocation files are stored in the `outputs` folder
