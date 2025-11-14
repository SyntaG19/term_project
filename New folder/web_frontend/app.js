// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Utility function to handle API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Display alert message
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.container main') || document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Format currency
function formatCurrency(amount) {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

// Show loading spinner
function showLoading(element) {
    element.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';
}

// Show empty state
function showEmptyState(element, message = 'No data available') {
    element.innerHTML = `<div class="empty-state"><h3>${message}</h3></div>`;
}

// Create table row
function createTableRow(data, columns, actions = null) {
    const row = document.createElement('tr');
    
    columns.forEach(column => {
        const cell = document.createElement('td');
        if (typeof column === 'string') {
            cell.textContent = data[column] || '-';
        } else if (typeof column === 'object') {
            cell.textContent = column.formatter ? column.formatter(data[column.key]) : (data[column.key] || '-');
        }
        row.appendChild(cell);
    });
    
    if (actions) {
        const actionCell = document.createElement('td');
        actionCell.className = 'actions';
        
        if (actions.edit) {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-primary btn-small';
            editBtn.textContent = 'Edit';
            editBtn.onclick = () => actions.edit(data);
            actionCell.appendChild(editBtn);
        }
        
        if (actions.delete) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger btn-small';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => actions.delete(data);
            actionCell.appendChild(deleteBtn);
        }
        
        row.appendChild(actionCell);
    }
    
    return row;
}

// Populate select dropdown
function populateSelect(selectId, options, valueKey = 'value', textKey = 'text', selectedValue = null) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Select...</option>';
    
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = typeof option === 'object' ? option[valueKey] : option;
        opt.textContent = typeof option === 'object' ? option[textKey] : option;
        if (selectedValue && opt.value == selectedValue) {
            opt.selected = true;
        }
        select.appendChild(opt);
    });
}

// Get form data
function getFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return {};
    
    const formData = new FormData(form);
    const data = {};
    
    formData.forEach((value, key) => {
        if (value) {
            data[key] = value;
        }
    });
    
    // Handle checkboxes and special fields
    form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        data[checkbox.name] = checkbox.checked;
    });
    
    return data;
}

// Set form data
function setFormData(formId, data) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    Object.keys(data).forEach(key => {
        const field = form.querySelector(`[name="${key}"]`);
        if (field) {
            if (field.type === 'checkbox') {
                field.checked = data[key];
            } else {
                field.value = data[key] || '';
            }
        }
    });
}

// Clear form
function clearForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.reset();
}

// Confirm delete
function confirmDelete(message, callback) {
    if (confirm(message || 'Are you sure you want to delete this item?')) {
        callback();
    }
}

// Export functions for use in other scripts
window.apiCall = apiCall;
window.showAlert = showAlert;
window.formatDate = formatDate;
window.formatCurrency = formatCurrency;
window.showLoading = showLoading;
window.showEmptyState = showEmptyState;
window.createTableRow = createTableRow;
window.populateSelect = populateSelect;
window.getFormData = getFormData;
window.setFormData = setFormData;
window.clearForm = clearForm;
window.confirmDelete = confirmDelete;
