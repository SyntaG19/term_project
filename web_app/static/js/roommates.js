// Roommates Page

let roommatesData = [];
let studentsOptions = [];

const roommatesPage = {
    async load() {
        showLoading();
        try {
            roommatesData = await api.roommates.getAll();
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
        const tbody = document.getElementById('roommates-tbody');
        tbody.innerHTML = '';

        if (roommatesData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><i class="fas fa-user-friends"></i><h3>No roommate pairs found</h3><p>Add a new roommate pair to get started</p></td></tr>';
            return;
        }

        roommatesData.forEach(roommate => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${roommate.rm_key}</td>
                <td>${roommate.student1_name ? `${roommate.student1_name} (${roommate.student1_roll})` : `Student ID: ${roommate.student1_id}`}</td>
                <td>${roommate.student2_name ? `${roommate.student2_name} (${roommate.student2_roll})` : (roommate.student2_id ? `Student ID: ${roommate.student2_id}` : '-')}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="roommatesPage.edit(${roommate.rm_key})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="roommatesPage.delete(${roommate.rm_key})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    setupEventListeners() {
        const addBtn = document.getElementById('add-roommate-btn');
        if (addBtn) {
            addBtn.onclick = () => this.showForm();
        }
    },

    showForm(roommate = null) {
        const isEdit = roommate !== null;
        const title = isEdit ? 'Edit Roommate Pair' : 'Add Roommate Pair';
        
        const studentsSelect = studentsOptions.map(s => 
            `<option value="${s.student_id}" ${roommate?.student1_id === s.student_id || roommate?.student2_id === s.student_id ? 'selected' : ''}>${s.name} (${s.roll_no})</option>`
        ).join('');

        const form = `
            <form id="roommate-form">
                <div class="form-group">
                    <label for="rm_key">RM Key *</label>
                    <input type="number" id="rm_key" name="rm_key" value="${roommate?.rm_key || ''}" ${isEdit ? 'readonly' : ''} required>
                </div>
                <div class="form-group">
                    <label for="student1_id">Student 1 *</label>
                    <select id="student1_id" name="student1_id" required>
                        <option value="">Select Student 1</option>
                        ${studentsSelect}
                    </select>
                </div>
                <div class="form-group">
                    <label for="student2_id">Student 2</label>
                    <select id="student2_id" name="student2_id">
                        <option value="">Select Student 2 (Optional)</option>
                        ${studentsSelect}
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="modal.close()">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Roommate Pair</button>
                </div>
            </form>
        `;

        modal.open(title, form);

        const formElement = document.getElementById('roommate-form');
        formElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.save(roommate?.rm_key);
        });
    },

    async save(rmKey = null) {
        showLoading();
        try {
            const formData = {
                rm_key: parseInt(document.getElementById('rm_key').value),
                student1_id: parseInt(document.getElementById('student1_id').value),
                student2_id: document.getElementById('student2_id').value ? parseInt(document.getElementById('student2_id').value) : null
            };

            if (rmKey) {
                await api.roommates.update(rmKey, formData);
                showToast('Roommate pair updated successfully', 'success');
            } else {
                await api.roommates.create(formData);
                showToast('Roommate pair added successfully', 'success');
            }

            modal.close();
            await this.load();
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    },

    async edit(rmKey) {
        showLoading();
        try {
            const roommate = await api.roommates.get(rmKey);
            this.showForm(roommate);
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    },

    async delete(rmKey) {
        const roommate = roommatesData.find(r => r.rm_key === rmKey);
        if (!confirmDelete(`roommate pair ${rmKey}`)) {
            return;
        }

        showLoading();
        try {
            await api.roommates.delete(rmKey);
            showToast('Roommate pair deleted successfully', 'success');
            await this.load();
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    }
};

// Register roommates page
app.registerPage('roommates', roommatesPage);
