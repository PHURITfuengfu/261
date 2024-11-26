import { BasePage } from './common/page.js';
import { studentApi } from './API.js';

class StudentDataPage extends BasePage {
    constructor() {
        super();
        this.originalData = null;
        this.setupEditingControls();
    }

    setupEditingControls() {
        // Create action buttons container if not exists
        let actionButtons = document.querySelector('.action-buttons');
        if (!actionButtons) {
            actionButtons = document.createElement('div');
            actionButtons.className = 'action-buttons';
            document.querySelector('.content-header').appendChild(actionButtons);
        }

        // Create buttons
        const editButton = this.createButton('editButton', 'แก้ไขข้อมูล', 'fas fa-edit', 'btn primary');
        const saveButton = this.createButton('saveButton', 'บันทึก', 'fas fa-save', 'btn success', true);
        const cancelButton = this.createButton('cancelButton', 'ยกเลิก', 'fas fa-times', 'btn secondary', true);

        // Add buttons to container
        actionButtons.append(editButton, saveButton, cancelButton);

        // Add event listeners
        editButton.addEventListener('click', () => this.startEditing());
        saveButton.addEventListener('click', () => this.saveChanges());
        cancelButton.addEventListener('click', () => this.cancelEditing());
    }

    createButton(id, text, iconClass, className, hidden = false) {
        const button = document.createElement('button');
        button.id = id;
        button.className = className;
        button.innerHTML = `<i class="${iconClass}"></i> ${text}`;
        if (hidden) button.style.display = 'none';
        return button;
    }

