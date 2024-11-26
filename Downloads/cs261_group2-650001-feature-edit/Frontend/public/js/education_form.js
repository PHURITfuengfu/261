import { initializeForm } from './common/formTemplate.js';
import { 
    validateStudentId, 
    showErrorModal,
    setupPDFEnvironment,
    downloadPDF 
} from './common/utils.js';

const educationFormConfig = {
    formId: 'educationForm',
    
    setupFormHandlers: (form) => {
        // Handle radio button changes for petition types
        const radioOptions = document.querySelectorAll('input[name="petitionType"]');
        
        radioOptions.forEach(radio => {
            radio.addEventListener('change', function() {
                // Hide all sub-fields first
                document.querySelectorAll('.sub-fields').forEach(field => {
                    field.style.display = 'none';
                    
                    // Reset and disable all inputs within sub-fields
                    field.querySelectorAll('input').forEach(input => {
                        input.value = '';
                        input.required = false;
                    });
                });
                
                // Hide all sub-options first
                document.querySelectorAll('.sub-options').forEach(option => {
                    option.style.display = 'none';
                    
                    // Reset and disable all radio buttons within sub-options
                    option.querySelectorAll('input[type="radio"]').forEach(input => {
                        input.checked = false;
                        input.required = false;
                    });
                });

                // Show relevant fields based on selection
                if (this.checked) {
                    const parentLabel = this.parentElement;
                    const subFields = parentLabel.querySelector('.sub-fields');
                    const subOptions = parentLabel.querySelector('.sub-options');
                    
                    if (subFields) {
                        subFields.style.display = 'grid';
                        // Enable inputs within shown sub-fields
                        subFields.querySelectorAll('input').forEach(input => {
                            input.required = true;
                        });
                    }
                    
                    if (subOptions) {
                        subOptions.style.display = 'block';
                        // Make radio buttons required in shown sub-options
                        subOptions.querySelectorAll('input[type="radio"]').forEach(input => {
                            input.required = true;
                        });
                    }
                }
            });
        });

        // Add course code validation if needed
        const courseCodeInputs = document.querySelectorAll('.course-code');
        courseCodeInputs.forEach(input => {
            input.addEventListener('input', function() {
                this.value = this.value.toUpperCase();
                // Add any specific course code format validation if needed
            });
        });
    },
    
    handleSubmit: async (event, elements) => {
        try {
            const { idNumberInput, firstNameInput, lastNameInput } = elements;
            
            // Validate student ID
            validateStudentId(idNumberInput.value);

            // Get and validate subject
            const subject = document.querySelector('input[name="subject"]').value.trim();
            if (!subject) {
                throw new Error('กรุณากรอกเรื่องที่ต้องการยื่นคำร้อง');
            }

            // Get selected petition type
            const selectedTypeRadio = document.querySelector('input[name="petitionType"]:checked');
            if (!selectedTypeRadio) {
                throw new Error('กรุณาเลือกประเภทคำร้อง');
            }

            const petitionType = selectedTypeRadio.value;

            // Setup PDF environment
            const { pdfDoc, customFont, firstPage } = await setupPDFEnvironment(
                "../Form/ฟอร์ม_คำร้องนักศึกษาภาคพิเศษ.pdf",
                "../Form/THSarabunNew Bold.ttf"
            );

            // Fill student information
            firstPage.drawText(`${firstNameInput.value} ${lastNameInput.value}`, {
                x: 200,
                y: 710,
                size: 18,
                font: customFont
            });

            firstPage.drawText(idNumberInput.value, {
                x: 408,
                y: 710,
                size: 18,
                font: customFont
            });

            // Fill subject
            firstPage.drawText(subject, {
                x: 100,
                y: 753,
                size: 18,
                font: customFont
            });

            // Get course code if applicable
            let courseCode = '';
            const courseCodeField = selectedTypeRadio.closest('.radio-option').querySelector('.course-code');
            if (courseCodeField) {
                courseCode = courseCodeField.value.trim();
            }

            // Get withdrawal type if applicable
            const withdrawalType = document.querySelector('input[name="withdrawalType"]:checked')?.value;

            // Determine position for checkboxes and course code text
            let yPositionCheckbox = null;
            let textPositionX = 135;

            // Set checkbox position based on petition type
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
                        firstPage.drawText('X', {
                            x: 98,
                            y: 476,
                            size: 35,
                            font: customFont
                        });
                    }
                    break;
                case 'อื่นๆ (โปรดระบุ)':
                    yPositionCheckbox = 410;
                    break;
            }

            // Draw checkbox mark
            if (typeof yPositionCheckbox === 'number') {
                firstPage.drawText('X', {
                    x: 76,
                    y: yPositionCheckbox,
                    size: 35,
                    font: customFont
                });
            }

            // Add course code if applicable
            if (courseCode) {
                firstPage.drawText(courseCode, {
                    x: textPositionX,
                    y: yPositionCheckbox - 9,
                    size: 18,
                    font: customFont
                });
            }

            // Add current date
            const currentDate = new Date();
            const formattedDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear() + 543}`;
            firstPage.drawText(formattedDate, {
                x: 400,
                y: 200,
                size: 18,
                font: customFont
            });

            // Download the filled PDF
            await downloadPDF(pdfDoc, `ฟอร์ม_คำร้องนักศึกษาภาคพิเศษ_${idNumberInput.value}.pdf`);

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
initializeForm(educationFormConfig);