// ---
// THIS FILE HAS BEEN MODIFIED TO CONNECT TO THE FLASK BACKEND
// ---

// We will use port 5000 to match the Flask server
const API_BASE_URL = "http://127.0.0.1:5001";

// Navigation functions
function showLanding() {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('landingPage').classList.add('active');
}

function showLogin(type) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  if (type === 'admin') {
    document.getElementById('adminLoginPage').classList.add('active');
  } else {
    document.getElementById('studentLoginPage').classList.add('active');
  }
}

function logout() {
  appState.currentUser = null;
  appState.currentUserType = null;
  showLanding();
}

// Authentication
function adminLogin(event) {
  event.preventDefault();
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;
  
  // NOTE: This is still using the FAKE data.js login.
  // We will replace this with a real '/api/login' fetch call
  // after we confirm the allocation works.
  const admin = getAdminByEmail(email);
  if (admin && admin.password === password) {
    appState.currentUser = admin;
    appState.currentUserType = 'admin';
    showAdminDashboard();
  } else {
    document.getElementById('adminLoginError').textContent = 'Invalid email or password';
  }
}

function studentLogin(event) {
  event.preventDefault();
  const rollNo = document.getElementById('studentRollNo').value;
  
  // NOTE: This is still using the FAKE data.js login.
  const student = getStudentByRollNo(rollNo);
  if (student) {
    appState.currentUser = student;
    appState.currentUserType = 'student';
    showStudentDashboard();
  } else {
    document.getElementById('studentLoginError').textContent = 'Invalid roll number';
  }
}

// Admin Dashboard
function showAdminDashboard() {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('adminDashboard').classList.add('active');
  
  document.getElementById('adminName').textContent = `${appState.currentUser.first_name} ${appState.currentUser.last_name}`;
  
  // Initialize tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  
  // Add listener for allocation form
  // We do this instead of 'onclick' for better control
  document.getElementById('allocationForm').addEventListener('submit', uploadAndRunAllocation);

  
  // Load initial data
  loadHostels(); // This will now call the backend
  loadStudents(); // This still uses fake data
  loadBatches(); // This still uses fake data
  loadZones(); // This still uses fake data
  populateHostelSelect();
}

function switchTab(tabName) {

  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(tabName).classList.add('active');
  
  // Load data for specific tabs
  if (tabName === 'rooms' && document.getElementById('hostelSelect').value) {
    loadRooms();
  }
}

// Hostels Management
async function loadHostels() {
  // NOTE: This function is now disconnected from data.js
  // It will be empty until we add a real /api/hostels endpoint
  // We will do this NEXT.
  
  // const res = await fetch(`${API_BASE_URL}/api/hostels`);
  // const hostels = await res.json();
  
  // For now, let's keep using the fake data so the UI works
  const table = `
    <div class="data-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Gender</th>
            <th>Occupancy</th>
            <th>Total Rooms</th>
          </tr>
        </thead>
        <tbody>
          ${hostels.map(h => `
            <tr>
              <td>${h.hostel_id}</td>
              <td>${h.hostel_name}</td>
              <td>${h.gender}</td>
              <td>${h.occupancy_type}</td>
              <td>${h.total_rooms}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
  
  document.getElementById('hostelsTable').innerHTML = table;
}


function openHostelModal(hostelId = null) {
  document.getElementById('modalOverlay').classList.add('active');
  document.getElementById('hostelModal').classList.add('active');
  
  if (hostelId) {
    const hostel = getHostelById(hostelId);
    document.getElementById('hostelModalTitle').textContent = 'Edit Hostel';
    document.getElementById('hostel_id').value = hostel.hostel_id;
    document.getElementById('hostel_name').value = hostel.hostel_name;
    document.getElementById('hostel_gender').value = hostel.gender;
    document.getElementById('hostel_occupancy').value = hostel.occupancy_type;
    document.getElementById('hostel_rooms').value = hostel.total_rooms;
    document.getElementById('hostel_phase').value = hostel.phase;
  } else {
    document.getElementById('hostelModalTitle').textContent = 'Add Hostel';
    document.getElementById('hostelForm').reset();
  }
}

function saveHostel(event) {
  event.preventDefault();
  const id = document.getElementById('hostel_id').value;
  const hostelData = {
    hostel_name: document.getElementById('hostel_name').value,
    gender: document.getElementById('hostel_gender').value,
    occupancy_type: document.getElementById('hostel_occupancy').value,
    total_rooms: parseInt(document.getElementById('hostel_rooms').value),
    phase: document.getElementById('hostel_phase').value
  };
  
  if (id) {
    const index = hostels.findIndex(h => h.hostel_id === parseInt(id));
    hostels[index] = { ...hostels[index], ...hostelData };
    showNotification('Hostel updated successfully');
  } else {
    hostelData.hostel_id = getNextId(hostels, 'hostel_id');
    hostels.push(hostelData);
    showNotification('Hostel added successfully');
  }
  
  closeModal();
  loadHostels();
  populateHostelSelect();
}

