// Import API functions
import { isAuthenticated, getUserData, logout } from './API.js';

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    // DOM Elements
    const studentName = document.querySelector('.student-name');
    const studentId = document.querySelector('.student-id');
    const logoutBtn = document.querySelector('.menu-btn.logout');
    const menuBtns = document.querySelectorAll('.menu-btn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const petitionList = document.querySelector('.petition-list');

    // Function to show loading state
    function showLoading() {
        petitionList.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>กำลังโหลดข้อมูล...</p>
            </div>`;
    }

    // Function to show error state
    function showError(message) {
        petitionList.innerHTML = `
            <div class="error-state">
                <p>${message}</p>
                <button onclick="location.reload()">ลองใหม่</button>
            </div>`;
    }

    // Function to format date (YYYY-MM-DD to DD/MM/YYYY in Buddhist Era)
    function formatDate(dateString) {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear() + 543}`;
    }

    // Function to get status color class
    function getStatusColorClass(status) {
        if (status.includes('อนุมัติ')) return 'status-approved';
        if (status.includes('ไม่อนุมัติ')) return 'status-rejected';
        return 'status-pending';
    }

    // Function to create petition card
    function createPetitionCard(petition) {
        const item = document.createElement('div');
        item.className = 'petition-item';
        
        item.innerHTML = `
            <div class="petition-icon">
                <img src="img/document-icon.svg" alt="Petition Icon">
            </div>
            <div class="petition-info">
                <h3>${petition.type}</h3>
                <div class="petition-date">
                    <div>วันที่ยื่นคำร้อง: ${formatDate(petition.submitDate)}</div>
                    ${petition.completedDate ? 
                        `<div>วันที่เสร็จสิ้น: ${formatDate(petition.completedDate)}</div>` : 
                        ''}
                    ${petition.cancelledDate ? 
                        `<div>วันที่ยกเลิก: ${formatDate(petition.cancelledDate)}</div>` : 
                        ''}
                </div>
            </div>
        `;

        // Add click event for the entire item
        item.addEventListener('click', async function() {
            await viewPetitionDetails(petition.id);
        });

        return item;
    }

    // Function to show loading state
    function showLoading() {
        petitionList.innerHTML = `
            <div class="empty-message">
                <div class="spinner"></div>
                <p>กำลังโหลดข้อมูล...</p>
            </div>`;
    }

    // Function to show error state
    function showError(message) {
        petitionList.innerHTML = `
            <div class="empty-message">
                <p>${message}</p>
                <button onclick="location.reload()" class="retry-btn">ลองใหม่</button>
            </div>`;
    }

    // When no petitions are found
    function showEmptyState() {
        petitionList.innerHTML = `
            <div class="empty-message">
                <p>ไม่พบคำร้อง</p>
            </div>`;
    }

    // Update the fetchPetitions function
    async function fetchPetitions(status) {
        try {
            showLoading();

            const userData = getUserData();
            if (!userData) {
                throw new Error('ไม่พบข้อมูลผู้ใช้');
            }

            const endpoint = `/api/petitions?studentId=${userData.username}&status=${status}`;
            
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Add any required authentication headers
                }
            });

            if (!response.ok) {
                throw new Error('ไม่สามารถดึงข้อมูลได้');
            }

            const petitions = await response.json();

            // Clear and update petition list
            petitionList.innerHTML = '';
            
            if (petitions.length === 0) {
                showEmptyState();
                return;
            }

            // Add animation class to petition list
            petitionList.classList.add('tab-content');
            
            petitions.forEach(petition => {
                petitionList.appendChild(createPetitionCard(petition));
            });

        } catch (error) {
            console.error('Error fetching petitions:', error);
            showError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        }
    }

    // Function to view petition details
    async function viewPetitionDetails(petitionId) {
        try {
            const response = await fetch(`/api/petitions/${petitionId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Add any required authentication headers
                }
            });

            if (!response.ok) {
                throw new Error('ไม่สามารถดึงข้อมูลได้');
            }

            const details = await response.json();
            // TODO: Implement details view (modal or new page)
            console.log('Petition details:', details);

        } catch (error) {
            console.error('Error fetching petition details:', error);
            alert('ไม่สามารถโหลดรายละเอียดได้ กรุณาลองใหม่อีกครั้ง');
        }
    }

    // Load user data
    async function loadUserData() {
        try {
            const userData = getUserData();
            
            if (!userData) {
                throw new Error('ไม่พบข้อมูลผู้ใช้');
            }

            studentName.textContent = userData.displayNameTH || 'ไม่พบข้อมูล';
            studentId.textContent = userData.username || 'ไม่พบข้อมูล';

        } catch (error) {
            console.error('Error loading user data:', error);
            showError('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
        }
    }

    // Handle tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const status = this.dataset.tab;
            fetchPetitions(status);
        });
    });

    // Handle menu navigation
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
                    window.location.href = 'Student_history.html';
                    break;
                case 'เขียนคำร้อง':
                    window.location.href = 'petition_type.html';
                    break;
                case 'ตรวจสอบสถานะคำร้อง':
                    window.location.href = 'check_status.html';
                    break;
            }
        });
    });

    // Handle logout
    function handleLogout() {
        try {
            logout();
        } catch (error) {
            console.error('Logout error:', error);
            alert('ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง');
        }
    }

    // Initialize
    loadUserData();
    fetchPetitions('inProgress'); // Fetch in-progress petitions by default
});