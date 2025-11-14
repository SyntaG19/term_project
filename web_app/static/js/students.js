// Students Page

let studentsData = [];
let hostelsOptions = [];
let batchesOptions = [];

const studentsPage = {
    async load() {
        showLoading();
        try {
            studentsData = await api.students.getAll();
            hostelsOptions = await api.hostels.getAll();
            batchesOptions = await api.batches.getAll();
            this.renderTable();
            this.setupEventListeners();
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    },

    renderTable() {
        const tbody = document.getElementById('students-tbody');
        tbody.innerHTML = '';

        if (studentsData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-state"><i class="fas fa-user-graduate"></i><h3>No students found</h3><p>Add a new student to get started</p></td></tr>';
            return;
        }

        studentsData.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.student_id}</td>
                <td>${student.roll_no}</td>
                <td>${student.name}</td>
                <td>${student.year}</td>
                <td><span class="badge badge-info">${formatEnum(student.gender)}</span></td>
                <td>${student.department || '-'}</td>
                <td>${student.hostel_name || '-'}</td>
                <td>${student.batch_name || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="studentsPage.edit(${student.student_id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="studentsPage.delete(${student.student_id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    setupEventListeners() {
        const addBtn = document.getElementById('add-student-btn');
        if (addBtn) {
            addBtn.onclick = () => this.showForm();
        }
    },

    showForm(student = null) {
        const isEdit = student !== null;
        const title = isEdit ? 'Edit Student' : 'Add Student';
        
        const hostelsSelect = hostelsOptions.map(h => 
            `<option value="${h.hostel_id}" ${student?.hostel_id === h.hostel_id ? 'selected' : ''}>${h.hostel_name}</option>`
        ).join('');

        const batchesSelect = batchesOptions.map(b => 
            `<option value="${b.batch_id}" ${student?.batch_id === b.batch_id ? 'selected' : ''}>${b.batch_id}</option>`
        ).join('');

        const form = `
            <form id="student-form">
                <div class="form-group">
                    <label for="roll_no">Roll No *</label>
                    <input type="text" id="roll_no" name="roll_no" value="${student?.roll_no || ''}" required>
                </div>
                <div class="form-group">
                    <label for="name">Name *</label>
                    <input type="text" id="name" name="name" value="${student?.name || ''}" required>
                </div>
                <div class="form-group">
                    <label for="year">Year *</label>
                    <input type="number" id="year" name="year" value="${student?.year || ''}" min="1" max="5" required>
                </div>
                <div class="form-group">
                    <label for="gender">Gender *</label>
                    <select id="gender" name="gender" required>
                        <option value="">Select Gender</option>
                        <option value="Male" ${student?.gender === 'Male' ? 'selected' : ''}>Male</option>
                        <option value="Female" ${student?.gender === 'Female' ? 'selected' : ''}>Female</option>
                        <option value="Other" ${student?.gender === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="department">Department</label>
                    <input type="text" id="department" name="department" value="${student?.department || ''}">
                </div>
                <div class="form-group">
                    <label for="phone">Phone</label>
                    <input type="text" id="phone" name="phone" value="${student?.phone || ''}">
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" value="${student?.email || ''}">
                </div>
                <div class="form-group">
                    <label for="hostel_id">Hostel *</label>
                    <select id="hostel_id" name="hostel_id" required>
                        <option value="">Select Hostel</option>
                        ${hostelsSelect}
                    </select>
                </div>
                <div class="form-group">
                    <label for="batch_id">Batch</label>
                    <select id="batch_id" name="batch_id">
                        <option value="">Select Batch</option>
                        ${batchesSelect}
                    </select>
                </div>
                <div class="form-group">
                    <label for="rm_key">Roommate Key</label>
                    <input type="number" id="rm_key" name="rm_key" value="${student?.rm_key || 0}">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="modal.close()">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Student</button>
                </div>
            </form>
        `;

        modal.open(title, form);

        const formElement = document.getElementById('student-form');
        formElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.save(student?.student_id);
        });
    },

    async save(studentId = null) {
        showLoading();
        try {
            const formData = {
                roll_no: document.getElementById('roll_no').value,
                name: document.getElementById('name').value,
                year: parseInt(document.getElementById('year').value),
                gender: document.getElementById('gender').value,
                department: document.getElementById('department').value || null,
                phone: document.getElementById('phone').value || null,
                email: document.getElementById('email').value || null,
                hostel_id: parseInt(document.getElementById('hostel_id').value),
                batch_id: document.getElementById('batch_id').value || null,
                rm_key: parseInt(document.getElementById('rm_key').value) || 0
            };

            if (studentId) {
                await api.students.update(studentId, formData);
                showToast('Student updated successfully', 'success');
            } else {
                await api.students.create(formData);
                showToast('Student added successfully', 'success');
            }

            modal.close();
            await this.load();
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    },

    async edit(studentId) {
        showLoading();
        try {
            const student = await api.students.get(studentId);
            this.showForm(student);
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    },

    async delete(studentId) {
        const student = studentsData.find(s => s.student_id === studentId);
        if (!confirmDelete(student?.name || 'this student')) {
            return;
        }

        showLoading();
        try {
            await api.students.delete(studentId);
            showToast('Student deleted successfully', 'success');
            await this.load();
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    }
};

// Register students page
app.registerPage('students', studentsPage);
