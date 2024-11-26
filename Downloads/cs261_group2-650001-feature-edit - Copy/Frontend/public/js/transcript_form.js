import { initializeForm } from './common/formTemplate.js';
import { 
    validateStudentId, 
    showErrorModal,
    setupPDFEnvironment,
    downloadPDF 
} from './common/utils.js';

const transcriptFormConfig = {
    formId: 'transcriptForm',
    
    setupFormHandlers: (form) => {
        const semesterInput = document.querySelector('input[name="semester"]');
        const academicYearInput = document.querySelector('input[name="academicYear"]');

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

        // Add semester validation
        if (semesterInput) {
            semesterInput.addEventListener('input', function() {
                const value = this.value.trim();
                if (value && !/^[1-2]$/.test(value)) {
                    showErrorModal('ภาคการศึกษาต้องเป็น 1 หรือ 2 เท่านั้น');
                    this.value = '';
                }
            });
        }

        // Add academic year validation
        if (academicYearInput) {
            academicYearInput.addEventListener('input', function() {
                const value = parseInt(this.value);
                const currentYear = new Date().getFullYear() + 543; // Convert to Buddhist Era
                
                if (value) {
                    if (value < currentYear - 10 || value > currentYear + 5) {
                        showErrorModal('ปีการศึกษาไม่ถูกต้อง');
                        this.value = '';
                    }
                }
            });
        }
    },
    
    handleSubmit: async (event, elements) => {
        try {
            const { idNumberInput, firstNameInput, lastNameInput } = elements;
            
            // Validate student ID
            validateStudentId(idNumberInput.value);

            // Get and validate semester and academic year
            const semester = document.querySelector('input[name="semester"]')?.value?.trim();
            const academicYear = document.querySelector('input[name="academicYear"]')?.value?.trim();

            if (!semester || !academicYear) {
                throw new Error('กรุณากรอกภาคการศึกษาและปีการศึกษา');
            }

            // Validate semester and year format
            if (!/^[1-2]$/.test(semester)) {
                throw new Error('ภาคการศึกษาต้องเป็น 1 หรือ 2 เท่านั้น');
            }

            const currentYear = new Date().getFullYear() + 543; // Convert to Buddhist Era
            const inputYear = parseInt(academicYear);
            if (isNaN(inputYear) || inputYear < currentYear - 10 || inputYear > currentYear + 5) {
                throw new Error('ปีการศึกษาไม่ถูกต้อง');
            }

            // Get selected major type and its detail
            const selectedMajorType = document.querySelector('input[name="majorType"]:checked');
            if (!selectedMajorType) {
                throw new Error('กรุณาเลือกประเภทสาขาวิชา');
            }

            // Get major detail
            let majorType = selectedMajorType.value;
            let majorDetailInput = document.querySelector(`input[name="${selectedMajorType.id}Detail"]`);
            let majorDetail = majorDetailInput ? majorDetailInput.value.trim() : '';

            if (!majorDetail) {
                throw new Error('กรุณากรอกรายละเอียดสาขาวิชา');
            }

            // Setup PDF environment
            const { pdfDoc, customFont, firstPage } = await setupPDFEnvironment(
                "../Form/ใบกระจายโครงสร้างหลักสูตร 2561.pdf",
                "../Form/THSarabunNew Bold.ttf"
            );

            // Fill student information
            const thaiFullName = `${firstNameInput.value} ${lastNameInput.value}`;
            
            // Student ID
            firstPage.drawText(idNumberInput.value, {
                x: 445,
                y: 618,
                size: 18,
                font: customFont
            });

            // Student name
            firstPage.drawText(thaiFullName, {
                x: 155,
                y: 618,
                size: 18,
                font: customFont
            });

            // Expected graduation semester
            firstPage.drawText(semester, {
                x: 275,
                y: 675,
                size: 25,
                font: customFont
            });

            // Expected graduation year
            firstPage.drawText(academicYear, {
                x: 445,
                y: 675,
                size: 25,
                font: customFont
            });

            // Draw major type checkbox and details
            let checkboxYPosition;
            switch (majorType) {
                case 'สาขาวิชาเอก':
                    checkboxYPosition = 560;
                    break;
                case 'สาขาวิชาโท':
                    checkboxYPosition = 541;
                    break;
                case 'เลือกเสรี':
                    checkboxYPosition = 505;
                    break;
            }

            if (checkboxYPosition) {
                // Draw checkbox mark
                firstPage.drawText("X", {
                    x: 108,
                    y: checkboxYPosition,
                    size: 30,
                    font: customFont
                });

                // Draw major detail
                firstPage.drawText(majorDetail, {
                    x: 190,
                    y: checkboxYPosition + 5,
                    size: 18,
                    font: customFont
                });
            }

            // Download the filled PDF
            await downloadPDF(pdfDoc, `ใบกระจายโครงสร้างหลักสูตร_${idNumberInput.value}.pdf`);

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
initializeForm(transcriptFormConfig);