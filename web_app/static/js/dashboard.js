// Dashboard Page

const dashboardPage = {
    async load() {
        showLoading();
        try {
            const stats = await api.dashboard.getStats();
            this.renderStats(stats);
        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    },

    renderStats(stats) {
        document.getElementById('total-hostels').textContent = stats.total_hostels || 0;
        document.getElementById('total-students').textContent = stats.total_students || 0;
        document.getElementById('total-rooms').textContent = stats.total_rooms || 0;
        document.getElementById('occupied-rooms').textContent = stats.occupied_rooms || 0;
        document.getElementById('available-rooms').textContent = stats.available_rooms || 0;
        document.getElementById('total-batches').textContent = stats.total_batches || 0;
    }
};

// Register dashboard page
app.registerPage('dashboard', dashboardPage);
