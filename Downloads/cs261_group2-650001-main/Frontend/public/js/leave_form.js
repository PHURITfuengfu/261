// Import API functions
import { isAuthenticated, getUserData, logout } from '../js/API.js';

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }

    // DOM Elements
    const loadingOverlay = document.querySelector('.loading-overlay');
    const studentName = document.querySelector('.student-name');
    const studentId = document.querySelector('.student-id');
    const leaveForm = document.getElementById('leaveForm');
    const logoutBtn = document.querySelector('.menu-btn.logout');
    const menuBtns = document.querySelectorAll('.menu-btn');
    
    // Form fields
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const firstNameEnInput = document.getElementById('firstNameEn');
    const lastNameEnInput = document.getElementById('lastNameEn');
    const idNumberInput = document.getElementById('idNumber');
    const subFields = document.querySelector('.sub-fields');
    
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

    // Load user data from API
    async function loadUserData() {
        try {
            toggleLoading(true);
            const userData = getUserData();
            
            if (!userData) {
                throw new Error('ไม่พบข้อมูลผู้ใช้');
            }

            // Display student name and ID in sidebar
            studentName.textContent = `${userData.displayNameTH || 'ไม่พบข้อมูล'}`;
            studentId.textContent = userData.username || 'ไม่พบข้อมูล';

            // Split display names
            let thNames = userData.displayNameTH ? userData.displayNameTH.split(' ') : ['', ''];
            let enNames = userData.displayNameEN ? userData.displayNameEN.split(' ') : ['', ''];

            // Populate form fields
            firstNameInput.value = thNames[0] || '';
            lastNameInput.value = thNames[1] || '';
            firstNameEnInput.value = enNames[0] || '';
            lastNameEnInput.value = enNames[1] || '';
            
            // Set ID number field to be editable
            idNumberInput.removeAttribute('disabled');
            idNumberInput.value = '';
            idNumberInput.placeholder = 'กรุณากรอกเลขทะเบียน';

        } catch (error) {
            console.error('Error loading user data:', error);
            showErrorModal('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            toggleLoading(false);
        }
    }

    // Handle menu navigation
    menuBtns.forEach(button => {
        button.addEventListener('click', function() {
            if (this === logoutBtn) {
                handleLogout();
                return;
            }

            menuBtns.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            switch(this.textContent.trim()) {
                case 'ข้อมูลส่วนตัว':
                    window.location.href = '../Student_history.html';
                    break;
                case 'เขียนคำร้อง':
                    window.location.href = '../petition_type.html';
                    break;
                case 'ตรวจสอบสถานะคำร้อง':
                    window.location.href = '../check_status.html';
                    break;
            }
        });
    });

    // Handle registration type selection
    document.querySelectorAll('input[name="registrationType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const subFieldsContainer = document.querySelector('.sub-fields');
            const registeredSemesterInput = document.querySelector('input[name="registeredSemester"]');
            const courseCodeInput = document.querySelector('input[name="courseCode"]');

            if (this.id === 'type2') {
                subFieldsContainer.style.display = 'grid';
                registeredSemesterInput.required = true;
                courseCodeInput.required = true;
            } else {
                subFieldsContainer.style.display = 'none';
                registeredSemesterInput.required = false;
                courseCodeInput.required = false;
                registeredSemesterInput.value = '';
                courseCodeInput.value = '';
            }
        });
    });

    // Phone number validation function
    function isValidPhoneNumber(phone) {
        // Allow Thai mobile numbers (10 digits) or landline numbers (9 digits)
        return /^[0-9]{9,10}$/.test(phone.replace(/[- ]/g, ''));
    }

    // Handle form submission
    leaveForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        try {
            toggleLoading(true);

            // Validate ID card number
            const idNumber = idNumberInput.value.trim();
            if (!idNumber) {
                throw new Error('กรุณากรอกเลขทะเบียน');
            }
            if (!/^\d{10}$/.test(idNumber)) {
                throw new Error('เลขทะเบียนไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
            }

            // Get form values
            const leaveReason = document.querySelector('input[name="leaveReason"]').value.trim();
            const semester = document.querySelector('input[name="semester"]').value.trim();
            const totalSemesters = document.querySelector('input[name="totalSemesters"]').value.trim();
            const contactAddress = document.querySelector('input[name="contactAddress"]').value.trim();
            const phoneNumber = document.querySelector('input[name="phoneNumber"]').value.trim();

            // Validate required fields
            if (!leaveReason || !semester || !totalSemesters || !contactAddress || !phoneNumber) {
                throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
            }

            // Validate phone number
            if (!isValidPhoneNumber(phoneNumber)) {
                throw new Error('หมายเลขโทรศัพท์ไม่ถูกต้อง');
            }

            // Get registration type and details
            const selectedRegistrationType = document.querySelector('input[name="registrationType"]:checked');
            if (!selectedRegistrationType) {
                throw new Error('กรุณาเลือกลักษณะการจดทะเบียน');
            }

            let registrationData = {
                type: selectedRegistrationType.value
            };

            if (selectedRegistrationType.id === 'type2') {
                const registeredSemester = document.querySelector('input[name="registeredSemester"]').value.trim();
                const courseCode = document.querySelector('input[name="courseCode"]').value.trim();

                if (!registeredSemester || !courseCode) {
                    throw new Error('กรุณากรอกข้อมูลภาคและรหัสวิชาที่จดทะเบียน');
                }

                registrationData.semester = registeredSemester;
                registrationData.courseCode = courseCode;
            }

            // Prepare form data
            const formData = {
                idNumber: idNumber,
                leaveReason: leaveReason,
                semester: semester,
                totalSemesters: totalSemesters,
                registration: registrationData,
                contactAddress: contactAddress,
                phoneNumber: phoneNumber
            };

            console.log('Form Data:', formData);
            // TODO: Send form data to API
            
            showErrorModal('ส่งคำร้องเรียบร้อยแล้ว');
            
            /*
            setTimeout(() => {
                window.location.href = '../check_status.html';
            }, 2000);
            */

        } catch (error) {
            console.error('Form submission error:', error);
            showErrorModal(error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        } finally {
            toggleLoading(false);
        }
    });

    // Handle logout
    function handleLogout() {
        try {
            logout();
        } catch (error) {
            showErrorModal('ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง');
        }
    }

    // Handle modal interactions
    document.querySelector('.close-modal')?.addEventListener('click', () => {
        document.getElementById('errorModal').style.display = 'none';
    });

    document.querySelector('.modal-btn')?.addEventListener('click', () => {
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

    // Initialize form
    loadUserData();
});