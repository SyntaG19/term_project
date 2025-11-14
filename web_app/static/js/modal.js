// Modal Management

const modal = {
    overlay: null,
    modal: null,
    title: null,
    body: null,
    closeBtn: null,

    init() {
        this.overlay = document.getElementById('modal-overlay');
        this.modal = document.getElementById('modal');
        this.title = document.getElementById('modal-title');
        this.body = document.getElementById('modal-body');
        this.closeBtn = document.getElementById('modal-close');

        // Close modal on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });

        // Close modal on close button click
        this.closeBtn.addEventListener('click', () => {
            this.close();
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
    },

    open(title, content) {
        this.title.textContent = title;
        this.body.innerHTML = content;
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    close() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        this.body.innerHTML = '';
    },

    isOpen() {
        return this.overlay.classList.contains('active');
    }
};

// Initialize modal on page load
document.addEventListener('DOMContentLoaded', () => {
    modal.init();
});
