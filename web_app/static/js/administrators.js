// Administrators Page

let administratorsData = [];
let hostelsOptions = [];

const administratorsPage = {
    async load() {
        showLoading();
        try {
            administratorsData = await api.administrators.getAll();
            hostelsOptions = await api.hostels.getAll();
            this.renderTable();
            this.setupEventListeners();
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    },

    renderTable() {
        const tbody = document.getElementById('administrators-tbody');
        tbody.innerHTML = '';

        if (administratorsData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-user-tie"></i><h3>No administrators found</h3><p>Add a new administrator to get started</p></td></tr>';
            return;
        }

        administratorsData.forEach(admin => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${admin.admin_id}</td>
                <td>${admin.first_name}</td>
                <td>${admin.last_name}</td>
                <td><span class="badge badge-info">${admin.designation}</span></td>
                <td>${admin.contact_phone || '-'}</td>
                <td>${admin.email || '-'}</td>
                <td>${admin.hostel_name || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="administratorsPage.edit(${admin.admin_id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="administratorsPage.delete(${admin.admin_id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    setupEventListeners() {
        const addBtn = document.getElementById('add-administrator-btn');
        if (addBtn) {
            addBtn.onclick = () => this.showForm();
        }
    },

    showForm(admin = null) {
        const isEdit = admin !== null;
        const title = isEdit ? 'Edit Administrator' : 'Add Administrator';
        
        const hostelsSelect = hostelsOptions.map(h => 
            `<option value="${h.hostel_id}" ${admin?.hostel_id === h.hostel_id ? 'selected' : ''}>${h.hostel_name}</option>`
        ).join('');

        const form = `
            <form id="administrator-form">
                <div class="form-group">
                    <label for="first_name">First Name *</label>
                    <input type="text" id="first_name" name="first_name" value="${admin?.first_name || ''}" required>
                </div>
                <div class="form-group">
                    <label for="last_name">Last Name *</label>
                    <input type="text" id="last_name" name="last_name" value="${admin?.last_name || ''}" required>
                </div>
                <div class="form-group">
                    <label for="designation">Designation *</label>
                    <input type="text" id="designation" name="designation" value="${admin?.designation || ''}" required>
                </div>
                <div class="form-group">
                    <label for="contact_phone">Contact Phone</label>
                    <input type="text" id="contact_phone" name="contact_phone" value="${admin?.contact_phone || ''}">
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" value="${admin?.email || ''}">
                </div>
                <div class="form-group">
                    <label for="hostel_id">Hostel *</label>
                    <select id="hostel_id" name="hostel_id" required>
                        <option value="">Select Hostel</option>
                        ${hostelsSelect}
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="modal.close()">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Administrator</button>
                </div>
            </form>
        `;

        modal.open(title, form);

        const formElement = document.getElementById('administrator-form');
        formElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.save(admin?.admin_id);
        });
    },

    async save(adminId = null) {
        showLoading();
        try {
            const formData = {
                first_name: document.getElementById('first_name').value,
                last_name: document.getElementById('last_name').value,
                designation: document.getElementById('designation').value,
                contact_phone: document.getElementById('contact_phone').value || null,
                email: document.getElementById('email').value || null,
                hostel_id: parseInt(document.getElementById('hostel_id').value)
            };

            if (adminId) {
                await api.administrators.update(adminId, formData);
                showToast('Administrator updated successfully', 'success');
            } else {
                await api.administrators.create(formData);
                showToast('Administrator added successfully', 'success');
            }

            modal.close();
            await this.load();
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    },

    async edit(adminId) {
        showLoading();
        try {
            const admin = await api.administrators.get(adminId);
            this.showForm(admin);
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    },

    async delete(adminId) {
        const admin = administratorsData.find(a => a.admin_id === adminId);
        if (!confirmDelete(`${admin?.first_name} ${admin?.last_name}` || 'this administrator')) {
            return;
        }

        showLoading();
        try {
            await api.administrators.delete(adminId);
            showToast('Administrator deleted successfully', 'success');
            await this.load();
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    }
};

// Register administrators page
app.registerPage('administrators', administratorsPage);
