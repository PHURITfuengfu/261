// common/utils.js
export function toggleLoading(loadingOverlay, show) {
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

export function showErrorModal(message) {
    const modal = document.getElementById('errorModal');
    const modalMessage = document.getElementById('modalMessage');
    if (modal && modalMessage) {
        modalMessage.textContent = message;
        modal.style.display = 'flex';
    }
}

export function setupModalListeners() {
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
}

export function setupMenuNavigation(menuBtns, logoutBtn, handleLogout) {
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
                case 'ดูประวัติคำร้อง':
                    window.location.href = '../check_History.html';
                    break;
            }
        });
    });
}

export async function loadAndPopulateUserData(userData, elements) {
    const { studentName, studentId, firstNameInput, lastNameInput, 
            firstNameEnInput, lastNameEnInput, idNumberInput } = elements;

    if (!userData) {
        throw new Error('ไม่พบข้อมูลผู้ใช้');
    }

    if (studentName) studentName.textContent = `${userData.displayNameTH || 'ไม่พบข้อมูล'}`;
    if (studentId) studentId.textContent = userData.username || 'ไม่พบข้อมูล';

    let thNames = userData.displayNameTH ? userData.displayNameTH.split(' ') : ['', ''];
    let enNames = userData.displayNameEN ? userData.displayNameEN.split(' ') : ['', ''];

    if (firstNameInput) firstNameInput.value = thNames[0] || '';
    if (lastNameInput) lastNameInput.value = thNames[1] || '';
    if (firstNameEnInput) firstNameEnInput.value = enNames[0] || '';
    if (lastNameEnInput) lastNameEnInput.value = enNames[1] || '';
    
    if (idNumberInput) {
        idNumberInput.value = userData.username || 'ไม่พบข้อมูล';
        idNumberInput.setAttribute('disabled', true);
    }
}

export async function setupPDFEnvironment(pdfPath, fontPath) {
    const pdfBytes = await fetch(pdfPath).then(res => res.arrayBuffer());
    const fontBytes = await fetch(fontPath).then(res => res.arrayBuffer());

    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
    pdfDoc.registerFontkit(window.fontkit);
    const customFont = await pdfDoc.embedFont(fontBytes);

    return {
        pdfDoc,
        customFont,
        firstPage: pdfDoc.getPages()[0]
    };
}

export async function downloadPDF(pdfDoc, filename) {
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

export function validateStudentId(idNumber) {
    if (!idNumber) {
        throw new Error('กรุณากรอกเลขทะเบียน');
    }
    if (!/^\d{10}$/.test(idNumber)) {
        throw new Error('เลขทะเบียนไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
    }
    return true;
}

export function validatePhoneNumber(phone) {
    return /^[0-9]{9,10}$/.test(phone.replace(/[- ]/g, ''));
}