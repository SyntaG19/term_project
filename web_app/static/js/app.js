// Main Application Router

const app = {
    currentPage: 'dashboard',
    pages: {},

    init() {
        this.setupNavigation();
        this.loadPage('dashboard');
        this.setupRefresh();
    },

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');
                this.loadPage(page);
                
                // Update active nav item
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
    },

    loadPage(pageName) {
        // Hide all pages
        const pages = document.querySelectorAll('.page-content');
        pages.forEach(page => page.classList.remove('active'));

        // Show selected page
        const selectedPage = document.getElementById(`${pageName}-page`);
        if (selectedPage) {
            selectedPage.classList.add('active');
            
            // Update page title
            const titles = {
                'dashboard': 'Dashboard',
                'hostels': 'Hostels',
                'students': 'Students',
                'rooms': 'Rooms',
                'batches': 'Batches',
                'administrators': 'Administrators',
                'roommates': 'Roommates',
                'zones': 'Allocation Zones',
                'allocation': 'Room Allocation'
            };
            
            document.getElementById('page-title').textContent = titles[pageName] || 'Dashboard';
            this.currentPage = pageName;

            // Load page data
            if (this.pages[pageName] && this.pages[pageName].load) {
                this.pages[pageName].load();
            }
        }
    },

    setupRefresh() {
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                if (this.pages[this.currentPage] && this.pages[this.currentPage].load) {
                    this.pages[this.currentPage].load();
                    showToast('Page refreshed', 'success');
                }
            });
        }
    },

    registerPage(pageName, pageObject) {
        this.pages[pageName] = pageObject;
    }
};

// Initialize app when DOM is loaded and all scripts are ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait a bit for all scripts to register
        setTimeout(() => {
            app.init();
        }, 100);
    });
} else {
    // DOM already loaded
    setTimeout(() => {
        app.init();
    }, 100);
}
