// Room Allocation Zones Page

let zonesData = [];
let hostelsOptions = [];
let batchesOptions = [];

const zonesPage = {
    async load() {
        showLoading();
        try {
            zonesData = await api.zones.getAll();
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
        const tbody = document.getElementById('zones-tbody');
        tbody.innerHTML = '';

        if (zonesData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-map-marked-alt"></i><h3>No allocation zones found</h3><p>Add a new zone to get started</p></td></tr>';
            return;
        }

        zonesData.forEach(zone => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${zone.zone_id}</td>
                <td>${zone.hostel_name || '-'}</td>
                <td>${zone.batch_name || '-'}</td>
                <td>${zone.start_room_no}</td>
                <td>${zone.end_room_no}</td>
                <td>${zone.remarks || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="zonesPage.edit(${zone.zone_id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="zonesPage.delete(${zone.zone_id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    setupEventListeners() {
        const addBtn = document.getElementById('add-zone-btn');
        if (addBtn) {
            addBtn.onclick = () => this.showForm();
        }
    },

    showForm(zone = null) {
        const isEdit = zone !== null;
        const title = isEdit ? 'Edit Allocation Zone' : 'Add Allocation Zone';
        
        const hostelsSelect = hostelsOptions.map(h => 
            `<option value="${h.hostel_id}" ${zone?.hostel_id === h.hostel_id ? 'selected' : ''}>${h.hostel_name}</option>`
        ).join('');

        const batchesSelect = batchesOptions.map(b => 
            `<option value="${b.batch_id}" ${zone?.batch_id === b.batch_id ? 'selected' : ''}>${b.batch_id}</option>`
        ).join('');

        const form = `
            <form id="zone-form">
                <div class="form-group">
                    <label for="hostel_id">Hostel *</label>
                    <select id="hostel_id" name="hostel_id" required>
                        <option value="">Select Hostel</option>
                        ${hostelsSelect}
                    </select>
                </div>
                <div class="form-group">
                    <label for="batch_id">Batch *</label>
                    <select id="batch_id" name="batch_id" required>
                        <option value="">Select Batch</option>
                        ${batchesSelect}
                    </select>
                </div>
                <div class="form-group">
                    <label for="start_room_no">Start Room No *</label>
                    <input type="text" id="start_room_no" name="start_room_no" value="${zone?.start_room_no || ''}" required>
                </div>
                <div class="form-group">
                    <label for="end_room_no">End Room No *</label>
                    <input type="text" id="end_room_no" name="end_room_no" value="${zone?.end_room_no || ''}" required>
                </div>
                <div class="form-group">
                    <label for="remarks">Remarks</label>
                    <textarea id="remarks" name="remarks">${zone?.remarks || ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="modal.close()">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Zone</button>
                </div>
            </form>
        `;

        modal.open(title, form);

        const formElement = document.getElementById('zone-form');
        formElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.save(zone?.zone_id);
        });
    },

    async save(zoneId = null) {
        showLoading();
        try {
            const formData = {
                hostel_id: parseInt(document.getElementById('hostel_id').value),
                batch_id: document.getElementById('batch_id').value,
                start_room_no: document.getElementById('start_room_no').value,
                end_room_no: document.getElementById('end_room_no').value,
                remarks: document.getElementById('remarks').value || null
            };

            if (zoneId) {
                await api.zones.update(zoneId, formData);
                showToast('Allocation zone updated successfully', 'success');
            } else {
                await api.zones.create(formData);
                showToast('Allocation zone added successfully', 'success');
            }

            modal.close();
            await this.load();
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    },

    async edit(zoneId) {
        showLoading();
        try {
            const zone = await api.zones.get(zoneId);
            this.showForm(zone);
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    },

    async delete(zoneId) {
        const zone = zonesData.find(z => z.zone_id === zoneId);
        if (!confirmDelete(`zone ${zoneId}`)) {
            return;
        }

        showLoading();
        try {
            await api.zones.delete(zoneId);
            showToast('Allocation zone deleted successfully', 'success');
            await this.load();
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    }
};

// Register zones page
app.registerPage('zones', zonesPage);
