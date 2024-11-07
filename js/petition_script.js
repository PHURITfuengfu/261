// Import API functions
import { isAuthenticated, getUserData, logout } from './API.js';

document.addEventListener('DOMContentLoaded', function() {
    // ตรวจสอบการยืนยันตัวตน
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

    // Configuration for petition types
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

    // Utility functions
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
        sectionToShow.classList.add('fade-enter');
        setTimeout(() => {
            sectionToShow.classList.remove('fade-enter');
        }, 300);
    }

    // Load user data
    function loadUserData() {
        try {
            const userData = getUserData();
            if (!userData) throw new Error('ไม่พบข้อมูลผู้ใช้');

            studentName.textContent = userData.displayNameTH || 'ไม่พบข้อมูล';
            studentId.textContent = userData.username || 'ไม่พบข้อมูล';
        } catch (error) {
            console.error('Error loading user data:', error);
            showErrorModal(error.message);
        }
    }

    // Handle petition type selection
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

    // Handle submit method selection
    function handleSubmitMethodSelection(method) {
        if (!currentPetitionType) {
            showErrorModal('กรุณาเลือกประเภทคำร้อง');
            return;
        }

        const config = petitionConfig[currentPetitionType];
        const formUrl = method === 'online' ? config.onlineForm : config.uploadForm;

        try {
            sessionStorage.setItem('lastPetitionType', currentPetitionType);
            sessionStorage.setItem('lastSubmitMethod', method);
            window.location.href = formUrl;
        } catch (error) {
            showErrorModal('เกิดข้อผิดพลาดในการนำทาง');
        }
    }

    // Menu navigation
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

            switch(this.textContent.trim()) {
                case 'ข้อมูลส่วนตัว':
                    window.location.href = 'Student_history.html';
                    break;
                case 'เขียนคำร้อง':
                    window.location.href = 'petition_type.html';
                    break;
                case 'ตรวจสอบสถานะคำร้อง':
                    window.location.href = 'check_status.html';
                    break;
                default:
                    console.warn('ไม่พบเส้นทางสำหรับปุ่มนี้');
            }
        });
    });

    // Logout function
    function handleLogout() {
        try {
            logout();
            window.location.href = 'index.html';
        } catch (error) {
            showErrorModal('ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง');
        }
    }

    // Modal controls
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

    // Initialize function
    function init() {
        toggleLoading(true);
        try {
            loadUserData();
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
