// Import API functions
import { authenticateWithTUAPI } from './API.js';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const usernameInput = document.getElementById('username');
    const roleSelect = document.getElementById('role');
    const loginButton = document.querySelector('.login-btn');
    const buttonText = loginButton.querySelector('.btn-text');
    const spinner = loginButton.querySelector('.spinner');
    const rememberCheckbox = document.getElementById('remember');
    const capslockWarning = document.getElementById('capslockWarning');

    // Error messages in Thai
    const errorMessages = {
        username: {
            required: 'กรุณากรอกชื่อผู้ใช้',
            length: 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 4 ตัวอักษร'
        },
        password: {
            required: 'กรุณากรอกรหัสผ่าน',
            length: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร',
            invalid: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
        },
        role: {
            required: 'กรุณาเลือกสถานะผู้ใช้งาน'
        },
        system: {
            error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
        }
    };

    // Function to check Caps Lock
    function checkCapsLock(event) {
        if (event.getModifierState('CapsLock')) {
            capslockWarning.classList.add('show');
        } else {
            capslockWarning.classList.remove('show');
        }
    }

    // Add event listeners for Caps Lock detection
    passwordInput.addEventListener('keydown', checkCapsLock);
    passwordInput.addEventListener('keyup', checkCapsLock);
    passwordInput.addEventListener('mousedown', checkCapsLock);
    
    // Check Caps Lock when input gets focus
    passwordInput.addEventListener('focus', function(e) {
        checkCapsLock(e);
    });

    // Hide warning when input loses focus
    passwordInput.addEventListener('blur', function() {
        capslockWarning.classList.remove('show');
    });

    // Also check Caps Lock when window gets focus
    window.addEventListener('keydown', function(e) {
        if (document.activeElement === passwordInput) {
            checkCapsLock(e);
        }
    });

    // Load saved credentials if they exist
    const savedCredentials = localStorage.getItem('savedCredentials');
    if (savedCredentials) {
        const credentials = JSON.parse(savedCredentials);
        usernameInput.value = credentials.username || '';
        roleSelect.value = credentials.role || '';
        rememberCheckbox.checked = true;
        validateFields(); // Re-validate fields after loading saved data
    }

    // Function to show/hide loading state
    function setLoadingState(isLoading) {
        loginButton.disabled = isLoading;
        if (isLoading) {
            spinner.style.display = 'block';
            buttonText.textContent = 'กำลังเข้าสู่ระบบ...';
        } else {
            spinner.style.display = 'none';
            buttonText.textContent = 'เข้าสู่ระบบ';
        }
    }

    // Function to show error message
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    // Function to clear all error messages
    function clearErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => element.style.display = 'none');
    }

    // Function to validate fields
    function validateFields() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const role = roleSelect.value;

        const isValid = username !== '' && password !== '' && role !== '';
        loginButton.disabled = !isValid;

        return isValid;
    }

    // Add input event listeners to all fields
    usernameInput.addEventListener('input', validateFields);
    passwordInput.addEventListener('input', validateFields);
    roleSelect.addEventListener('change', validateFields);

    // Initial validation check
    validateFields();

    // Toggle password visibility
    togglePassword.addEventListener('click', function() {
        const img = this.querySelector('img');
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            img.src = 'img/eye-open.png';
            img.alt = 'ซ่อนรหัสผ่าน';
        } else {
            passwordInput.type = 'password';
            img.src = 'img/eye-closed.png';
            img.alt = 'แสดงรหัสผ่าน';
        }
    });

    // Handle form submission
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        clearErrors();

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const role = roleSelect.value;

        let isValid = true;

        // Username validation
        if (!username) {
            showError('usernameError', errorMessages.username.required);
            isValid = false;
        } else if (username.length < 4) {
            showError('usernameError', errorMessages.username.length);
            isValid = false;
        }

        // Password validation
        if (!password) {
            showError('passwordError', errorMessages.password.required);
            isValid = false;
        } else if (password.length < 6) {
            showError('passwordError', errorMessages.password.length);
            isValid = false;
        }

        // Role validation
        if (!role) {
            showError('roleError', errorMessages.role.required);
            isValid = false;
        }

        if (isValid) {
            try {
                setLoadingState(true);
                const response = await authenticateWithTUAPI(username, password);

                if (response.status) {
                    // Handle "Remember me" functionality
                    if (rememberCheckbox.checked) {
                        const credentials = {
                            username: username,
                            role: role
                        };
                        localStorage.setItem('savedCredentials', JSON.stringify(credentials));
                    } else {
                        localStorage.removeItem('savedCredentials');
                    }

                    // Verify user type matches selected role
                    if ((role === 'student' && response.type === 'student') || 
                        (role === 'lecturer' && response.type === 'employee')) {
                        window.location.href = role === 'student' ? 'Student_history.html' : 'Lecturer_history.html';
                    } else {
                        showError('roleError', 'กรุณาเลือกสถานะผู้ใช้งานให้ถูกต้อง');
                    }
                } else {
                    showError('passwordError', errorMessages.password.invalid);
                }
            } catch (error) {
                console.error('Login error:', error);
                showError('passwordError', error.message || errorMessages.system.error);
            } finally {
                setLoadingState(false);
            }
        }
    });

    // Show error modal function
    function showErrorModal(message) {
        const modal = document.getElementById('errorModal');
        const modalMessage = document.getElementById('modalMessage');
        modalMessage.textContent = message;
        modal.style.display = 'flex';
    }

    // Close modal function
    window.closeModal = function() {
        document.getElementById('errorModal').style.display = 'none';
    };

    // Close modal when clicking outside
    document.getElementById('errorModal').addEventListener('click', function(event) {
        if (event.target === this) {
            closeModal();
        }
    });

    // Close modal with escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
});