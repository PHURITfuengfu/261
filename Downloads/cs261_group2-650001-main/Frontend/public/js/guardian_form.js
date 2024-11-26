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
    const guardianForm = document.getElementById('guardianForm');
    const logoutBtn = document.querySelector('.menu-btn.logout');
    const menuBtns = document.querySelectorAll('.menu-btn');
    
    // Form fields
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const firstNameEnInput = document.getElementById('firstNameEn');
    const lastNameEnInput = document.getElementById('lastNameEn');
    const idNumberInput = document.getElementById('idNumber');
    const otherReasonInput = document.querySelector('.reason-input');
    
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

    // Handle permission type selection
    document.querySelectorAll('input[name="permissionType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.id === 'type5') {
                otherReasonInput.style.display = 'block';
                otherReasonInput.required = true;
            } else {
                otherReasonInput.style.display = 'none';
                otherReasonInput.required = false;
                otherReasonInput.value = '';
            }
        });
    });

        // Handle form submission
        guardianForm.addEventListener('submit', async function(event) {
            event.preventDefault();
    
            try {
                toggleLoading(true);
    
                // Validate ID card number
                const idNumber = document.getElementById('idNumber').value.trim();
                if (!idNumber) throw new Error('กรุณากรอกเลขทะเบียน');
                if (!/^\d{10}$/.test(idNumber)) throw new Error('เลขทะเบียนไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');

                // Get form data
                const guardianName = document.querySelector('input[name="guardianName"]').value.trim();
                const relationship = document.querySelector('input[name="relationship"]').value.trim();

                // Validate required fields
                if (!guardianName || !relationship) {
                    throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
                }

                // Get selected permission type and reason if "เนื่องจาก" is selected
                const selectedPermission = document.querySelector('input[name="permissionType"]:checked');
                if (!selectedPermission) throw new Error('กรุณาเลือกประเภทการยินยอม');
                const permissionType = selectedPermission.value;

                // กรณีที่เลือก "เนื่องจาก" จะต้องตรวจสอบว่ามีการกรอกเหตุผลหรือไม่
                if (selectedPermission.id === 'type5') {
                    const otherReason = otherReasonInput.value.trim();
                    if (!otherReason) {
                        throw new Error('กรุณาระบุเหตุผล');
                    }
                }
    
                // Load PDF and font
                const pdfUrl = "../Form/หนังสือยินยอมของผู้ปกครอง.pdf";
                const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
                const fontUrl = "../Form/THSarabunNew Bold.ttf";
                const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());

                const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
                pdfDoc.registerFontkit(window.fontkit);
                const customFont = await pdfDoc.embedFont(fontBytes);

                const pages = pdfDoc.getPages();
                const firstPage = pages[0];

                // Fill PDF with guardian form data
                firstPage.drawText(guardianName, {
                    x: 250,
                    y: 571,
                    size: 18,
                    font: customFont,
                });

                firstPage.drawText(relationship, {
                    x: 180,
                    y: 552,
                    size: 18,
                    font: customFont,
                });

                firstPage.drawText(idNumber, {
                    x: 440,
                    y: 552,
                    size: 18,
                    font: customFont,
                });

                let checkboxX, checkboxY;

                switch (permissionType) {
                    case 'ลาออก':
                        checkboxX = 165;
                        checkboxY = 470;
                        break;
                    case 'ผ่อนผันค่าจดทะเบียน':
                        checkboxX = 165;
                        checkboxY = 450;
                        break;
                    case 'ลาพักการศึกษา':
                        checkboxX = 165;
                        checkboxY = 430;
                        break;
                    case 'ขอคืนสภาพนักศึกษา':
                        checkboxX = 164;
                        checkboxY = 410;
                        break;
                    case 'อื่นๆ':
                        checkboxX = 164;
                        checkboxY = 390;
                        break;
                }

                // วาดเครื่องหมาย X ในช่องที่เลือก
                if (checkboxY) {
                    firstPage.drawText("X", {
                        x: checkboxX,
                        y: checkboxY,
                        size: 35,
                        font: customFont,
                    });
                }

                // วาดข้อความ "เหตุผล" เฉพาะในกรณีที่เลือก "เนื่องจาก"
                if (permissionType === 'อื่นๆ' && otherReasonInput) {
                    const otherReasonText = otherReasonInput.value.trim(); // กำหนดค่า otherReasonText จาก otherReasonInput
                    if (otherReasonText) { // ตรวจสอบว่ามีค่าหรือไม่
                        firstPage.drawText(otherReasonText, {
                            x: 220,
                            y: 356,
                            size: 18,
                            font: customFont,
                        });
                    }
                }
                
                // ดาวน์โหลด PDF ที่กรอกข้อมูลแล้ว
                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `หนังสือยินยอม_${guardianName}.pdf`;
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