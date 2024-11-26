import { isAuthenticated, getUserData, logout } from '../API.js';
import { 
    toggleLoading, 
    showErrorModal, 
    setupModalListeners,
    setupMenuNavigation,
    loadAndPopulateUserData
} from './utils.js';

export function initializeForm(formConfig) {
    document.addEventListener('DOMContentLoaded', async function() {
        if (!isAuthenticated()) {
            window.location.href = '../index.html';
            return;
        }

        const loadingOverlay = document.querySelector('.loading-overlay');
        const studentName = document.querySelector('.student-name');
        const studentId = document.querySelector('.student-id');
        const form = document.getElementById(formConfig.formId);
        const logoutBtn = document.querySelector('.menu-btn.logout');
        const menuBtns = document.querySelectorAll('.menu-btn');
        
        const formElements = {
            studentName,
            studentId,
            firstNameInput: document.getElementById('firstName'),
            lastNameInput: document.getElementById('lastName'),
            firstNameEnInput: document.getElementById('firstNameEn'),
            lastNameEnInput: document.getElementById('lastNameEn'),
            idNumberInput: document.getElementById('idNumber')
        };

        function handleLogout() {
            try {
                logout();
            } catch (error) {
                showErrorModal('ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง');
            }
        }

        try {
            toggleLoading(loadingOverlay, true);
            setupModalListeners();
            setupMenuNavigation(menuBtns, logoutBtn, handleLogout);

            const userData = getUserData();
            await loadAndPopulateUserData(userData, formElements);

            if (formConfig.setupFormHandlers) {
                formConfig.setupFormHandlers(form, formElements);
            }

            if (form && formConfig.handleSubmit) {
                form.addEventListener('submit', async function(event) {
                    event.preventDefault();
                    try {
                        toggleLoading(loadingOverlay, true);
                        await formConfig.handleSubmit(event, formElements);
                    } catch (error) {
                        console.error('Form submission error:', error);
                        showErrorModal(error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
                    } finally {
                        toggleLoading(loadingOverlay, false);
                    }
                });
            }

        } catch (error) {
            console.error('Initialization error:', error);
            showErrorModal('เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง');
        } finally {
            toggleLoading(loadingOverlay, false);
        }
    });
}