function editHostel(id) {
  openHostelModal(id);
}

function deleteHostel(id) {
  if (confirm('Are you sure you want to delete this hostel?')) {
    const index = hostels.findIndex(h => h.hostel_id === id);
    hostels.splice(index, 1);
    loadHostels();
    showNotification('Hostel deleted successfully');
  }
}

// Students Management
function loadStudents() {
  const table = `
    <div class="data-table">
      <table>
        <thead>
          <tr>
            <th>Roll No</th>
            <th>Name</th>
            <th>Year</th>
            <th>Gender</th>
            <th>Department</th>
            <th>Batch</th>
            <th>Hostel</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${students.map(s => {
            const hostel = s.hostel_id ? getHostelById(s.hostel_id) : null;
            return `
              <tr>
                <td>${s.roll_no}</td>
                <td>${s.name}</td>
                <td>${s.year}</td>
                <td>${s.gender}</td>
                <td>${s.department}</td>
                <td>${s.batch_id}</td>
                <td>${hostel ? hostel.hostel_name : 'Not Assigned'}</td>
                <td>
                  <div class="action-btns">
                    <button class="btn-icon" onclick="editStudent(${s.student_id})" title="Edit">✏️</button>
                    <button class="btn-icon" onclick="deleteStudent(${s.student_id})" title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
  document.getElementById('studentsTable').innerHTML = table;
}

function filterStudents() {
  const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
  const filteredStudents = students.filter(s => 
    s.roll_no.toLowerCase().includes(searchTerm) ||
    s.name.toLowerCase().includes(searchTerm) ||
    s.department.toLowerCase().includes(searchTerm)
  );
  
  const table = `
    <div class="data-table">
      <table>
        <thead>
          <tr>
            <th>Roll No</th>
            <th>Name</th>
            <th>Year</th>
            <th>Gender</th>
            <th>Department</th>
            <th>Batch</th>
            <th>Hostel</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${filteredStudents.map(s => {
            const hostel = s.hostel_id ? getHostelById(s.hostel_id) : null;
            return `
              <tr>
                <td>${s.roll_no}</td>
                <td>${s.name}</td>
                <td>${s.year}</td>
                <td>${s.gender}</td>
                <td>${s.department}</td>
                <td>${s.batch_id}</td>
                <td>${hostel ? hostel.hostel_name : 'Not Assigned'}</td>
                <td>
                  <div class="action-btns">
                    <button class="btn-icon" onclick="editStudent(${s.student_id})" title="Edit">✏️</button>
                    <button class="btn-icon" onclick="deleteStudent(${s.student_id})" title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
  document.getElementById('studentsTable').innerHTML = table;
}

function openStudentModal(studentId = null) {
  document.getElementById('modalOverlay').classList.add('active');
  document.getElementById('studentModal').classList.add('active');
  
  // Populate batch and hostel dropdowns
  const batchSelect = document.getElementById('student_batch');
  batchSelect.innerHTML = batches.map(b => `<option value="${b.batch_id}">${b.batch_id}</option>`).join('');
  
  const hostelSelect = document.getElementById('student_hostel');
  hostelSelect.innerHTML = '<option value="">Not Assigned</option>' + 
    hostels.map(h => `<option value="${h.hostel_id}">${h.hostel_name}</option>`).join('');
  
  if (studentId) {
    const student = students.find(s => s.student_id === studentId);
    document.getElementById('studentModalTitle').textContent = 'Edit Student';
    document.getElementById('student_id').value = student.student_id;
    document.getElementById('student_rollno').value = student.roll_no;
    document.getElementById('student_name').value = student.name;
    document.getElementById('student_year').value = student.year;
    document.getElementById('student_gender').value = student.gender;
    document.getElementById('student_dept').value = student.department;
    document.getElementById('student_email').value = student.email;
    document.getElementById('student_batch').value = student.batch_id;
    document.getElementById('student_hostel').value = student.hostel_id || '';
  } else {
    document.getElementById('studentModalTitle').textContent = 'Add Student';
    document.getElementById('studentForm').reset();
  }
}

