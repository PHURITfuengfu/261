import { BasePage } from './common/page.js';

class PetitionPage extends BasePage {
    constructor() {
        super();
        this.petitionConfig = {
            'education': {
                title: 'คำร้องปกติศึกษา',
                onlineForm: 'petition_forms/education_form.html',
                uploadForm: 'petition_forms/education_upload.html'
            },
            'exam': {
                title: 'คำร้องกรณีขาดสอบ',
                onlineForm: 'petition_forms/exam_form.html',
                uploadForm: 'petition_forms/exam_upload.html'
            },
            'leave': {
                title: 'คำร้องขอลาพักการศึกษา',
                onlineForm: 'petition_forms/leave_form.html',
                uploadForm: 'petition_forms/leave_upload.html'
            },
            'transcript': {
                title: 'คำร้องรอการศึกษาตามหลักสูตร',
                onlineForm: 'petition_forms/transcript_form.html',
                uploadForm: 'petition_forms/transcript_upload.html'
            },
            'guardian': {
                title: 'หนังสือรับรองผู้ปกครอง',
                onlineForm: 'petition_forms/guardian_form.html',
                uploadForm: 'petition_forms/guardian_upload.html'
            }
        };

        // DOM Elements
        this.petitionTypeSection = document.getElementById('petitionTypeSection');
        this.submitMethodSection = document.getElementById('submitMethodSection');
        this.backButton = document.getElementById('backButton');
        this.selectedPetitionTitle = document.getElementById('selectedPetitionTitle');
        this.currentPetitionType = '';
    }

    async initializePage() {
        this.setupPetitionHandlers();
        this.setupFileUpload();
        this.checkUrlParameters();
    }

    setupPetitionHandlers() {
        // Petition Type Selection
        document.querySelectorAll('.petition-card[data-type]').forEach(card => {
            card.addEventListener('click', () => {
                const type = card.getAttribute('data-type');
                this.handlePetitionTypeSelection(type);
            });
        });

        // Submit Method Selection
        document.querySelectorAll('.petition-card[data-method]').forEach(card => {
            card.addEventListener('click', () => {
                const method = card.getAttribute('data-method');
                this.handleSubmitMethodSelection(method);
            });
        });

        // Back Button
        this.backButton.addEventListener('click', () => {
            this.resetPage();
            this.showSection(this.petitionTypeSection, this.submitMethodSection);
            const url = new URL(window.location);
            url.searchParams.delete('type');
            window.history.pushState({}, '', url);
        });

        // Browser Navigation
        window.addEventListener('popstate', () => {
            this.resetPage();
            const urlParams = new URLSearchParams(window.location.search);
            const type = urlParams.get('type');
            
            if (type && this.petitionConfig[type]) {
                this.handlePetitionTypeSelection(type);
            } else {
                this.showSection(this.petitionTypeSection, this.submitMethodSection);
            }
        });
    }

    setupFileUpload() {
        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.querySelector('.upload-btn');

        fileInput?.addEventListener('change', () => this.handleFileUpload());
        uploadBtn?.addEventListener('click', () => this.handleFileUpload());
    }

    checkUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        if (type && this.petitionConfig[type]) {
            this.handlePetitionTypeSelection(type);
        }
    }

    showSection(sectionToShow, sectionToHide) {
        sectionToHide.style.display = 'none';
        sectionToShow.style.display = 'block';
        
        sectionToShow.classList.add('fade-enter');
        setTimeout(() => {
            sectionToShow.classList.remove('fade-enter');
        }, 300);
    }

    handlePetitionTypeSelection(type) {
        if (!this.petitionConfig[type]) {
            this.showErrorModal('ไม่พบประเภทคำร้องที่เลือก');
            return;
        }

        this.currentPetitionType = type;
        this.selectedPetitionTitle.textContent = this.petitionConfig[type].title;
        this.showSection(this.submitMethodSection, this.petitionTypeSection);

        const url = new URL(window.location);
        url.searchParams.set('type', type);
        window.history.pushState({}, '', url);
    }

    handleSubmitMethodSelection(method) {
        if (!this.currentPetitionType) {
            this.showErrorModal('กรุณาเลือกประเภทคำร้อง');
            return;
        }

        const config = this.petitionConfig[this.currentPetitionType];
        
        try {
            if (method === 'online') {
                sessionStorage.setItem('lastPetitionType', this.currentPetitionType);
                sessionStorage.setItem('lastSubmitMethod', method);
                window.location.href = config.onlineForm;
            } else if (method === 'upload') {
                document.querySelector('.upload-section').style.display = 'block';
                document.querySelector('.submit-options').style.display = 'none';
            } else {
                this.showErrorModal('เกิดข้อผิดพลาดในการเลือกวิธีการยื่นคำร้อง');
            }
        } catch (error) {
            this.showErrorModal('เกิดข้อผิดพลาดในการนำทาง');
        }
    }

    handleFileUpload() {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput?.files[0];
        if (file) {
            // TODO: Implement file upload logic
            console.log('Uploading file:', file.name);
        }
    }

    resetPage() {
        document.querySelector('.upload-section').style.display = 'none';
        document.querySelector('.submit-options').style.display = 'block';
        this.currentPetitionType = '';
    }
}

// Initialize page
new PetitionPage();