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
    const transcriptForm = document.getElementById('transcriptForm');
    const logoutBtn = document.querySelector('.menu-btn.logout');
    const menuBtns = document.querySelectorAll('.menu-btn');
    const semesterInput = document.querySelector('input[name="semester"]');
    const academicYearInput = document.querySelector('input[name="academicYear"]');
    
    // Form fields
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const firstNameEnInput = document.getElementById('firstNameEn');
    const lastNameEnInput = document.getElementById('lastNameEn');
    const idNumberInput = document.getElementById('idNumber');
    
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

    // Validate semester and year input format
    function validateSemesterYear(semester, year) {
        // Validate semester (should be 1 or 2)
        if (!/^[1-2]$/.test(semester)) {
            throw new Error('ภาคการศึกษาต้องเป็น 1 หรือ 2 เท่านั้น');
        }

        // Validate year (should be a valid year number)
        const currentYear = new Date().getFullYear() + 543; // Convert to Buddhist Era
        const inputYear = parseInt(year);
        if (isNaN(inputYear) || inputYear < currentYear - 10 || inputYear > currentYear + 5) {
            throw new Error('ปีการศึกษาไม่ถูกต้อง');
        }
    }

    // Handle major type selection and enable corresponding input field
    document.querySelectorAll('input[name="majorType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            // Disable all input fields first
            document.querySelectorAll('.major-detail').forEach(input => {
                input.disabled = true;
                input.value = '';
                input.required = false;
            });

            // Enable the corresponding input field
            const selectedOption = document.querySelector(`input[name="${this.id}Detail"]`);
            if (selectedOption) {
                selectedOption.disabled = false;
                selectedOption.required = true;
            }
        });
    });

    // Handle form submission
    transcriptForm.addEventListener('submit', async function(event) {
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

            // Load PDF and Font
            const pdfUrl = "../Form/ใบกระจายโครงสร้างหลักสูตร 2561.pdf";
            const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());

            const fontUrl = "../Form/THSarabunNew Bold.ttf";
            const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());

            const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
            pdfDoc.registerFontkit(window.fontkit);
            const customFont = await pdfDoc.embedFont(fontBytes);

            const pages = pdfDoc.getPages();
            const firstPage = pages[0];

            // Get and validate semester and academic year
            const semester = semesterInput.value.trim();
            const academicYear = academicYearInput.value.trim();
            if (!semester || !academicYear) {
                throw new Error('กรุณากรอกภาคการศึกษาและปีการศึกษา');
            }

            // Get and validate Thai name
            const thaiFullName = `${firstNameInput.value.trim()} ${lastNameInput.value.trim()}`;

            // Fill PDF with student data
            // เลขทะเบียน
            firstPage.drawText(idNumber, {
                x: 445, // ปรับตำแหน่ง x, y ให้ตรงกับตำแหน่งใน PDF
                y: 618,
                size: 18,
                font: customFont,
            });

            // ชื่อภาษาไทย
            firstPage.drawText(thaiFullName, {
                x: 155, // ปรับตำแหน่งให้ตรงกับ PDF
                y: 618,
                size: 18,
                font: customFont,
            });

            // คาดว่าจะจบ - ภาคการศึกษา
            firstPage.drawText(`${semester}`, {
                x: 275,
                y: 675,
                size: 25,
                font: customFont,
            });

            // คาดว่าจะจบ - ปีการศึกษา
            firstPage.drawText(`${academicYear}`, {
                x: 445,
                y: 675,
                size: 25,
                font: customFont,
            });

            // Get selected major type and its detail
            let selectedMajorType = document.querySelector('input[name="majorType"]:checked');
            if (!selectedMajorType) {
                throw new Error('กรุณาเลือกประเภทสาขาวิชา');
            }

            // กำหนดค่าให้ majorType จาก selectedMajorType ที่เลือก
            let majorType = selectedMajorType.value;

            // ดึงค่าจากช่องรายละเอียดของสาขาวิชาที่เลือก
            let majorDetailInput = document.querySelector(`input[name="${selectedMajorType.id}Detail"]`);
            let majorDetail = majorDetailInput ? majorDetailInput.value.trim() : '';

            // ตรวจสอบว่ามีการกรอกข้อมูลในช่องรายละเอียด
            if (!majorDetail) {
                throw new Error('กรุณากรอกรายละเอียดสาขาวิชา');
            }

            // Mark X on the selected major type
            let checkboxYPosition;
            if (majorType === 'สาขาวิชาเอก') {
                checkboxYPosition = 560;
            } else if (majorType === 'สาขาวิชาโท') {
                checkboxYPosition = 541;
            } else if (majorType === 'เลือกเสรี') {
                checkboxYPosition = 505;
            }

            if (checkboxYPosition) {
                firstPage.drawText("X", {
                    x: 108,
                    y: checkboxYPosition,
                    size: 30,
                    font: customFont,
                });
                // เติมข้อมูลรายละเอียดของสาขาวิชาที่เลือกลงใน PDF
                firstPage.drawText(majorDetail, {
                    x: 190,
                    y: checkboxYPosition + 5,
                    size: 18,
                    font: customFont,
            });
            }

            // Download filled PDF
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `ใบกระจายโครงสร้างหลักสูตร_เลขทะเบียน_${idNumber}.pdf`;
            link.click();

            showErrorModal('ส่งคำร้องเรียบร้อยแล้ว');
            
            setTimeout(() => {
                window.location.href = '../check_status.html';
            }, 2000);

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