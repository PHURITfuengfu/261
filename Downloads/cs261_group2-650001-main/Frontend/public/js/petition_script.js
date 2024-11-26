// Import API functions
import { isAuthenticated, getUserData, logout } from './API.js';

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    // DOM Elements
    const loadingOverlay = document.querySelector('.loading-overlay');
    const studentName = document.querySelector('.student-name');
    const studentId = document.querySelector('.student-id');
    const petitionTypeSection = document.getElementById('petitionTypeSection');
    const submitMethodSection = document.getElementById('submitMethodSection');
    const backButton = document.getElementById('backButton');
    const selectedPetitionTitle = document.getElementById('selectedPetitionTitle');
    const logoutBtn = document.querySelector('.menu-btn.logout');
    let currentMenuBtn = document.querySelector('.menu-btn.active');
    let currentPetitionType = '';

    // Configuration
    const petitionConfig = {
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

    // Utility Functions
    function toggleLoading(show) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    function showErrorModal(message) {
        const modal = document.getElementById('errorModal');
        const modalMessage = document.getElementById('modalMessage');
        modalMessage.textContent = message;
        modal.style.display = 'flex';
    }

    function showSection(sectionToShow, sectionToHide) {
        sectionToHide.style.display = 'none';
        sectionToShow.style.display = 'block';
        
        // Add animation class
        sectionToShow.classList.add('fade-enter');
        setTimeout(() => {
            sectionToShow.classList.remove('fade-enter');
        }, 300);
    }

    // Load User Data
    function loadUserData() {
        try {
            toggleLoading(true);

            const userData = getUserData();
            if (!userData) {
                window.location.href = 'index.html';
                return;
            }

            if (userData.type !== 'student') {
                showErrorModal('ไม่มีสิทธิ์เข้าถึงข้อมูล');
                window.location.href = 'index.html';
                return;
            }

            // Update profile section with full name
            studentName.textContent = userData.displayNameTH;
            studentId.textContent = userData.username;
        } catch (error) {
            console.error('Error loading student data:', error);
            showErrorModal('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            toggleLoading(false);
        }
    }

    // Handle Petition Type Selection
    function handlePetitionTypeSelection(type) {
        if (!petitionConfig[type]) {
            showErrorModal('ไม่พบประเภทคำร้องที่เลือก');
            return;
        }

        currentPetitionType = type;
        selectedPetitionTitle.textContent = petitionConfig[type].title;
        showSection(submitMethodSection, petitionTypeSection);

        // Update URL without reloading
        const url = new URL(window.location);
        url.searchParams.set('type', type);
        window.history.pushState({}, '', url);
    }

    // Handle Submit Method Selection
    function handleSubmitMethodSelection(method) {
        if (!currentPetitionType) {
            showErrorModal('กรุณาเลือกประเภทคำร้อง');
            return;
        }

        const config = petitionConfig[currentPetitionType];
        let formUrl;
        if (method === 'online') {
            formUrl = config.onlineForm;
        } else if (method === 'upload') {
            // Show the file upload section
            document.querySelector('.upload-section').style.display = 'block';
            document.querySelector('.submit-options').style.display = 'none';
            return; // Don't navigate anywhere, just show the upload section
        } else {
            showErrorModal('เกิดข้อผิดพลาดในการเลือกวิธีการยื่นคำร้อง');
            return;
        }

        try {
            // Save current state before navigation
            sessionStorage.setItem('lastPetitionType', currentPetitionType);
            sessionStorage.setItem('lastSubmitMethod', method);
            window.location.href = formUrl;
        } catch (error) {
            showErrorModal('เกิดข้อผิดพลาดในการนำทาง');
        }
    }

    // File Upload Functionality
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.querySelector('.upload-btn');

    fileInput.addEventListener('change', handleFileUpload);
    uploadBtn.addEventListener('click', handleFileUpload);

    function handleFileUpload() {
        const file = fileInput.files[0];
        if (file) {
            // Implement file upload logic here
            console.log('Uploading file:', file.name);
        }
    }

    // Event Listeners
    // Petition Type Selection
    document.querySelectorAll('.petition-card[data-type]').forEach(card => {
        card.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            handlePetitionTypeSelection(type);
        });
    });

    // Submit Method Selection
    document.querySelectorAll('.petition-card[data-method]').forEach(card => {
        card.addEventListener('click', function() {
            const method = this.getAttribute('data-method');
            handleSubmitMethodSelection(method);
        });
    });

    // Back Button
    backButton.addEventListener('click', () => {
        // Reset the page to the initial state
        resetPage();
        showSection(petitionTypeSection, submitMethodSection);
        // Update URL
        const url = new URL(window.location);
        url.searchParams.delete('type');
        window.history.pushState({}, '', url);
    });

    // Browser Navigation Handling
    window.addEventListener('popstate', () => {
        // Reset the page to the initial state
        resetPage();
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        
        if (type && petitionConfig[type]) {
            handlePetitionTypeSelection(type);
        } else {
            showSection(petitionTypeSection, submitMethodSection);
        }
    });

    function resetPage() {
        // Reset the page to the initial state
        document.querySelector('.upload-section').style.display = 'none';
        document.querySelector('.submit-options').style.display = 'block';
        currentPetitionType = '';
    }

    // Menu Navigation
    document.querySelectorAll('.menu-btn').forEach(button => {
        button.addEventListener('click', function() {
            if (this === logoutBtn) {
                handleLogout();
                return;
            }

            if (currentMenuBtn) {
                currentMenuBtn.classList.remove('active');
            }

            this.classList.add('active');
            currentMenuBtn = this;

            // Handle navigation
            switch(this.textContent.trim()) {
                case 'ข้อมูลส่วนตัว':
                    window.location.href = 'Student_history.html';
                    break;
                case 'ตรวจสอบสถานะคำร้อง':
                    window.location.href = 'check_status.html';
                    break;
            }
        });
    });

    // Handle Logout
    function handleLogout() {
        try {
            logout();
        } catch (error) {
            showErrorModal('ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง');
        }
    }

    // Modal Controls
    document.querySelector('.close-modal')?.addEventListener('click', () => {
        document.getElementById('errorModal').style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        const modal = document.getElementById('errorModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            document.getElementById('errorModal').style.display = 'none';
        }
    });

    // Browser Navigation Handling
    window.addEventListener('popstate', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        
        if (type && petitionConfig[type]) {
            handlePetitionTypeSelection(type);
        } else {
            showSection(petitionTypeSection, submitMethodSection);
        }
    });

    // Initialize
    function init() {
        toggleLoading(true);
        try {
            loadUserData();
            // Check URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const type = urlParams.get('type');
            if (type && petitionConfig[type]) {
                handlePetitionTypeSelection(type);
            }
        } catch (error) {
            showErrorModal('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            toggleLoading(false);
        }
    }

    init();
});