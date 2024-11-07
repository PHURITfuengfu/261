// API.js

// TU API Configuration
const API_CONFIG = {
    BASE_URL: 'https://restapi.tu.ac.th/api/v1',
    APP_KEY: 'TUce8ebe796d66cb8fab75a309d97313858aabb8ab12527f50f6093f9168c64bfbfabdae8117c844c83176aebdb1e5b50e',
    ENDPOINTS: {
        AUTH: '/auth/Ad/verify'
    }
};

// TU API Authentication
async function authenticateWithTUAPI(username, password) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Application-Key': API_CONFIG.APP_KEY
            },
            body: JSON.stringify({
                UserName: username,
                PassWord: password
            })
        });

        // Check HTTP Status
        switch (response.status) {
            case 200:
                break; // Continue processing
            case 400:
                throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
            case 401:
                throw new Error('ไม่พบ Application-Key โปรดติดต่อผู้ดูแลระบบ');
            case 403:
                throw new Error('Application-Key ไม่ถูกต้อง โปรดติดต่อผู้ดูแลระบบ');
            default:
                throw new Error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }

        const data = await response.json();

        // Check API Response Status
        if (!data.status) {
            throw new Error(data.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }

        // Store user data in session storage with timestamp
        if (data.status) {
            const userData = {
                username: data.username,
                type: data.type,
                displayNameTH: data.displayname_th,
                displayNameEN: data.displayname_en,
                email: data.email,
                department: data.department,
                // Student specific data
                tuStatus: data.tu_status,
                statusId: data.statusid,
                faculty: data.faculty,
                // Employee specific data
                statusWork: data.StatusWork,
                statusEmp: data.StatusEmp,
                organization: data.organization,
                // Add timestamp
                timestamp: new Date().getTime()
            };

            sessionStorage.setItem('userData', JSON.stringify(userData));
            sessionStorage.setItem('authToken', 'authenticated');
            
            // Set session expiry time (30 minutes from login)
            const expiryTime = new Date().getTime() + (30 * 60 * 1000);
            sessionStorage.setItem('sessionExpiry', expiryTime.toString());
        }

        return data;
    } catch (error) {
        console.error('TU API Error:', error);
        throw error;
    }
}

// Check if session is expired
function isSessionExpired() {
    const expiryTime = sessionStorage.getItem('sessionExpiry');
    if (!expiryTime) return true;
    
    const currentTime = new Date().getTime();
    return currentTime > parseInt(expiryTime);
}

// Check if user is authenticated
function isAuthenticated() {
    if (!sessionStorage.getItem('authToken')) return false;
    
    // Check session expiry
    if (isSessionExpired()) {
        logout();
        return false;
    }
    
    return true;
}

// Get stored user data
function getUserData() {
    try {
        if (!isAuthenticated()) {
            return null;
        }

        const userData = sessionStorage.getItem('userData');
        if (!userData) return null;

        const parsedData = JSON.parse(userData);
        
        // Update session expiry time on data access
        const newExpiryTime = new Date().getTime() + (30 * 60 * 1000);
        sessionStorage.setItem('sessionExpiry', newExpiryTime.toString());
        
        return parsedData;
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}

// Enforce session timeout check
function startSessionTimer() {
    setInterval(() => {
        if (isSessionExpired()) {
            logout();
        }
    }, 60000); // Check every minute
}

// Clear browser history state
function clearHistoryState() {
    window.history.pushState(null, '', window.location.href);
}

// Logout function
function logout() {
    // Clear all session data
    sessionStorage.clear();
    
    // Clear history state
    clearHistoryState();
    
    // Add a flag to prevent going back
    sessionStorage.setItem('logout', 'true');
    
    // Redirect to login page
    window.location.href = 'index.html';
}

// Get user type (student or employee)
function getUserType() {
    const userData = getUserData();
    return userData?.type || null;
}

// Handle back button
window.addEventListener('popstate', function() {
    if (sessionStorage.getItem('logout') === 'true') {
        clearHistoryState();
    }
});

// Start session timer when module loads
startSessionTimer();

// Export functions
export {
    authenticateWithTUAPI,
    isAuthenticated,
    getUserData,
    getUserType,
    logout,
    isSessionExpired,
    clearHistoryState
};
