// In-memory database simulation
let appState = {
  currentUser: null,
  currentUserType: null
};

let hostels = [
  { hostel_id: 1, hostel_name: "Canary", gender: "Male", occupancy_type: "Double", total_rooms: 120, phase: "1A" },
  { hostel_id: 2, hostel_name: "Fulgar", gender: "Male", occupancy_type: "Single", total_rooms: 100, phase: "1C" },
  { hostel_id: 3, hostel_name: "Egret", gender: "Female", occupancy_type: "Double", total_rooms: 90, phase: "1B" },
  { hostel_id: 4, hostel_name: "Dedhar", gender: "Female", occupancy_type: "Double", total_rooms: 80, phase: "1A" },
  { hostel_id: 5, hostel_name: "Breag", gender: "Male", occupancy_type: "Double", total_rooms: 100, phase: "1B" }
];

let batches = [
  { batch_id: "UG2022", program: "BTech", year_of_study: 4 },
  { batch_id: "UG2023", program: "BTech", year_of_study: 3 },
  { batch_id: "UG2024", program: "BTech", year_of_study: 2 },
  { batch_id: "UG2025", program: "BTech", year_of_study: 1 }
];

let students = [
  { student_id: 1, roll_no: "IIT2023001", name: "Rajesh Kumar", year: 3, gender: "Male", department: "CSE", email: "rajesh@iitjammu.ac.in", batch_id: "UG2023", hostel_id: 1, room_id: null },
  { student_id: 2, roll_no: "IIT2023002", name: "Priya Singh", year: 3, gender: "Female", department: "ECE", email: "priya@iitjammu.ac.in", batch_id: "UG2023", hostel_id: 3, room_id: null },
  { student_id: 3, roll_no: "IIT2024001", name: "Amit Verma", year: 2, gender: "Male", department: "ME", email: "amit@iitjammu.ac.in", batch_id: "UG2024", hostel_id: 1, room_id: null },
  { student_id: 4, roll_no: "IIT2024002", name: "Neha Patel", year: 2, gender: "Female", department: "CE", email: "neha@iitjammu.ac.in", batch_id: "UG2024", hostel_id: 3, room_id: null }
];

let administrators = [
  { admin_id: 1, first_name: "Dr.", last_name: "Kumar", designation: "Hostel Warden", email: "admin@iitjammu.ac.in", password: "admin123", hostel_id: 1 },
  { admin_id: 2, first_name: "Ms.", last_name: "Sharma", designation: "Hostel Warden", email: "admin2@iitjammu.ac.in", password: "admin456", hostel_id: 3 }
];

let rooms = [];
let zones = [];
let allocationResults = [];

// Generate rooms for all hostels
function generateRooms() {
  let roomId = 1;
  const wings = ['W1', 'W2', 'W3', 'W4'];
  const floors = [2, 3, 4, 5, 6, 7];
  const roomsPerWing = 23;
  
  hostels.forEach(hostel => {
    let roomCount = 0;
    
    floors.forEach(floor => {
      wings.forEach(wing => {
        for (let i = 1; i <= roomsPerWing && roomCount < hostel.total_rooms; i++) {
          const roomNo = `${floor}${String(i).padStart(3, '0')}`;
          
          // For double occupancy, create two beds (A1 and B1)
          if (hostel.occupancy_type === 'Double') {
            rooms.push({
              room_id: roomId++,
              hostel_id: hostel.hostel_id,
              wing_code: wing,
              floor_no: floor,
              room_no: roomNo,
              bed_id: 'A1',
              allotted_to: null
            });
            rooms.push({
              room_id: roomId++,
              hostel_id: hostel.hostel_id,
              wing_code: wing,
              floor_no: floor,
              room_no: roomNo,
              bed_id: 'B1',
              allotted_to: null
            });
          } else {
            // For single occupancy, create only A1 bed
            rooms.push({
              room_id: roomId++,
              hostel_id: hostel.hostel_id,
              wing_code: wing,
              floor_no: floor,
              room_no: roomNo,
              bed_id: 'A1',
              allotted_to: null
            });
          }
          
          roomCount++;
        }
      });
    });
  });
}

// Initialize rooms
generateRooms();

// Helper functions
function getHostelById(id) {
  return hostels.find(h => h.hostel_id === parseInt(id));
}

function getStudentByRollNo(rollNo) {
  return students.find(s => s.roll_no === rollNo);
}

function getAdminByEmail(email) {
  return administrators.find(a => a.email === email);
}

function getBatchById(id) {
  return batches.find(b => b.batch_id === id);
}

function getRoomsByHostel(hostelId) {
  return rooms.filter(r => r.hostel_id === parseInt(hostelId));
}

function getNextId(array, idField) {
  if (array.length === 0) return 1;
  return Math.max(...array.map(item => parseInt(item[idField]) || 0)) + 1;
}