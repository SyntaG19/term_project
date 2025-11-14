// Utility Functions

// Show loading spinner
function showLoading() {
    document.getElementById('loading-spinner').classList.add('active');
}

// Hide loading spinner
function hideLoading() {
    document.getElementById('loading-spinner').classList.remove('active');
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} active`;
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Format phone number
function formatPhone(phone) {
    if (!phone) return '-';
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Handle API errors
function handleError(error) {
    console.error('Error:', error);
    let errorMessage = 'An error occurred';
    
    if (error.message) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    } else if (error.error) {
        errorMessage = error.error;
    }
    
    // Don't redirect, just show error
    showToast(errorMessage, 'error');
    hideLoading();
}

// Confirm delete
function confirmDelete(itemName) {
    return confirm(`Are you sure you want to delete ${itemName}? This action cannot be undone.`);
}

// Format enum values for display
function formatEnum(value) {
    if (!value) return '-';
    return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Create action buttons
function createActionButtons(editHandler, deleteHandler, viewHandler = null) {
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'actions';
    
    if (viewHandler) {
        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-sm btn-secondary';
        viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
        viewBtn.onclick = viewHandler;
        actionsDiv.appendChild(viewBtn);
    }
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-primary';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.onclick = editHandler;
    actionsDiv.appendChild(editBtn);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-danger';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.onclick = deleteHandler;
    actionsDiv.appendChild(deleteBtn);
    
    return actionsDiv;
}
