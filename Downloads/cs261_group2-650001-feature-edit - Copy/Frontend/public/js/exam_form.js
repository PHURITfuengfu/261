import { initializeForm } from './common/formTemplate.js';
import { 
    validateStudentId, 
    showErrorModal,
    setupPDFEnvironment,
    downloadPDF 
} from './common/utils.js';

const examFormConfig = {
    formId: 'examForm',
    
    setupFormHandlers: (form) => {
        const otherDocInput = document.querySelector('input[name="otherDocument"]');
        
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

        // Add date input validation
        const examDateInput = document.querySelector('input[name="examDate"]');
        if (examDateInput) {
            examDateInput.addEventListener('change', function() {
                const selectedDate = new Date(this.value);
                const today = new Date();
                
                if (selectedDate > today) {
                    showErrorModal('วันที่สอบต้องไม่เป็นวันในอนาคต');
                    this.value = '';
                }
            });
        }
    },
    
    handleSubmit: async (event, elements) => {
        try {
            const { idNumberInput, firstNameInput, lastNameInput } = elements;
            
            // Validate student ID
            validateStudentId(idNumberInput.value);

            // Get and validate form data
            const courseInfo = document.querySelector('input[name="courseInfo"]')?.value?.trim();
            const examDateElement = document.querySelector('input[name="examDate"]');
            const examDate = examDateElement?.value ? new Date(examDateElement.value) : null;
            const advisor = document.querySelector('input[name="advisor"]')?.value?.trim();
            const reason = document.querySelector('input[name="reason"]')?.value?.trim();
            const conclusion = document.querySelector('input[name="conclusion"]')?.value?.trim();

            // Validate required fields
            if (!courseInfo || !examDate || !advisor || !reason || !conclusion) {
                throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
            }

            // Get selected document type
            const selectedDocumentType = document.querySelector('input[name="document"]:checked');
            if (!selectedDocumentType) {
                throw new Error('กรุณาเลือกประเภทของเอกสาร');
            }

            const selectedDocumentValue = selectedDocumentType.value;
            let otherDocumentText = '';

            // Get other document text if applicable
            if (selectedDocumentType.id === 'doc4') {
                otherDocumentText = document.querySelector('input[name="otherDocument"]').value.trim();
                if (!otherDocumentText) {
                    throw new Error('กรุณาระบุเอกสารอื่นๆ');
                }
            }

            // Setup PDF environment
            const { pdfDoc, customFont, firstPage } = await setupPDFEnvironment(
                "../Form/คำร้อง กรณีขาดสอบ.pdf",
                "../Form/THSarabunNew Bold.ttf"
            );

            // Fill PDF with student information
            const fullNameTH = `${firstNameInput.value} ${lastNameInput.value}`;
            firstPage.drawText(fullNameTH, {
                x: 250,
                y: 698,
                size: 18,
                font: customFont
            });

            firstPage.drawText(idNumberInput.value, {
                x: 475,
                y: 697,
                size: 18,
                font: customFont
            });

            // Fill course information
            firstPage.drawText(courseInfo, {
                x: 290,
                y: 632,
                size: 20,
                font: customFont
            });

            // Fill advisor name
            firstPage.drawText(advisor, {
                x: 350,
                y: 610,
                size: 18,
                font: customFont
            });

            // Fill reason and conclusion
            firstPage.drawText(reason, {
                x: 290,
                y: 589,
                size: 18,
                font: customFont
            });

            firstPage.drawText(conclusion, {
                x: 190,
                y: 530,
                size: 18,
                font: customFont
            });

            // Fill exam date
            if (examDate) {
                const day = examDate.getDate();
                const month = examDate.getMonth() + 1;
                const year = examDate.getFullYear();
            
                firstPage.drawText(day.toString(), {
                    x: 95,
                    y: 613,
                    size: 18,
                    font: customFont
                });

                firstPage.drawText(month.toString(), {
                    x: 150,
                    y: 613,
                    size: 18,
                    font: customFont
                });

                firstPage.drawText(year.toString(), {
                    x: 250,
                    y: 613,
                    size: 18,
                    font: customFont
                });
            }

            // Draw checkbox mark for document type
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
                    // Add other document text
                    firstPage.drawText(otherDocumentText, {
                        x: 375,
                        y: 550,
                        size: 18,
                        font: customFont
                    });
                    break;
            }
            
            // Draw checkbox mark
            if (yPositionCheckbox) {
                firstPage.drawText("X", {
                    ...yPositionCheckbox,
                    size: 25,
                    font: customFont
                });
            }

            // Download the filled PDF
            await downloadPDF(pdfDoc, `คำร้อง_กรณีขาดสอบ_${idNumberInput.value}.pdf`);

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
initializeForm(examFormConfig);