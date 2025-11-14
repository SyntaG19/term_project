// Room Allocation Page

let uploadedFileName = null;
let allocationResult = null;

const allocationPage = {
    async load() {
        this.setupEventListeners();
        await this.loadPreviousFiles();
    },

    setupEventListeners() {
        const fileInput = document.getElementById('file-input');
        const uploadArea = document.getElementById('upload-area');
        const removeFileBtn = document.getElementById('remove-file-btn');
        const runAllocationBtn = document.getElementById('run-allocation-btn');
        const refreshBtn = document.getElementById('refresh-allocation-btn');
        const downloadResultBtn = document.getElementById('download-result-btn');

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        // Upload area click
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    this.handleFileSelect(file);
                } else {
                    showToast('Please upload an Excel file (.xlsx or .xls)', 'error');
                }
            }
        });

        // Remove file
        removeFileBtn.addEventListener('click', () => {
            this.removeFile();
        });

        // Run allocation
        runAllocationBtn.addEventListener('click', () => {
            this.runAllocation();
        });

        // Refresh
        refreshBtn.addEventListener('click', () => {
            this.loadPreviousFiles();
        });

        // Download result
        downloadResultBtn.addEventListener('click', () => {
            this.downloadResult();
        });
    },

    async handleFileSelect(file) {
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            showToast('Please upload an Excel file (.xlsx or .xls)', 'error');
            return;
        }

        showLoading();
        try {
            // Upload file
            const response = await api.allocation.upload(file);
            uploadedFileName = response.filename;
            
            // Show file info
            document.getElementById('file-name').textContent = uploadedFileName;
            document.getElementById('file-info').style.display = 'block';
            document.getElementById('upload-area').style.display = 'none';
            document.getElementById('run-allocation-btn').disabled = false;
            
            showToast('File uploaded successfully', 'success');
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    },

    removeFile() {
        uploadedFileName = null;
        allocationResult = null;
        document.getElementById('file-input').value = '';
        document.getElementById('file-info').style.display = 'none';
        document.getElementById('upload-area').style.display = 'block';
        document.getElementById('run-allocation-btn').disabled = true;
        document.getElementById('allocation-results').style.display = 'none';
        document.getElementById('allocation-progress').style.display = 'none';
    },

    async runAllocation() {
        if (!uploadedFileName) {
            showToast('Please upload a file first', 'error');
            return;
        }

        showLoading();
        document.getElementById('allocation-progress').style.display = 'block';
        document.getElementById('allocation-results').style.display = 'none';
        document.getElementById('run-allocation-btn').disabled = true;

        try {
            // Simulate progress
            this.updateProgress(0, 'Uploading file...');
            await this.delay(500);

            this.updateProgress(30, 'Processing allocation...');
            const response = await api.allocation.run(uploadedFileName);

            this.updateProgress(70, 'Finalizing results...');
            await this.delay(500);

            this.updateProgress(100, 'Allocation completed!');
            allocationResult = response.result;

            // Show results
            this.displayResults(response.result);
            showToast('Allocation completed successfully', 'success');

            // Reload previous files
            await this.loadPreviousFiles();
        } catch (error) {
            handleError(error);
            document.getElementById('allocation-progress').style.display = 'none';
        } finally {
            hideLoading();
            document.getElementById('run-allocation-btn').disabled = false;
            setTimeout(() => {
                document.getElementById('allocation-progress').style.display = 'none';
            }, 1000);
        }
    },

    updateProgress(percentage, text) {
        document.getElementById('progress-fill').style.width = `${percentage}%`;
        document.getElementById('progress-text').textContent = text;
    },

    displayResults(result) {
        document.getElementById('total-students-count').textContent = result.total_students || 0;
        document.getElementById('allocated-count').textContent = result.allocated_count || 0;
        document.getElementById('unallocated-count').textContent = result.unallocated_count || 0;
        document.getElementById('allocation-results').style.display = 'block';
    },

    downloadResult() {
        if (!allocationResult || !allocationResult.final_file) {
            showToast('No allocation result available', 'error');
            return;
        }

        const filename = allocationResult.final_file.split(/[/\\]/).pop();
        api.allocation.download(filename);
    },

    async loadPreviousFiles() {
        try {
            const response = await api.allocation.listFiles();
            this.renderFilesTable(response.files || []);
        } catch (error) {
            console.error('Error loading files:', error);
        }
    },

    renderFilesTable(files) {
        const tbody = document.getElementById('allocation-files-tbody');
        tbody.innerHTML = '';

        if (files.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="empty-state"><i class="fas fa-file-excel"></i><h3>No previous allocations</h3><p>Upload and run allocation to see results here</p></td></tr>';
            return;
        }

        files.forEach(file => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${file.filename}</td>
                <td>${file.size_mb} MB</td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="allocationPage.downloadFile('${file.filename}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    downloadFile(filename) {
        api.allocation.download(filename);
    },

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Register allocation page
app.registerPage('allocation', allocationPage);