function saveStudent(event) {
  event.preventDefault();
  const id = document.getElementById('student_id').value;
  const studentData = {
    roll_no: document.getElementById('student_rollno').value,
    name: document.getElementById('student_name').value,
    year: parseInt(document.getElementById('student_year').value),
    gender: document.getElementById('student_gender').value,
    department: document.getElementById('student_dept').value,
    email: document.getElementById('student_email').value,
    batch_id: document.getElementById('student_batch').value,
    hostel_id: document.getElementById('student_hostel').value ? parseInt(document.getElementById('student_hostel').value) : null,
    room_id: null
  };
  
  if (id) {
    const index = students.findIndex(s => s.student_id === parseInt(id));
    students[index] = { ...students[index], ...studentData };
    showNotification('Student updated successfully');
  } else {
    studentData.student_id = getNextId(students, 'student_id');
    students.push(studentData);
    showNotification('Student added successfully');
  }
  
  closeModal();
  loadStudents();
}

function editStudent(id) {
  openStudentModal(id);
}

function deleteStudent(id) {
  if (confirm('Are you sure you want to delete this student?')) {
    const index = students.findIndex(s => s.student_id === id);
    students.splice(index, 1);
    loadStudents();
    showNotification('Student deleted successfully');
  }
}

// Rooms Management
function populateHostelSelect() {
  const select = document.getElementById('hostelSelect');
  select.innerHTML = '<option value="">Select Hostel</option>' + 
    hostels.map(h => `<option value="${h.hostel_id}">${h.hostel_name}</option>`).join('');
}

function loadRooms() {
  const hostelId = document.getElementById('hostelSelect').value;
  if (!hostelId) {
    document.getElementById('roomsContainer').innerHTML = '<p>Please select a hostel to view rooms.</p>';
    return;
  }
  
  const hostelRooms = getRoomsByHostel(hostelId);
  const hostel = getHostelById(hostelId);
  const wings = ['W1', 'W2', 'W3', 'W4'];
  
  let html = '';
  wings.forEach(wing => {
    const wingRooms = hostelRooms.filter(r => r.wing_code === wing);
    if (wingRooms.length === 0) return;
    
    // Group by room number
    const roomsByNumber = {};
    wingRooms.forEach(room => {
      if (!roomsByNumber[room.room_no]) {
        roomsByNumber[room.room_no] = [];
      }
      roomsByNumber[room.room_no].push(room);
    });
    
    html += `<div class="wing-section">`;
    html += `<h4>Wing ${wing}</h4>`;
    html += `<div class="rooms-grid">`;
    
    Object.keys(roomsByNumber).sort().forEach(roomNo => {
      const beds = roomsByNumber[roomNo];
      const allocatedCount = beds.filter(b => b.allotted_to).length;
      let statusClass = 'unallocated';
      
      if (allocatedCount === beds.length) {
        statusClass = 'allocated';
      } else if (allocatedCount > 0) {
        statusClass = 'partial';
      }
      
      html += `
        <div class="room-card ${statusClass}">
          <div class="room-number">${roomNo}</div>
          <div class="room-info">Floor ${beds[0].floor_no}</div>
          <div class="room-info">${beds.map(b => b.bed_id).join(', ')}</div>
          <div class="room-info">${allocatedCount}/${beds.length} beds</div>
        </div>
      `;
    });
    
    html += `</div></div>`;
  });
  
  document.getElementById('roomsContainer').innerHTML = html;
}

function openRoomModal(roomId = null) {
  document.getElementById('modalOverlay').classList.add('active');
  document.getElementById('roomModal').classList.add('active');
  
  const hostelSelect = document.getElementById('room_hostel');
  hostelSelect.innerHTML = hostels.map(h => `<option value="${h.hostel_id}">${h.hostel_name}</option>`).join('');
  
  if (roomId) {
    const room = rooms.find(r => r.room_id === roomId);
    document.getElementById('roomModalTitle').textContent = 'Edit Room';
    document.getElementById('room_id').value = room.room_id;
    document.getElementById('room_hostel').value = room.hostel_id;
    document.getElementById('room_wing').value = room.wing_code;
    document.getElementById('room_floor').value = room.floor_no;
    document.getElementById('room_number').value = room.room_no;
    document.getElementById('room_bed').value = room.bed_id;
  } else {
    document.getElementById('roomModalTitle').textContent = 'Add Room';
    document.getElementById('roomForm').reset();
  }
}

