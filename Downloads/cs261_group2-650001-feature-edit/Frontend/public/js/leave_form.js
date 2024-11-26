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
                    throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
                }
            }

            // Validate phone number
            if (!validatePhoneNumber(formData.phoneNumber)) {
                throw new Error('หมายเลขโทรศัพท์ไม่ถูกต้อง');
            }

            // Get registration type and details
            const selectedRegistrationType = document.querySelector('input[name="registrationType"]:checked');
            if (!selectedRegistrationType) {
                throw new Error('กรุณาเลือกลักษณะการจดทะเบียน');
            }

            let registrationData = {
                type: selectedRegistrationType.value
            };

            if (selectedRegistrationType.id === 'type2') {
                const registeredSemester = document.querySelector('input[name="registeredSemester"]').value.trim();
                const courseCode = document.querySelector('input[name="courseCode"]').value.trim();

                if (!registeredSemester || !courseCode) {
                    throw new Error('กรุณากรอกข้อมูลภาคและรหัสวิชาที่จดทะเบียน');
                }

                registrationData.semester = registeredSemester;
                registrationData.courseCode = courseCode;
            }

            // Setup PDF environment
            const { pdfDoc, customFont, firstPage } = await setupPDFEnvironment(
                "../Form/คำร้องขอลาพักการศึกษา.pdf",
                "../Form/THSarabunNew Bold.ttf"
            );

            // Fill PDF with form data
            // Student information
            firstPage.drawText(`${firstNameInput.value} ${lastNameInput.value}`, {
                x: 155,
                y: 618,
                size: 18,
                font: customFont
            });

            firstPage.drawText(idNumberInput.value, {
                x: 445,
                y: 618,
                size: 18,
                font: customFont
            });

            // Leave details
            firstPage.drawText(formData.semester, {
                x: 275,
                y: 675,
                size: 25,
                font: customFont
            });

            firstPage.drawText(formData.totalSemesters, {
                x: 445,
                y: 675,
                size: 25,
                font: customFont
            });

            // Address and contact info
            firstPage.drawText(formData.contactAddress, {
                x: 200,
                y: 550,
                size: 18,
                font: customFont
            });

            firstPage.drawText(formData.phoneNumber, {
                x: 450,
                y: 550,
                size: 18,
                font: customFont
            });

            // Leave reason
            firstPage.drawText(formData.leaveReason, {
                x: 200,
                y: 500,
                size: 18,
                font: customFont
            });

            // Registration details if type2
            if (registrationData.type === 'type2') {
                firstPage.drawText(registrationData.semester, {
                    x: 200,
                    y: 450,
                    size: 18,
                    font: customFont
                });

                firstPage.drawText(registrationData.courseCode, {
                    x: 400,
                    y: 450,
                    size: 18,
                    font: customFont
                });
            }

            // Download the filled PDF
            await downloadPDF(pdfDoc, `คำร้องขอลาพักการศึกษา_${idNumberInput.value}.pdf`);

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
initializeForm(leaveFormConfig);