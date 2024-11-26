import { isAuthenticated, getUserData, logout, studentApi } from '../API.js';

// Base class for all pages
export class BasePage {
    constructor() {
        // Common DOM elements
        this.loadingOverlay = document.querySelector('.loading-overlay');
        this.studentName = document.querySelector('.student-name');
        this.studentId = document.querySelector('.student-id');
        this.logoutBtn = document.querySelector('.menu-btn.logout');
        this.menuBtns = document.querySelectorAll('.menu-btn');
        this.currentMenuBtn = document.querySelector('.menu-btn.active');

        // Store student data
        this.studentData = null;

        // Initialize page
        this.init();
    }

    async init() {
        if (!isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }

        this.setupEventListeners();
        await this.loadUserData();
        await this.initializePage();
    }

    setupEventListeners() {
        // Setup menu navigation
        this.menuBtns.forEach(button => {
            button.addEventListener('click', (e) => this.handleMenuNavigation(e));
        });

        // Setup modal controls
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
    }

    async loadUserData() {
        try {
            this.toggleLoading(true);
            const sessionData = getUserData();
            
            if (!sessionData) {
                throw new Error('ไม่พบข้อมูลผู้ใช้');
            }

            if (sessionData.type !== 'student') {
                this.showErrorModal('ไม่มีสิทธิ์เข้าถึงข้อมูล');
                window.location.href = 'index.html';
                return;
            }

            // ดึงข้อมูลจาก database
            try {
                const response = await studentApi.getStudentByUsername(sessionData.username);
                
                if (response.status === 'success' && response.data) {
                    this.studentData = response.data;
                    
                    // Update UI with data from database
                    this.studentName.textContent = this.studentData.displayNameTh || sessionData.displayNameTH || 'ไม่พบข้อมูล';
                    this.studentId.textContent = this.studentData.username || sessionData.username || 'ไม่พบข้อมูล';

                    // Store additional information that might be needed later
                    this.studentInfo = {
                        id: this.studentData.id,
                        username: this.studentData.username,
                        displayNameTh: this.studentData.displayNameTh,
                        displayNameEn: this.studentData.displayNameEn,
                        email: this.studentData.email,
                        faculty: this.studentData.faculty,
                        department: this.studentData.department,
                        type: this.studentData.type,
                        tuStatus: this.studentData.tuStatus,
                        statusId: this.studentData.statusId,
                        organization: this.studentData.organization,
                        statusWork: this.studentData.statusWork,
                        statusEmp: this.studentData.statusEmp,
                        createdAt: this.studentData.createdAt
                    };

                } else {
                    console.warn('Student data not found in database, using session data');
                    // Fallback to session data if database data is not available
                    this.studentName.textContent = sessionData.displayNameTH || 'ไม่พบข้อมูล';
                    this.studentId.textContent = sessionData.username || 'ไม่พบข้อมูล';
                    
                    // Create student record if it doesn't exist
                    await this.createStudentRecord(sessionData);
                }
            } catch (error) {
                console.error('Error fetching student data from database:', error);
                // Fallback to session data if database fetch fails
                this.studentName.textContent = sessionData.displayNameTH || 'ไม่พบข้อมูล';
                this.studentId.textContent = sessionData.username || 'ไม่พบข้อมูล';
            }

            return this.studentData || sessionData;

        } catch (error) {
            console.error('Error loading user data:', error);
            this.showErrorModal('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            this.toggleLoading(false);
        }
    }

    async createStudentRecord(sessionData) {
        try {
            const studentData = {
                username: sessionData.username,
                type: sessionData.type,
                displayname_en: sessionData.displayNameEN,
                displayname_th: sessionData.displayNameTH,
                email: sessionData.email,
                department: sessionData.department,
                faculty: sessionData.faculty,
                tu_status: sessionData.tuStatus,
                statusid: sessionData.statusId,
                organization: sessionData.organization,
                StatusWork: sessionData.statusWork,
                StatusEmp: sessionData.statusEmp
            };

            const response = await studentApi.addStudent(studentData);
            if (response.status === 'success') {
                console.log('Created new student record in database');
                this.studentData = response.data;
            }
        } catch (error) {
            console.error('Error creating student record:', error);
        }
    }

    handleMenuNavigation(event) {
        const button = event.currentTarget;
        
        if (button === this.logoutBtn) {
            this.handleLogout();
            return;
        }

        if (this.currentMenuBtn) {
            this.currentMenuBtn.classList.remove('active');
        }

        button.classList.add('active');
        this.currentMenuBtn = button;

        // Handle navigation
        switch(button.textContent.trim()) {
            case 'ข้อมูลส่วนตัว':
                window.location.href = 'Student_history.html';
                break;
            case 'เขียนคำร้อง':
                window.location.href = 'petition_type.html';
                break;
            case 'ตรวจสอบสถานะคำร้อง':
                window.location.href = 'check_status.html';
                break;
            case 'ดูประวัติคำร้อง':
                window.location.href = 'check_History.html';
                break;
        }
    }

    handleLogout() {
        try {
            logout();
        } catch (error) {
            this.showErrorModal('ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง');
        }
    }

    toggleLoading(show) {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    showErrorModal(message) {
        const modal = document.getElementById('errorModal');
        const modalMessage = document.getElementById('modalMessage');
        if (modal && modalMessage) {
            modalMessage.textContent = message;
            modal.style.display = 'flex';
        }
    }

    // Helper method to get student data
    getStudentInfo() {
        return this.studentInfo;
    }

    // Abstract method to be implemented by child classes
    async initializePage() {
        throw new Error('initializePage must be implemented by child class');
    }
}

export function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
        .toString().padStart(2, '0')}/${date.getFullYear() + 543}`;
}

export function getStatusColorClass(status) {
    if (status.includes('อนุมัติ')) return 'status-approved';
    if (status.includes('ไม่อนุมัติ')) return 'status-rejected';
    return 'status-pending';
}