function saveRoom(event) {
  event.preventDefault();
  const id = document.getElementById('room_id').value;
  const roomData = {
    hostel_id: parseInt(document.getElementById('room_hostel').value),
    wing_code: document.getElementById('room_wing').value,
    floor_no: parseInt(document.getElementById('room_floor').value),
    room_no: document.getElementById('room_number').value,
    bed_id: document.getElementById('room_bed').value,
    allotted_to: null
  };
  
  if (id) {
    const index = rooms.findIndex(r => r.room_id === parseInt(id));
    rooms[index] = { ...rooms[index], ...roomData };
    showNotification('Room updated successfully');
  } else {
    roomData.room_id = getNextId(rooms, 'room_id');
    rooms.push(roomData);
    showNotification('Room added successfully');
  }
  
  closeModal();
  loadRooms();
}

// Batches Management
function loadBatches() {
  const table = `
    <div class="data-table">
      <table>
        <thead>
          <tr>
            <th>Batch ID</th>
            <th>Program</th>
            <th>Year of Study</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${batches.map(b => `
            <tr>
              <td>${b.batch_id}</td>
              <td>${b.program}</td>
              <td>${b.year_of_study}</td>
              <td>
                <div class="action-btns">
                  <button class="btn-icon" onclick="editBatch('${b.batch_id}')" title="Edit">✏️</button>
                  <button class="btn-icon" onclick="deleteBatch('${b.batch_id}')" title="Delete">🗑️</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  document.getElementById('batchesTable').innerHTML = table;
}

function openBatchModal(batchId = null) {
  document.getElementById('modalOverlay').classList.add('active');
  document.getElementById('batchModal').classList.add('active');
  
  if (batchId) {
    const batch = getBatchById(batchId);
    document.getElementById('batchModalTitle').textContent = 'Edit Batch';
    document.getElementById('batch_id').value = batch.batch_id;
    document.getElementById('batch_id').readOnly = true;
    document.getElementById('batch_program').value = batch.program;
    document.getElementById('batch_year').value = batch.year_of_study;
  } else {
    document.getElementById('batchModalTitle').textContent = 'Add Batch';
    document.getElementById('batchForm').reset();
    document.getElementById('batch_id').readOnly = false;
  }
}

function saveBatch(event) {
  event.preventDefault();
  const batchId = document.getElementById('batch_id').value;
  const batchData = {
    batch_id: batchId,
    program: document.getElementById('batch_program').value,
    year_of_study: parseInt(document.getElementById('batch_year').value)
  };
  
  const existingIndex = batches.findIndex(b => b.batch_id === batchId);
  if (existingIndex >= 0) {
    batches[existingIndex] = batchData;
    showNotification('Batch updated successfully');
  } else {
    batches.push(batchData);
    showNotification('Batch added successfully');
  }
  
  closeModal();
  loadBatches();
}

function editBatch(id) {
  openBatchModal(id);
}

function deleteBatch(id) {
  if (confirm('Are you sure you want to delete this batch?')) {
    const index = batches.findIndex(b => b.batch_id === id);
    batches.splice(index, 1);
    loadBatches();
    showNotification('Batch deleted successfully');
  }
}

// Zones Management
function loadZones() {
  const table = `
    <div class="data-table">
      <table>
        <thead>
          <tr>
            <th>Zone ID</th>
            <th>Batch</th>
            <th>Hostel</th>
            <th>Start Room</th>
            <th>End Room</th>
            <th>Remarks</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${zones.length === 0 ? '<tr><td colspan="7" style="text-align: center;">No zones defined yet</td></tr>' : zones.map(z => {
            const hostel = getHostelById(z.hostel_id);
            return `
              <tr>
                <td>${z.zone_id}</td>
                <td>${z.batch_id}</td>
                <td>${hostel ? hostel.hostel_name : 'N/A'}</td>
                <td>${z.start_room_no}</td>
                <td>${z.end_room_no}</td>
                <td>${z.remarks || '-'}</td>
                <td>
                  <div class="action-btns">
                    <button class="btn-icon" onclick="deleteZone(${z.zone_id})" title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
  document.getElementById('zonesTable').innerHTML = table;
}

function openZoneModal() {
  document.getElementById('modalOverlay').classList.add('active');
  document.getElementById('zoneModal').classList.add('active');
  
  const batchSelect = document.getElementById('zone_batch');
  batchSelect.innerHTML = batches.map(b => `<option value="${b.batch_id}">${b.batch_id}</option>`).join('');
  
  const hostelSelect = document.getElementById('zone_hostel');
  hostelSelect.innerHTML = hostels.map(h => `<option value="${h.hostel_id}">${h.hostel_name}</option>`).join('');
  
  document.getElementById('zoneForm').reset();
}

