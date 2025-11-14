// Rooms Page

let roomsData = [];
let hostelsOptions = [];
let studentsOptions = [];

const roomsPage = {
    async load() {
        showLoading();
        try {
            roomsData = await api.rooms.getAll();
            hostelsOptions = await api.hostels.getAll();
            studentsOptions = await api.students.getAll();
            this.renderTable();
            this.setupEventListeners();
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    },

    renderTable() {
        const tbody = document.getElementById('rooms-tbody');
        tbody.innerHTML = '';

        if (roomsData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-door-open"></i><h3>No rooms found</h3><p>Add a new room to get started</p></td></tr>';
            return;
        }

        roomsData.forEach(room => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${room.room_id}</td>
                <td>${room.hostel_name || '-'}</td>
                <td>${room.wing_code || '-'}</td>
                <td>${room.floor_no !== null ? room.floor_no : '-'}</td>
                <td>${room.room_no}</td>
                <td>${room.bed_id || '-'}</td>
                <td>${room.student_name ? `${room.student_name} (${room.roll_no})` : '<span class="badge badge-success">Available</span>'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="roomsPage.edit(${room.room_id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="roomsPage.delete(${room.room_id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    setupEventListeners() {
        const addBtn = document.getElementById('add-room-btn');
        if (addBtn) {
            addBtn.onclick = () => this.showForm();
        }
    },

    showForm(room = null) {
        const isEdit = room !== null;
        const title = isEdit ? 'Edit Room' : 'Add Room';
        
        const hostelsSelect = hostelsOptions.map(h => 
            `<option value="${h.hostel_id}" ${room?.hostel_id === h.hostel_id ? 'selected' : ''}>${h.hostel_name}</option>`
        ).join('');

        const studentsSelect = studentsOptions.map(s => 
            `<option value="${s.student_id}" ${room?.allotted_to === s.student_id ? 'selected' : ''}>${s.name} (${s.roll_no})</option>`
        ).join('');

        const form = `
            <form id="room-form">
                <div class="form-group">
                    <label for="hostel_id">Hostel *</label>
                    <select id="hostel_id" name="hostel_id" required>
                        <option value="">Select Hostel</option>
                        ${hostelsSelect}
                    </select>
                </div>
                <div class="form-group">
                    <label for="wing_code">Wing Code</label>
                    <input type="text" id="wing_code" name="wing_code" value="${room?.wing_code || ''}">
                </div>
                <div class="form-group">
                    <label for="floor_no">Floor No</label>
                    <input type="number" id="floor_no" name="floor_no" value="${room?.floor_no || ''}">
                </div>
                <div class="form-group">
                    <label for="room_no">Room No *</label>
                    <input type="text" id="room_no" name="room_no" value="${room?.room_no || ''}" required>
                </div>
                <div class="form-group">
                    <label for="bed_id">Bed ID</label>
                    <select id="bed_id" name="bed_id">
                        <option value="A1" ${room?.bed_id === 'A1' ? 'selected' : ''}>A1</option>
                        <option value="B1" ${room?.bed_id === 'B1' ? 'selected' : ''}>B1</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="allotted_to">Allotted To</label>
                    <select id="allotted_to" name="allotted_to">
                        <option value="">Not Allotted</option>
                        ${studentsSelect}
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="modal.close()">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Room</button>
                </div>
            </form>
        `;

        modal.open(title, form);

        const formElement = document.getElementById('room-form');
        formElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.save(room?.room_id);
        });
    },

    async save(roomId = null) {
        showLoading();
        try {
            const formData = {
                hostel_id: parseInt(document.getElementById('hostel_id').value),
                wing_code: document.getElementById('wing_code').value || null,
                floor_no: document.getElementById('floor_no').value ? parseInt(document.getElementById('floor_no').value) : null,
                room_no: document.getElementById('room_no').value,
                bed_id: document.getElementById('bed_id').value || 'A1',
                allotted_to: document.getElementById('allotted_to').value ? parseInt(document.getElementById('allotted_to').value) : null
            };

            if (roomId) {
                await api.rooms.update(roomId, formData);
                showToast('Room updated successfully', 'success');
            } else {
                await api.rooms.create(formData);
                showToast('Room added successfully', 'success');
            }

            modal.close();
            await this.load();
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    },

    async edit(roomId) {
        showLoading();
        try {
            const room = await api.rooms.get(roomId);
            this.showForm(room);
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    },

    async delete(roomId) {
        const room = roomsData.find(r => r.room_id === roomId);
        if (!confirmDelete(`room ${room?.room_no || roomId}`)) {
            return;
        }

        showLoading();
        try {
            await api.rooms.delete(roomId);
            showToast('Room deleted successfully', 'success');
            await this.load();
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    }
};

// Register rooms page
app.registerPage('rooms', roomsPage);
