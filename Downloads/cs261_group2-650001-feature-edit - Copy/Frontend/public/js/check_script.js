import { BasePage, formatDate } from './common/page.js';

class CheckPetitionPage extends BasePage {
    constructor() {
        super();
        this.petitionList = document.querySelector('.petition-list');
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.currentTab = localStorage.getItem('currentTab') || 'waitforProgress';
    }

    async initializePage() {
        this.setupTabHandlers();
        await this.loadInitialTab();
    }

    setupTabHandlers() {
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleTabSwitch(btn));
        });
    }

    async loadInitialTab() {
        this.tabBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${this.currentTab}"]`).classList.add('active');
        await this.fetchPetitions(this.currentTab);
    }

    handleTabSwitch(clickedTab) {
        this.tabBtns.forEach(b => b.classList.remove('active'));
        clickedTab.classList.add('active');
        
        const status = clickedTab.dataset.tab;
        this.fetchPetitions(status);
    }

    showState(type, message = '', status = '') {
        switch(type) {
            case 'loading':
                this.petitionList.innerHTML = `
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <p>กำลังโหลดข้อมูล...</p>
                    </div>`;
                break;
            
            case 'error':
                this.petitionList.innerHTML = `
                    <div class="error-state">
                        <p>${message}</p>
                        <button id="retry-btn" class="retry-btn">ลองใหม่</button>
                    </div>`;
                document.getElementById('retry-btn')?.addEventListener('click', 
                    () => this.fetchPetitions(status));
                break;
                
            case 'empty':
                this.petitionList.innerHTML = `
                    <div class="empty-message">
                        <p>ไม่พบคำร้อง</p>
                    </div>`;
                break;
        }
    }

    createPetitionCard(petition) {
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

        item.addEventListener('click', () => this.viewPetitionDetails(petition.id));
        return item;
    }

    async fetchPetitions(status) {
        try {
            localStorage.setItem('currentTab', status);
            this.showState('loading');

            const userData = await this.loadUserData();
            if (!userData) return;

            const response = await fetch(`/api/petitions?studentId=${userData.username}&status=${status}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('ไม่สามารถดึงข้อมูลได้');
            }

            const petitions = await response.json();
            this.petitionList.innerHTML = '';
            
            if (petitions.length === 0) {
                this.showState('empty');
                return;
            }
            
            petitions.forEach(petition => {
                this.petitionList.appendChild(this.createPetitionCard(petition));
            });

        } catch (error) {
            console.error('Error fetching petitions:', error);
            this.showState('error', 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง', status);
        }
    }

    async viewPetitionDetails(petitionId) {
        try {
            const response = await fetch(`/api/petitions/${petitionId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('ไม่สามารถดึงข้อมูลได้');
            }

            const details = await response.json();
            console.log('Petition details:', details);
            // TODO: Implement details view

        } catch (error) {
            console.error('Error fetching petition details:', error);
            this.showErrorModal('ไม่สามารถโหลดรายละเอียดได้ กรุณาลองใหม่อีกครั้ง');
        }
    }
}

// Initialize page
new CheckPetitionPage();