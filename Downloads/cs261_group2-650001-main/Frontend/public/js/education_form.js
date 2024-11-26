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
    const educationForm = document.getElementById('educationForm');
    const logoutBtn = document.querySelector('.menu-btn.logout');
    const menuBtns = document.querySelectorAll('.menu-btn');
    
    // Form fields
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const firstNameEnInput = document.getElementById('firstNameEn');
    const lastNameEnInput = document.getElementById('lastNameEn');
    const idNumberInput = document.getElementById('idNumber');
    
    // Radio buttons and sub-fields
    const radioOptions = document.querySelectorAll('input[name="petitionType"]');

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
        idNumberInput.value = ''; // Clear any existing value
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

    // Handle radio button changes
    radioOptions.forEach(radio => {
        radio.addEventListener('change', function() {
            // Hide all sub-fields first
            document.querySelectorAll('.sub-fields').forEach(field => {
                field.style.display = 'none';
            });
            
            // Hide all sub-options first
            document.querySelectorAll('.sub-options').forEach(option => {
                option.style.display = 'none';
            });

            // Show relevant fields based on selection
            if (this.checked) {
                const parentLabel = this.parentElement;
                const subFields = parentLabel.querySelector('.sub-fields');
                const subOptions = parentLabel.querySelector('.sub-options');
                
                if (subFields) {
                    subFields.style.display = 'grid';
                }
                if (subOptions) {
                    subOptions.style.display = 'block';
                }
            }
        });
    });

    // Handle form submission
    educationForm.addEventListener('submit', async function(event) {
        event.preventDefault();
    
        try {
            toggleLoading(true);
    
            // Get form data
            const subject = document.querySelector('input[name="subject"]').value.trim();
            const selectedTypeRadio = document.querySelector('input[name="petitionType"]:checked');
            const petitionType = selectedTypeRadio?.value || '';
    
            if (!subject) throw new Error('กรุณากรอกเรื่องที่ต้องการยื่นคำร้อง');
            if (!petitionType) throw new Error('กรุณาเลือกประเภทคำร้อง');
    
            // Load and modify PDF template
            const pdfBytes = await fetch("../Form/ฟอร์ม_คำร้องนักศึกษาภาคพิเศษ.pdf").then(res => res.arrayBuffer());
            const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
            
            pdfDoc.registerFontkit(fontkit);
    
            // Embed Thai font
            const fontUrl = "../Form/THSarabunNew Bold.ttf";
            const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());
            const customFont = await pdfDoc.embedFont(fontBytes);
    
            const page = pdfDoc.getPage(0);
    
            // Set form data on PDF
            page.drawText(firstNameInput.value + ' ' + lastNameInput.value, { x: 200, y: 710, size: 18, font: customFont });
            page.drawText(idNumberInput.value, { x: 408, y: 710, size: 18, font: customFont });
            page.drawText(subject, { x: 100, y: 753, size: 18, font: customFont });
    
            // Set course code if applicable
            let courseCode = ''; // Initializing courseCode as empty string
            const courseCodeField = selectedTypeRadio.closest('.radio-option').querySelector('.course-code');
            const withdrawalType = document.querySelector('input[name="withdrawalType"]:checked')?.value;

            if (courseCodeField) {
                courseCode = courseCodeField.value.trim();
            }

            // Determine position for checkboxes and course code text
            let yPositionCheckbox = null;
            let textPositionX = 135;

            // Check which petition type was selected and place corresponding data
            switch (petitionType) {
                case 'จดทะเบียนล่าช้า/เพิ่มล่าช้า':
                    yPositionCheckbox = 610;
                    break;

                case 'ขอถอนวิชา/ถอนรายวิชา (Drop W)':
                    yPositionCheckbox = 577;
                    break;

                case 'ขอจดทะเบียนศึกษารายวิชาข้ามหลักสูตร':
                    yPositionCheckbox = 543;
                    break;

                case 'ขอลาออก':
                    yPositionCheckbox = 510;
                    if (withdrawalType === 'ไม่มีภาระหนี้สินคงค้าง') {
                    page.drawText('X', { x: 98, y: 476, size: 35, font: customFont });
                    }
                    break;

                case 'อื่นๆ (โปรดระบุ)':
                    yPositionCheckbox = 410;
                    break;
            }

            // Add checkmark at selected checkbox position
            if (typeof yPositionCheckbox === 'number' && !isNaN(yPositionCheckbox)) {
                page.drawText('X', { x: 76, y: yPositionCheckbox, size: 35, font: customFont });
            } else {
                console.error("Invalid yPositionCheckbox value:", yPositionCheckbox);
            }

            // Place course code if applicable
            if (courseCode) {
                page.drawText(courseCode, { x: textPositionX, y: yPositionCheckbox - 9, size: 18, font: customFont });
            }

            // Save and download the filled PDF
            const pdfBytesFilled = await pdfDoc.save();
            const blob = new Blob([pdfBytesFilled], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'ฟอร์ม_คำร้องนักศึกษาภาคพิเศษ.pdf';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);

            showErrorModal('ส่งคำร้องเรียบร้อยแล้ว');
            setTimeout(() => {
                window.location.href = '../check_status.html';
            }, 2000);

        } catch (error) {
            console.error('Error creating PDF:', error);
            showErrorModal('เกิดข้อผิดพลาดในการสร้าง PDF: ' + error.message);
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

    // Initialize
    loadUserData();
});