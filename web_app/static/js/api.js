// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// API Utility Functions
const api = {
    // Generic fetch function
    async request(endpoint, options = {}) {
        try {
            const url = `${API_BASE_URL}${endpoint}`;
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options,
                credentials: 'same-origin' // Prevent redirects
            };

            // Remove Content-Type for FormData
            if (options.body && options.body instanceof FormData) {
                delete config.headers['Content-Type'];
            } else if (config.body && typeof config.body === 'object') {
                config.body = JSON.stringify(config.body);
            }

            const response = await fetch(url, config);

            // Check if response was redirected
            if (response.redirected) {
                throw new Error('Request was redirected. Please check server configuration.');
            }

            // Check if response is JSON
            const contentType = response.headers.get('content-type') || '';
            
            // Handle non-JSON responses (like file downloads)
            if (!contentType.includes('application/json')) {
                if (!response.ok) {
                    const text = await response.text().catch(() => 'Unknown error');
                    // Check if it's HTML (likely a redirect or error page)
                    if (text.trim().startsWith('<!') || text.includes('<html')) {
                        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. Please check your server configuration.`);
                    }
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
                }
                // For file downloads, return the response
                return response;
            }

            // Parse JSON response
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                // If JSON parsing fails, try to get text
                const text = await response.text().catch(() => 'Unknown error');
                throw new Error(`Failed to parse JSON response: ${text.substring(0, 100)}`);
            }

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            // Check if error is a network error or redirect
            if (error.message && error.message.includes('redirect')) {
                console.error('Request was redirected. This might indicate a server configuration issue.');
                throw new Error('Server configuration error: Request was redirected. Please check your backend server.');
            }
            // Don't redirect on error, just throw
            throw error;
        }
    },

    // GET request
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    // POST request
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    },

    // PUT request
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    },

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },

    // Hostels
    hostels: {
        getAll: () => api.get('/hostels'),
        get: (id) => api.get(`/hostels/${id}`),
        create: (data) => api.post('/hostels', data),
        update: (id, data) => api.put(`/hostels/${id}`, data),
        delete: (id) => api.delete(`/hostels/${id}`)
    },

    // Students
    students: {
        getAll: () => api.get('/students'),
        get: (id) => api.get(`/students/${id}`),
        create: (data) => api.post('/students', data),
        update: (id, data) => api.put(`/students/${id}`, data),
        delete: (id) => api.delete(`/students/${id}`)
    },

    // Rooms
    rooms: {
        getAll: () => api.get('/rooms'),
        get: (id) => api.get(`/rooms/${id}`),
        create: (data) => api.post('/rooms', data),
        update: (id, data) => api.put(`/rooms/${id}`, data),
        delete: (id) => api.delete(`/rooms/${id}`)
    },

    // Batches
    batches: {
        getAll: () => api.get('/batches'),
        get: (id) => api.get(`/batches/${id}`),
        create: (data) => api.post('/batches', data),
        update: (id, data) => api.put(`/batches/${id}`, data),
        delete: (id) => api.delete(`/batches/${id}`)
    },

    // Administrators
    administrators: {
        getAll: () => api.get('/administrators'),
        get: (id) => api.get(`/administrators/${id}`),
        create: (data) => api.post('/administrators', data),
        update: (id, data) => api.put(`/administrators/${id}`, data),
        delete: (id) => api.delete(`/administrators/${id}`)
    },

    // Roommates
    roommates: {
        getAll: () => api.get('/roommates'),
        get: (id) => api.get(`/roommates/${id}`),
        create: (data) => api.post('/roommates', data),
        update: (id, data) => api.put(`/roommates/${id}`, data),
        delete: (id) => api.delete(`/roommates/${id}`)
    },

    // Room Allocation Zones
    zones: {
        getAll: () => api.get('/room-alloc-zones'),
        get: (id) => api.get(`/room-alloc-zones/${id}`),
        create: (data) => api.post('/room-alloc-zones', data),
        update: (id, data) => api.put(`/room-alloc-zones/${id}`, data),
        delete: (id) => api.delete(`/room-alloc-zones/${id}`)
    },

    // Dashboard
    dashboard: {
        getStats: () => api.get('/dashboard/stats')
    },

    // Room Allocation
    allocation: {
        upload: async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            try {
                const response = await fetch(`${API_BASE_URL}/allocation/upload`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                });
                
                if (!response.ok) {
                    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
                    throw new Error(error.error || 'Upload failed');
                }
                
                return await response.json();
            } catch (error) {
                console.error('Upload error:', error);
                throw error;
            }
        },
        run: (filename) => api.post('/allocation/run', { filename }),
        download: async (filename) => {
            try {
                const url = `${API_BASE_URL}/allocation/download/${encodeURIComponent(filename)}`;
                const response = await fetch(url, {
                    method: 'GET',
                    credentials: 'same-origin'
                });
                
                if (!response.ok) {
                    throw new Error('Download failed');
                }
                
                // Create blob and download
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(downloadUrl);
            } catch (error) {
                console.error('Download error:', error);
                showToast('Download failed: ' + error.message, 'error');
                throw error;
            }
        },
        listFiles: () => api.get('/allocation/list')
    }
};
