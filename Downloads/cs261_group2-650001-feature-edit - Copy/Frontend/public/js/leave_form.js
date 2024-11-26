import { initializeForm } from './common/formTemplate.js';
import { 
    validateStudentId, 
    validatePhoneNumber, 
    showErrorModal,
    setupPDFEnvironment,
    downloadPDF 
} from './common/utils.js';

const leaveFormConfig = {
    formId: 'leaveForm',
    
    setupFormHandlers: (form) => {
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
    },
    
    handleSubmit: async (event, elements) => {
        try {
            const { idNumberInput, firstNameInput, lastNameInput } = elements;
            
            // Validate student ID
            validateStudentId(idNumberInput.value);

            // Get and validate form fields
            const formData = {
                leaveReason: document.querySelector('input[name="leaveReason"]').value.trim(),
                semester: document.querySelector('input[name="semester"]').value.trim(),
                totalSemesters: document.querySelector('input[name="totalSemesters"]').value.trim(),
                contactAddress: document.querySelector('input[name="contactAddress"]').value.trim(),
                phoneNumber: document.querySelector('input[name="phoneNumber"]').value.trim()
            };

            // Validate required fields
            for (const [key, value] of Object.entries(formData)) {
                if (!value) {
                    showErrorModal('กรุณากรอกข้อมูลให้ครบถ้วน');
                    return;
                }
            }

            // Validate phone number
            if (!validatePhoneNumber(formData.phoneNumber)) {
                showErrorModal('หมายเลขโทรศัพท์ไม่ถูกต้อง');
                return;
            }

            // Get registration type and details
            const selectedRegistrationType = document.querySelector('input[name="registrationType"]:checked');
            if (!selectedRegistrationType) {
                showErrorModal('กรุณาเลือกลักษณะการจดทะเบียน');
                return;
            }

            let registrationData = {
                type: selectedRegistrationType.value
            };

            if (selectedRegistrationType.id === 'type2') {
                const registeredSemester = document.querySelector('input[name="registeredSemester"]').value.trim();
                const courseCode = document.querySelector('input[name="courseCode"]').value.trim();

                if (!registeredSemester || !courseCode) {
                    showErrorModal('กรุณากรอกข้อมูลภาคและรหัสวิชาที่จดทะเบียน');
                    return;
                }

                registrationData.semester = registeredSemester;
                registrationData.courseCode = courseCode;
            }

            // Prepare data for PDF generation
            const pdfData = {
                idNumber: idNumberInput.value,
                firstName: firstNameInput.value.trim(),
                lastName: lastNameInput.value.trim(),
                leaveReason: formData.leaveReason,
                semester: formData.semester,
                totalSemesters: formData.totalSemesters,
                contactAddress: formData.contactAddress,
                phoneNumber: formData.phoneNumber,
                registrationType: registrationData.type,
                registeredSemester: registrationData.semester || '',
                courseCode: registrationData.courseCode || ''
            };

            // Generate PDF with the given data
            await generatePDF(pdfData);

            // Show success message
            showErrorModal('ส่งคำร้องเรียบร้อยแล้ว', 'success');

            // Optional: Redirect after success (if needed)
            // setTimeout(() => {
            //     window.location.href = '../check_status.html';
            // }, 2000);

        } catch (error) {
            console.error('Form submission error:', error);
            showErrorModal(error.message || 'เกิดข้อผิดพลาด');
        }
    }
};

// Function to generate the PDF
async function generatePDF(data) {
    try {
        const pdfBytes = await fetch("../Form/คำร้อง_ขอลาพักการศึกษา(แก้).pdf").then(res => res.arrayBuffer());
        const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
        pdfDoc.registerFontkit(window.fontkit);

        // Embed Thai font
        const fontUrl = "../Form/THSarabunNew Bold.ttf";
        const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());
        const customFont = await pdfDoc.embedFont(fontBytes);

        // Use first page from the existing template PDF
        const page = pdfDoc.getPage(0);

        // Check page orientation and adjust if needed
        const { width, height } = page.getSize();
        if (width > height) {
            page.setRotation(0); // Remove rotation
            page.setSize(height, width); // Set to portrait orientation
        }

        // Draw general information
        page.drawText(data.firstName + ' ' + data.lastName, { x: 153, y: 675, size: 18, font: customFont });
        page.drawText(data.leaveReason, { x: 250, y: 630, size: 18, font: customFont });
        page.drawText(data.semester, { x: 310, y: 585, size: 18, font: customFont });
        page.drawText(data.totalSemesters, { x: 400, y: 585, size: 18, font: customFont });
        page.drawText(data.contactAddress, { x: 300, y: 498, size: 18, font: customFont });
        page.drawText(data.phoneNumber, { x: 470, y: 476, size: 18, font: customFont });

        // Split student ID into individual digits
        const idNumber = data.idNumber.split('');
        let startX = 400;
        const y = 675;
        const spaceBetween = 18;
        idNumber.forEach((digit, index) => {
            page.drawText(digit, { x: startX + (index * spaceBetween), y: y, size: 18, font: customFont });
        });

        // Draw "X" for selected registration type
        if (data.registrationType === 'ไม่ได้จดทะเบียนเป็นลักษณะวิชาภาค') {
            page.drawText('X', { x: 65, y: 560, size: 40, font: customFont });
        } else if (data.registrationType === 'ได้จดทะเบียนเป็นลักษณะวิชาภาค') {
            page.drawText('X', { x: 65, y: 532, size: 40, font: customFont });

            if (data.registeredSemester) {
                page.drawText(data.registeredSemester, { x: 280, y: 541, size: 18, font: customFont });
            }
            if (data.courseCode) {
                page.drawText(data.courseCode, { x: 280, y: 519, size: 18, font: customFont });
            }
        }

        // Download the filled PDF
        await downloadPDF(pdfDoc, `คำร้องขอลาพักการศึกษา_${data.idNumber}.pdf`);

    } catch (error) {
        console.error('Error generating PDF:', error);
        showErrorModal('ไม่สามารถสร้าง PDF ได้');
        throw error; // Rethrow to handle it in form submission
    }

    setTimeout(() => {
        window.location.href = '../check_status.html';
    }, 2000);
}

// Initialize the form
initializeForm(leaveFormConfig);
