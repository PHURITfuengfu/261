import { initializeForm } from './common/formTemplate.js';
import { 
    validateStudentId, 
    showErrorModal,
    setupPDFEnvironment,
    downloadPDF 
} from './common/utils.js';

const guardianFormConfig = {
    formId: 'guardianForm',
    
    setupFormHandlers: (form) => {
        // Handle permission type selection
        const otherReasonInput = document.querySelector('.reason-input');
        
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
    },
    
    handleSubmit: async (event, elements) => {
        try {
            const { idNumberInput } = elements;
            
            // Validate student ID
            validateStudentId(idNumberInput.value);

            // Get form data
            const guardianName = document.querySelector('input[name="guardianName"]').value.trim();
            const relationship = document.querySelector('input[name="relationship"]').value.trim();

            // Validate required fields
            if (!guardianName || !relationship) {
                throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
            }

            // Get selected permission type and reason
            const selectedPermission = document.querySelector('input[name="permissionType"]:checked');
            if (!selectedPermission) {
                throw new Error('กรุณาเลือกประเภทการยินยอม');
            }

            const permissionType = selectedPermission.value;
            let otherReason = '';

            // Check if "other" is selected and validate reason
            if (selectedPermission.id === 'type5') {
                const otherReasonInput = document.querySelector('.reason-input');
                otherReason = otherReasonInput.value.trim();
                if (!otherReason) {
                    throw new Error('กรุณาระบุเหตุผล');
                }
            }

            // Setup PDF environment
            const { pdfDoc, customFont, firstPage } = await setupPDFEnvironment(
                "../Form/หนังสือยินยอมของผู้ปกครอง.pdf",
                "../Form/THSarabunNew Bold.ttf"
            );

            // Fill PDF with guardian form data
            // Guardian name
            firstPage.drawText(guardianName, {
                x: 250,
                y: 571,
                size: 18,
                font: customFont
            });

            // Relationship
            firstPage.drawText(relationship, {
                x: 180,
                y: 553,
                size: 18,
                font: customFont
            });

            // Student ID
            firstPage.drawText(idNumberInput.value, {
                x: 440,
                y: 551,
                size: 18,
                font: customFont
            });

            // Draw checkbox mark based on permission type
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

            // Draw checkbox mark
            if (checkboxX && checkboxY) {
                firstPage.drawText("X", {
                    x: checkboxX,
                    y: checkboxY,
                    size: 35,
                    font: customFont
                });
            }

            // Add other reason text if applicable
            if (permissionType === 'อื่นๆ' && otherReason) {
                firstPage.drawText(otherReason, {
                    x: 220,
                    y: 356,
                    size: 18,
                    font: customFont
                });
            }

            // Add current date
            const currentDate = new Date();
            const formattedDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear() + 543}`;
            firstPage.drawText(formattedDate, {
                x: 400,
                y: 290,
                size: 18,
                font: customFont
            });

            // Download the filled PDF
            await downloadPDF(pdfDoc, `หนังสือยินยอมผู้ปกครอง_${idNumberInput.value}.pdf`);

            // Show success message
            showErrorModal('ส่งคำร้องเรียบร้อยแล้ว');

            // Redirect after success
            setTimeout(() => {
                window.location.href = '../check_status.html';
            }, 2000);

        } catch (error) {
            console.error('Form submission error:', error);
            throw error; // Re-throw to be handled by the form template
        }
    }
};

// Initialize the form
initializeForm(guardianFormConfig);