function saveZone(event) {
  event.preventDefault();
  const zoneData = {
    zone_id: getNextId(zones, 'zone_id'),
    batch_id: document.getElementById('zone_batch').value,
    hostel_id: parseInt(document.getElementById('zone_hostel').value),
    start_room_no: document.getElementById('zone_start').value,
    end_room_no: document.getElementById('zone_end').value,
    remarks: document.getElementById('zone_remarks').value
  };
  
  zones.push(zoneData);
  closeModal();
  loadZones();
  showNotification('Zone added successfully');
}

function deleteZone(id) {
  if (confirm('Are you sure you want to delete this zone?')) {
    const index = zones.findIndex(z => z.zone_id === id);
    zones.splice(index, 1);
    loadZones();
    showNotification('Zone deleted successfully');
  }
}

// Room Allocation Algorithm
async function uploadAndRunAllocation(event) {
  event.preventDefault(); // Stop the form from submitting normally
  
  const fileInput = document.getElementById("preferenceFile");
  const selectedFile = fileInput.files[0];
  const resultDiv = document.getElementById("allocation-output-box");

  if (!selectedFile) {
    showNotification("Please select a file first!", true);
    return;
  }

  try {
    resultDiv.innerHTML = `<p>Uploading file...</p>`;
    showNotification("Uploading file...", false);

    // ✅ Step 1: Upload to Flask backend
    const formData = new FormData();
    formData.append("file", selectedFile);

    const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      body: formData
    });

    const uploadData = await uplcoadRes.json();
    if (!uploadData.success) throw new Error(uploadData.error || "Upload failed");

    const uploaded_path = uploadData.uploaded_path;
    resultDiv.innerHTML = `<p>File uploaded. Running allocation...</p>`;
    showNotification("File uploaded successfully. Starting allocation...");

    // ✅ Step 2: Tell backend to run allocation
    const runRes = await fetch(`${API_BASE_URL}/api/run-allocation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploaded_path })
    });

    const resultData = await runRes.json();
    if (!resultData.success) throw new Error(resultData.error || "Allocation failed");

    console.log("Allocation result:", resultData);
    showNotification("✅ Allocation completed successfully!");

    // ✅ Step 3: Show download link
    // The backend now returns 'output_filename'
    const filename = 
    
    resultData.output_filename; 
    
    const downloadUrl = `${API_BASE_URL}/api/download/${filename}`;
    
    // 4. Show it to the user
    resultDiv.innerHTML = `
      <p style="color: var(--color-success); font-weight: 500;">Allocation complete.</p>
      <a href="${downloadUrl}" class="btn btn--primary" download style="margin-top: 10px;">Download Allotment File</a>
    `;
  } 
  
  catch (err) {
    console.error(err);
    const errorMsg = `Error: ${err.message}`;
    showNotification(errorMsg, true);
    resultDiv.innerHTML = `<p style="color: var(--color-error);">${errorMsg}</p>`;
  }
}

//Student Dashboard
function showStudentDashboard() {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('studentDashboard').classList.add('active');
  
  const student = appState.currentUser;
  document.getElementById('studentName').textContent = student.name;
  
  // Find student's room
  const studentRoom = rooms.find(r => r.allotted_to === student.roll_no);
  const hostel = student.hostel_id ? getHostelById(student.hostel_id) : null;
  
  let roomInfo = '<p>No room allocated yet.</p>';
  if (studentRoom && hostel) {
    roomInfo = `
      <div class="info-row">
        <div class="info-label">Hostel</div>
        <div class="info-value">${hostel.hostel_name}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Room Number</div>
        <div class="info-value">${studentRoom.room_no}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Bed</div>
        <div class="info-value">${studentRoom.bed_id}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Wing</div>
        <div class="info-value">${studentRoom.wing_code}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Floor</div>
        <div class="info-value">${studentRoom.floor_no}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Phase</div>
        <div class="info-value">${hostel.phase}</div>
      </div>
    `;
  }
  
  document.getElementById('studentRoomInfo').innerHTML = roomInfo;
  
  let hostelInfo = '<p>Not assigned to any hostel.</p>';
  if (hostel) {
    hostelInfo = `
      <div class="info-row">
        <div class="info-label">Hostel Name</div>
        <div class="info-value">${hostel.hostel_name}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Gender</div>
        <div class="info-value">${hostel.gender}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Occupancy Type</div>
        <div class="info-value">${hostel.occupancy_type}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Phase</div>
        <div class="info-value">${hostel.phase}</div>
      </div>
    `;
  }
  
  document.getElementById('studentHostelInfo').innerHTML = hostelInfo;
}

// Modal functions
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

// Notification
function showNotification(message, isError = false) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = 'notification show';
  if (isError) {
    notification.classList.add('error');
  }
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}