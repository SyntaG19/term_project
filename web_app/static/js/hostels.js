// Hostels Page

let hostelsData = [];
let hostelsOptions = [];

const hostelsPage = {
    async load() {
        showLoading();
        try {
            hostelsData = await api.hostels.getAll();
            hostelsOptions = hostelsData;
            this.renderTable();
            this.setupEventListeners();
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    },

    renderTable() {
        const tbody = document.getElementById('hostels-tbody');
        tbody.innerHTML = '';

        if (hostelsData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-building"></i><h3>No hostels found</h3><p>Add a new hostel to get started</p></td></tr>';
            return;
        }

        hostelsData.forEach(hostel => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${hostel.hostel_id}</td>
                <td>${hostel.hostel_name}</td>
                <td><span class="badge badge-info">${formatEnum(hostel.gender)}</span></td>
                <td><span class="badge badge-success">${formatEnum(hostel.occupancy_type)}</span></td>
                <td>${hostel.total_rooms || '-'}</td>
                <td>${hostel.phase || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="hostelsPage.edit(${hostel.hostel_id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="hostelsPage.delete(${hostel.hostel_id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    setupEventListeners() {
        const addBtn = document.getElementById('add-hostel-btn');
        if (addBtn) {
            addBtn.onclick = () => this.showForm();
        }
    },

    showForm(hostel = null) {
        const isEdit = hostel !== null;
        const title = isEdit ? 'Edit Hostel' : 'Add Hostel';
        
        const form = `
            <form id="hostel-form">
                <div class="form-group">
                    <label for="hostel_name">Hostel Name *</label>
                    <input type="text" id="hostel_name" name="hostel_name" value="${hostel?.hostel_name || ''}" required>
                </div>
                <div class="form-group">
                    <label for="gender">Gender *</label>
                    <select id="gender" name="gender" required>
                        <option value="">Select Gender</option>
                        <option value="Male" ${hostel?.gender === 'Male' ? 'selected' : ''}>Male</option>
                        <option value="Female" ${hostel?.gender === 'Female' ? 'selected' : ''}>Female</option>
                        <option value="Other" ${hostel?.gender === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="occupancy_type">Occupancy Type *</label>
                    <select id="occupancy_type" name="occupancy_type" required>
                        <option value="">Select Type</option>
                        <option value="Single" ${hostel?.occupancy_type === 'Single' ? 'selected' : ''}>Single</option>
                        <option value="Double" ${hostel?.occupancy_type === 'Double' ? 'selected' : ''}>Double</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="total_rooms">Total Rooms</label>
                    <input type="number" id="total_rooms" name="total_rooms" value="${hostel?.total_rooms || ''}">
                </div>
                <div class="form-group">
                    <label for="phase">Phase</label>
                    <input type="text" id="phase" name="phase" value="${hostel?.phase || ''}">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="modal.close()">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Hostel</button>
                </div>
            </form>
        `;

        modal.open(title, form);

        const formElement = document.getElementById('hostel-form');
        formElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.save(hostel?.hostel_id);
        });
    },

    async save(hostelId = null) {
        showLoading();
        try {
            const formData = {
                hostel_name: document.getElementById('hostel_name').value,
                gender: document.getElementById('gender').value,
                occupancy_type: document.getElementById('occupancy_type').value,
                total_rooms: document.getElementById('total_rooms').value || null,
                phase: document.getElementById('phase').value || null
            };

            if (hostelId) {
                await api.hostels.update(hostelId, formData);
                showToast('Hostel updated successfully', 'success');
            } else {
                await api.hostels.create(formData);
                showToast('Hostel added successfully', 'success');
            }

            modal.close();
            await this.load();
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    },

    async edit(hostelId) {
        showLoading();
        try {
            const hostel = await api.hostels.get(hostelId);
            this.showForm(hostel);
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    },

    async delete(hostelId) {
        const hostel = hostelsData.find(h => h.hostel_id === hostelId);
        if (!confirmDelete(hostel?.hostel_name || 'this hostel')) {
            return;
        }

        showLoading();
        try {
            await api.hostels.delete(hostelId);
            showToast('Hostel deleted successfully', 'success');
            await this.load();
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    }
};

// Register hostels page
app.registerPage('hostels', hostelsPage);