    startEditing() {
        // Store original data
        this.originalData = this.getFormData();
        console.log('Original data stored:', this.originalData);

        // Enable editable fields
        const editableFields = [
            'firstName', 'lastName',
            'firstNameEn', 'lastNameEn',
            'email', 'phone', 'address'
        ];

        editableFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.disabled = false;
                field.classList.add('editable');
            }
        });

        // Toggle buttons
        this.toggleEditButtons(false);
    }

    async saveChanges() {
        try {
            this.toggleLoading(true);
            const newData = this.getFormData();
            console.log('Saving new data:', newData);

            const userData = await this.loadUserData();
            if (!userData?.username) {
                throw new Error('ไม่พบข้อมูลผู้ใช้');
            }

            // Prepare update data
            const updateData = {
                username: userData.username,
                type: 'student',
                displayname_th: `${newData.firstName} ${newData.lastName}`,
                displayname_en: `${newData.firstNameEn} ${newData.lastNameEn}`,
                email: newData.email,
                faculty: newData.faculty,
                department: newData.department,
                student_info: {
                    advisorName: newData.advisor,
                    gpax: newData.gpax,
                    phone: newData.phone,
                    address: newData.address,
                    major: newData.major
                }
            };

            // Send update request
            const response = await studentApi.updateStudent(userData.username, updateData);

            if (response.status === 'success') {
                this.showSuccessMessage('บันทึกข้อมูลสำเร็จ');
                this.endEditing();
                await this.initializePage(); // Refresh the page data
            } else {
                throw new Error(response.message || 'ไม่สามารถบันทึกข้อมูลได้');
            }
        } catch (error) {
            console.error('Error saving changes:', error);
            this.showErrorModal('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            this.toggleLoading(false);
        }
    }

    cancelEditing() {
        // Restore original data
        if (this.originalData) {
            Object.entries(this.originalData).forEach(([id, value]) => {
                this.populateFormField(id, value);
            });
        }
        this.endEditing();
    }

    endEditing() {
        // Disable all fields
        document.querySelectorAll('input, select, textarea').forEach(field => {
            field.disabled = true;
            field.classList.remove('editable');
        });

        // Toggle buttons
        this.toggleEditButtons(true);
    }

    toggleEditButtons(showEdit) {
        document.getElementById('editButton').style.display = showEdit ? 'inline-flex' : 'none';
        document.getElementById('saveButton').style.display = showEdit ? 'none' : 'inline-flex';
        document.getElementById('cancelButton').style.display = showEdit ? 'none' : 'inline-flex';
    }

    getFormData() {
        return {
            firstName: document.getElementById('firstName')?.value || '',
            lastName: document.getElementById('lastName')?.value || '',
            firstNameEn: document.getElementById('firstNameEn')?.value || '',
            lastNameEn: document.getElementById('lastNameEn')?.value || '',
            faculty: document.getElementById('faculty')?.value || '',
            department: document.getElementById('department')?.value || '',
            major: document.getElementById('major')?.value || '',
            advisor: document.getElementById('advisor')?.value || '',
            gpax: document.getElementById('gpax')?.value || '',
            email: document.getElementById('email')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            address: document.getElementById('address')?.value || ''
        };
    }

    populateFormField(id, value) {
        const element = document.getElementById(id);
        if (element) {
            if (element.tagName === 'SELECT') {
                const options = Array.from(element.options);
                const matchingOption = options.find(option => 
                    option.value === value || 
                    option.textContent === value
                );
                if (matchingOption) {
                    element.value = matchingOption.value;
                }
            } else {
                element.value = value || '';
            }
        }
    }

    showSuccessMessage(message) {
        const successModal = document.getElementById('successModal');
        const successMessage = document.getElementById('successMessage');
        if (successModal && successMessage) {
            successMessage.textContent = message;
            successModal.style.display = 'block';
        }
    }

    async initializePage() {
        try {
            this.toggleLoading(true);

            const userData = await this.loadUserData();
            if (!userData) return;

            console.log('Loading user data:', userData);

            // Try to get student data from backend
            try {
                const response = await studentApi.getStudentByUsername(userData.username);
                if (response.status === 'success' && response.data) {
                    const studentData = response.data;

                    // Parse Thai name
                    const thaiNameParts = studentData.displayNameTh?.split(' ') || [];
                    this.populateFormField('firstName', thaiNameParts[0] || '');
                    this.populateFormField('lastName', thaiNameParts[1] || '');

                    // Parse English name
                    const engNameParts = studentData.displayNameEn?.split(' ') || [];
                    this.populateFormField('firstNameEn', engNameParts[0] || '');
                    this.populateFormField('lastNameEn', engNameParts[1] || '');

                    // Populate other fields
                    this.populateFormField('id-number', studentData.username);
                    this.populateFormField('faculty', studentData.faculty);
                    this.populateFormField('department', studentData.department);
                    this.populateFormField('major', studentData.department);
                    this.populateFormField('status', studentData.tuStatus);
                    this.populateFormField('email', studentData.email);

                    // Populate additional info if exists
                    if (studentData.studentInfo) {
                        const info = typeof studentData.studentInfo === 'string' 
                            ? JSON.parse(studentData.studentInfo) 
                            : studentData.studentInfo;

                        this.populateFormField('advisor', info.advisorName);
                        this.populateFormField('gpax', info.gpax);
                        this.populateFormField('phone', info.phone);
                        this.populateFormField('address', info.address);
                    }
                }
            } catch (error) {
                console.error('Error fetching student data:', error);
                // Fallback to session data
                this.populateFromSessionData(userData);
            }

            this.endEditing();
        } catch (error) {
            console.error('Error initializing page:', error);
            this.showErrorModal('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            this.toggleLoading(false);
        }
    }

    populateFromSessionData(userData) {
        // Populate from session data as fallback
        const thaiNameParts = userData.displayNameTH?.split(' ') || [];
        this.populateFormField('firstName', thaiNameParts[0] || '');
        this.populateFormField('lastName', thaiNameParts[1] || '');

        const engNameParts = userData.displayNameEN?.split(' ') || [];
        this.populateFormField('firstNameEn', engNameParts[0] || '');
        this.populateFormField('lastNameEn', engNameParts[1] || '');

        this.populateFormField('id-number', userData.username);
        this.populateFormField('faculty', userData.faculty);
        this.populateFormField('department', userData.department);
        this.populateFormField('major', userData.department);
        this.populateFormField('email', userData.email);
    }
}

// Initialize page
new StudentDataPage();