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
    const examForm = document.getElementById('examForm');
    const logoutBtn = document.querySelector('.menu-btn.logout');
    const menuBtns = document.querySelectorAll('.menu-btn');
    
    // Form fields
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const firstNameEnInput = document.getElementById('firstNameEn');
    const lastNameEnInput = document.getElementById('lastNameEn');
    const idNumberInput = document.getElementById('idNumber');
    const otherDocInput = document.querySelector('input[name="otherDocument"]');
    
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

    // Handle document type selection
    document.querySelectorAll('input[name="document"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.id === 'doc4') {
                otherDocInput.style.display = 'block';
                otherDocInput.required = true;
            } else {
                otherDocInput.style.display = 'none';
                otherDocInput.required = false;
                otherDocInput.value = '';
            }
        });
    });

    // Add submit event listener to the exam form
    examForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        try {
            toggleLoading(true);

            const firstNameTH = firstNameInput?.value?.trim() || '';
            const lastNameTH = lastNameInput?.value?.trim() || '';
            const idNumber = idNumberInput?.value?.trim() || '';
            const courseInfo = document.querySelector('input[name="courseInfo"]')?.value?.trim() || '';
            const examDateElement = document.querySelector('input[name="examDate"]');
            const examDate = examDateElement && examDateElement.value ? new Date(examDateElement.value) : null;
            const advisor = document.querySelector('input[name="advisor"]')?.value?.trim() || '';
            const reason = document.querySelector('input[name="reason"]')?.value?.trim() || '';
            const conclusion = document.querySelector('input[name="conclusion"]')?.value?.trim() || '';

            const selectedDocumentType = document.querySelector('input[name="document"]:checked');
            let selectedDocumentValue = selectedDocumentType ? selectedDocumentType.value : null;

            if (!selectedDocumentValue) {
                throw new Error('กรุณาเลือกประเภทของเอกสาร');
            }

            const pdfBytes = await fetch("../Form/คำร้อง กรณีขาดสอบ.pdf").then(res => res.arrayBuffer());
            const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
            pdfDoc.registerFontkit(fontkit);

            const fontUrl = "../Form/THSarabunNew Bold.ttf";
            const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());
            const customFont = await pdfDoc.embedFont(fontBytes);
            const page = pdfDoc.getPage(0);

            const fullNameTH = `${firstNameTH} ${lastNameTH}`;
            page.drawText(fullNameTH, { x: 250, y: 698, size: 18, font: customFont });
            page.drawText(idNumber, { x: 475, y: 697, size: 18, font: customFont });

            page.drawText(courseInfo, { x: 290, y: 632, size: 20, font: customFont });
            page.drawText(advisor, { x: 350, y: 610, size: 18, font: customFont });
            page.drawText(reason, { x: 290, y: 589, size: 18, font: customFont });
            page.drawText(conclusion, { x: 190, y: 530, size: 18, font: customFont });

            if (examDate) {
                // แยกส่วนของวัน เดือน ปี
                const day = examDate.getDate();
                const month = examDate.getMonth() + 1;
                const year = examDate.getFullYear();
            
                // วาดวันที่ เดือน และ ปี แยกกันในตำแหน่งที่ต้องการ
                page.drawText(day.toString(), { x: 95, y: 613, size: 18, font: customFont });   // ตำแหน่งสำหรับ "วัน"
                page.drawText(month.toString(), { x: 150, y: 613, size: 18, font: customFont }); // ตำแหน่งสำหรับ "เดือน"
                page.drawText(year.toString(), { x: 250, y: 613, size: 18, font: customFont });  // ตำแหน่งสำหรับ "ปี"
            } else {
                page.drawText('วันที่ไม่ถูกต้อง', { x: 150, y: 613, size: 18, font: customFont });
            }            

            let yPositionCheckbox;
            switch (selectedDocumentValue) {
                case "สำเนาใบเสร็จค่ารักษาพยาบาล":
                    yPositionCheckbox = { x: 160, y: 569 };
                    break;
                case "ใบรับรองแพทย์":
                    yPositionCheckbox = { x: 351, y: 565 };
                    break;
                case "สำเนาใบเสร็จบัตรจดทะเบียน":
                    yPositionCheckbox = { x: 160, y: 550 };
                    break;
                case "อื่นๆ":
                    yPositionCheckbox = { x: 350, y: 545 };
                    const otherDocumentText = otherDocInput.value.trim();
                    page.drawText(otherDocumentText, { x: 375, y: 550, size: 18, font: customFont });
                    break;
            }
            
            // วาดเครื่องหมาย X ที่ตำแหน่งที่กำหนด
            if (yPositionCheckbox) {
                page.drawText("X", { ...yPositionCheckbox, size: 25, font: customFont });
            }            

            const pdfBytesFilled = await pdfDoc.save();
            const blob = new Blob([pdfBytesFilled], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'คำร้อง_กรณีขาดสอบ.pdf';
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

// Initialize form
loadUserData();
});