// Backend Configuration
const BACKEND_URL = 'http://localhost:8080';

// TU API Configuration
const API_CONFIG = {
    BASE_URL: 'https://restapi.tu.ac.th/api/v1',
    APP_KEY: 'TUce8ebe796d66cb8fab75a309d97313858aabb8ab12527f50f6093f9168c64bfbfabdae8117c844c83176aebdb1e5b50e',
    ENDPOINTS: {
        AUTH: '/auth/Ad/verify'
    }
};

// Student API Functions
const studentApi = {
    // Get all students
    getAllStudents: async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/students`);
            if (!response.ok) {
                throw new Error('Failed to fetch students');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching students:', error);
            throw error;
        }
    },

    // Get student by ID
    getStudentById: async (id) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/students/${id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch student');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching student:', error);
            throw error;
        }
    },

    // Get student by username
    getStudentByUsername: async (username) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/students/username/${username}`);
            if (!response.ok) {
                throw new Error('Failed to fetch student');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching student:', error);
            throw error;
        }
    },

    // Update student
    updateStudent: async (username, updateData) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/students/${username}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update student');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating student:', error);
            throw error;
        }
    },

    // Delete student
    deleteStudent: async (id) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/students/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error('Failed to delete student');
            }
            return await response.json();
        } catch (error) {
            console.error('Error deleting student:', error);
            throw error;
        }
    }
};

// Save user data to backend
async function saveUserDataToBackend(userData) {
    try {
        console.log('Sending user data to backend:', userData);
        
        const studentData = {
            username: userData.username || '',
            type: userData.type || 'student',
            displayname_en: userData.displayname_en || '',
            displayname_th: userData.displayname_th || '',
            email: userData.email || '',
            department: userData.department || '',
            faculty: userData.faculty || '',
            tu_status: userData.tu_status || '',
            statusid: userData.statusid || '',
            organization: userData.organization || '',
            StatusWork: userData.StatusWork || '',
            StatusEmp: userData.StatusEmp || '',
            student_info: {
                advisorName: '',
                gpax: '',
                phone: '',
                address: ''
            }
        };

        console.log('Formatted data to send:', studentData);

        const response = await fetch(`${BACKEND_URL}/api/students/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save user data');
        }

        const result = await response.json();
        console.log('Backend result:', result);
        return result;
    } catch (error) {
        console.error('Error saving user data:', error);
        throw error;
    }
}

// TU API Authentication
async function authenticateWithTUAPI(username, password) {
    try {
        console.log('Attempting login with:', { username });

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

        switch (response.status) {
            case 200:
                break;
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
        console.log('TUAPI Response:', data);

        if (!data.status) {
            throw new Error(data.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }

        if (data.status) {
            console.log('Login successful, saving to backend...');
            // Save to database first
            const savedData = await saveUserDataToBackend(data);
            console.log('Saved to backend:', savedData);

            // Then save to session storage
            const userData = {
                username: data.username,
                type: data.type,
                displayNameTH: data.displayname_th,
                displayNameEN: data.displayname_en,
                email: data.email,
                department: data.department,
                faculty: data.faculty,
                tu_status: data.tu_status,
                statusId: data.statusid,
                organization: data.organization,
                statusWork: data.StatusWork,
                statusEmp: data.StatusEmp,
                timestamp: new Date().getTime()
            };

            sessionStorage.setItem('userData', JSON.stringify(userData));
            sessionStorage.setItem('authToken', 'authenticated');
            
            const expiryTime = new Date().getTime() + (30 * 60 * 1000);
            sessionStorage.setItem('sessionExpiry', expiryTime.toString());
        }

        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// Session Management Functions
function isSessionExpired() {
    const expiryTime = sessionStorage.getItem('sessionExpiry');
    if (!expiryTime) return true;
    return new Date().getTime() > parseInt(expiryTime);
}

function isAuthenticated() {
    if (!sessionStorage.getItem('authToken')) return false;
    if (isSessionExpired()) {
        logout();
        return false;
    }
    return true;
}

function getUserData() {
    try {
        if (!isAuthenticated()) {
            return null;
        }
        const userData = sessionStorage.getItem('userData');
        if (!userData) return null;
        
        const parsedData = JSON.parse(userData);
        const newExpiryTime = new Date().getTime() + (30 * 60 * 1000);
        sessionStorage.setItem('sessionExpiry', newExpiryTime.toString());
        
        return parsedData;
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}

function startSessionTimer() {
    setInterval(() => {
        if (isSessionExpired()) {
            logout();
        }
    }, 60000); // Check every minute
}

function clearHistoryState() {
    window.history.pushState(null, '', window.location.href);
}

function logout() {
    sessionStorage.clear();
    clearHistoryState();
    sessionStorage.setItem('logout', 'true');
    window.location.href = 'index.html';
}

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

// Start session timer
startSessionTimer();

// Export all functions
export {
    authenticateWithTUAPI,
    isAuthenticated,
    getUserData,
    getUserType,
    logout,
    isSessionExpired,
    clearHistoryState,
    studentApi
};