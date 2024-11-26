import { getUserData, logout } from './API.js';

document.addEventListener('DOMContentLoaded', function() {
    const loadingOverlay = document.querySelector('.loading-overlay');
    const studentName = document.querySelector('.student-name');
    const studentId = document.querySelector('.student-id');
    const logoutBtn = document.querySelector('.menu-btn.logout');
    let currentMenuBtn = document.querySelector('.menu-btn.active');

    // Function to show/hide loading overlay
    function toggleLoading(show) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    // Function to show error modal
    function showErrorModal(message) {
        const modal = document.getElementById('errorModal');
        const modalMessage = document.getElementById('modalMessage');
        modalMessage.textContent = message;
        modal.style.display = 'flex';
    }

    // Function to populate form fields
    function populateFormField(id, value) {
        const element = document.getElementById(id);
        if (element) {
            if (element.tagName === 'SELECT') {
                // For select elements, find and select the matching option
                const options = Array.from(element.options);
                const matchingOption = options.find(option => 
                    option.value === value || 
                    option.textContent === value
                );
                if (matchingOption) {
                    element.value = matchingOption.value;
                }
            } else {
                // For regular input fields
                element.value = value || '';
            }
        }
    }

    // Function to load and display student data
    function loadStudentData() {
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

            // Populate Thai name (based on API response format)
            if (userData.firstNameTH && userData.lastNameTH) {
                populateFormField('firstName', userData.firstNameTH);
                populateFormField('lastName', userData.lastNameTH);
            } else {
                // Fallback: Split displayNameTH if individual fields aren't available
                const nameParts = userData.displayNameTH.split(' ');
                if (nameParts.length >= 2) {
                    populateFormField('firstName', nameParts[0]);
                    populateFormField('lastName', nameParts[1]);
                }
            }

            // Populate English name (based on API response format)
            if (userData.firstNameEN && userData.lastNameEN) {
                populateFormField('firstNameEn', userData.firstNameEN);
                populateFormField('lastNameEn', userData.lastNameEN);
            } else {
                // Fallback: Split displayNameEN if individual fields aren't available
                const nameParts = userData.displayNameEN.split(' ');
                if (nameParts.length >= 2) {
                    populateFormField('firstNameEn', nameParts[0]);
                    populateFormField('lastNameEn', nameParts[1]);
                }
            }
            
            // Populate academic information
            populateFormField('faculty', userData.faculty);
            populateFormField('department', userData.department);
            populateFormField('major', userData.department); // Using department as major if not provided
            populateFormField('status', userData.tuStatus);
            populateFormField('email', userData.email);
            
            // Additional fields (if available in the API response)
            if (userData.studentInfo) {
                populateFormField('id-number', userData.studentInfo.citizenId);
                populateFormField('advisor', userData.studentInfo.advisorName);
                populateFormField('gpax', userData.studentInfo.gpax);
                populateFormField('phone', userData.studentInfo.phone);
                populateFormField('address', userData.studentInfo.address);
            }

        } catch (error) {
            console.error('Error loading student data:', error);
            showErrorModal('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            toggleLoading(false);
        }
    }

    // Handle menu button clicks
    document.querySelectorAll('.menu-btn').forEach(button => {
        button.addEventListener('click', function() {
            if (this === logoutBtn) {
                logout();
                return;
            }

            if (currentMenuBtn) {
                currentMenuBtn.classList.remove('active');
            }

            this.classList.add('active');
            currentMenuBtn = this;

            switch(this.textContent) {
                case 'เขียนคำร้อง':
                    window.location.href = 'petition_type.html';
                    break;
                case 'ตรวจสอบสถานะคำร้อง':
                    window.location.href = 'check_status.html';
                    break;
            }
        });
    });

    // Handle modal close button
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('errorModal').style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('errorModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Listen for escape key to close modal
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            document.getElementById('errorModal').style.display = 'none';
        }
    });

    // Initial load
    loadStudentData();
});