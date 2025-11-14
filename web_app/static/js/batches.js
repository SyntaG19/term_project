// Batches Page

let batchesData = [];

const batchesPage = {
    async load() {
        showLoading();
        try {
            batchesData = await api.batches.getAll();
            this.renderTable();
            this.setupEventListeners();
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    },

    renderTable() {
        const tbody = document.getElementById('batches-tbody');
        tbody.innerHTML = '';

        if (batchesData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-users"></i><h3>No batches found</h3><p>Add a new batch to get started</p></td></tr>';
            return;
        }

        batchesData.forEach(batch => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${batch.batch_id}</td>
                <td><span class="badge badge-info">${formatEnum(batch.program)}</span></td>
                <td>${batch.year_of_study || '-'}</td>
                <td><span class="badge ${batch.status === 'Active' ? 'badge-success' : 'badge-danger'}">${formatEnum(batch.status)}</span></td>
                <td>${batch.remarks || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="batchesPage.edit('${batch.batch_id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="batchesPage.delete('${batch.batch_id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    setupEventListeners() {
        const addBtn = document.getElementById('add-batch-btn');
        if (addBtn) {
            addBtn.onclick = () => this.showForm();
        }
    },

    showForm(batch = null) {
        const isEdit = batch !== null;
        const title = isEdit ? 'Edit Batch' : 'Add Batch';
        
        const form = `
            <form id="batch-form">
                <div class="form-group">
                    <label for="batch_id">Batch ID *</label>
                    <input type="text" id="batch_id" name="batch_id" value="${batch?.batch_id || ''}" ${isEdit ? 'readonly' : ''} required>
                </div>
                <div class="form-group">
                    <label for="program">Program *</label>
                    <select id="program" name="program" required>
                        <option value="">Select Program</option>
                        <option value="BTech" ${batch?.program === 'BTech' ? 'selected' : ''}>BTech</option>
                        <option value="MTech" ${batch?.program === 'MTech' ? 'selected' : ''}>MTech</option>
                        <option value="PhD" ${batch?.program === 'PhD' ? 'selected' : ''}>PhD</option>
                        <option value="Guest" ${batch?.program === 'Guest' ? 'selected' : ''}>Guest</option>
                        <option value="Other" ${batch?.program === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="year_of_study">Year of Study</label>
                    <input type="number" id="year_of_study" name="year_of_study" value="${batch?.year_of_study || ''}" min="1" max="5">
                </div>
                <div class="form-group">
                    <label for="status">Status</label>
                    <select id="status" name="status">
                        <option value="Active" ${batch?.status === 'Active' ? 'selected' : ''}>Active</option>
                        <option value="Graduated" ${batch?.status === 'Graduated' ? 'selected' : ''}>Graduated</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="remarks">Remarks</label>
                    <textarea id="remarks" name="remarks">${batch?.remarks || ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="modal.close()">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Batch</button>
                </div>
            </form>
        `;

        modal.open(title, form);

        const formElement = document.getElementById('batch-form');
        formElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.save(batch?.batch_id);
        });
    },

    async save(batchId = null) {
        showLoading();
        try {
            const formData = {
                batch_id: document.getElementById('batch_id').value,
                program: document.getElementById('program').value,
                year_of_study: document.getElementById('year_of_study').value ? parseInt(document.getElementById('year_of_study').value) : null,
                status: document.getElementById('status').value || 'Active',
                remarks: document.getElementById('remarks').value || null
            };

            if (batchId) {
                await api.batches.update(batchId, formData);
                showToast('Batch updated successfully', 'success');
            } else {
                await api.batches.create(formData);
                showToast('Batch added successfully', 'success');
            }

            modal.close();
            await this.load();
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    },

    async edit(batchId) {
        showLoading();
        try {
            const batch = await api.batches.get(batchId);
            this.showForm(batch);
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    },

    async delete(batchId) {
        const batch = batchesData.find(b => b.batch_id === batchId);
        if (!confirmDelete(batch?.batch_id || 'this batch')) {
            return;
        }

        showLoading();
        try {
            await api.batches.delete(batchId);
            showToast('Batch deleted successfully', 'success');
            await this.load();
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    }
};

// Register batches page
app.registerPage('batches', batchesPage);
