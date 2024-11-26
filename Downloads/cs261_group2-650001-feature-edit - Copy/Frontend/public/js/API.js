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

async function saveUserDataToBackend(userData) {
    try {
        console.log('Saving user data to backend:', userData);
        
        const studentData = {
            username: userData.username,
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
            phone: '',
            address: '',
            advisor_name: '',
            gpax: ''
        };

        const response = await fetch(`${BACKEND_URL}/api/students/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentData)
        });

        if (!response.ok) {
            throw new Error('Failed to save user data');
        }

        const result = await response.json();
        console.log('Save result:', result);
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

        // 1. Authenticate with TU API
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

        // 2. Check response status
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

        // 3. Get TU API data
        const tuData = await response.json();
        console.log('TUAPI Response:', tuData);

        if (!tuData.status) {
            throw new Error(tuData.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }

        // 4. If authentication successful
        if (tuData.status) {
            // 5. Try to get existing data from our database
            const studentResponse = await fetch(`${BACKEND_URL}/api/students/username/${username}`);
            const studentData = await studentResponse.json();

            let userData;

            // 6. If student exists in our database, use that data
            if (studentResponse.ok && studentData.data) {
                console.log('Found existing student data:', studentData.data);
                userData = {
                    username: studentData.data.username,
                    type: studentData.data.type || 'student',
                    displayNameTH: studentData.data.displayNameTh,
                    displayNameEN: studentData.data.displayNameEn,
                    email: studentData.data.email,
                    department: studentData.data.department,
                    faculty: studentData.data.faculty
                };
            } else {
                // 7. If student doesn't exist, create new record
                console.log('Creating new student record');
                const savedData = await saveUserDataToBackend(tuData);
                userData = {
                    username: tuData.username,
                    type: tuData.type || 'student',
                    displayNameTH: tuData.displayname_th,
                    displayNameEN: tuData.displayname_en,
                    email: tuData.email,
                    department: tuData.department,
                    faculty: tuData.faculty
                };
            }

            // 8. Save to session storage
            sessionStorage.setItem('userData', JSON.stringify(userData));
            sessionStorage.setItem('authToken', 'authenticated');
            const expiryTime = new Date().getTime() + (30 * 60 * 1000);
            sessionStorage.setItem('sessionExpiry', expiryTime.toString());

            return tuData;
        }

        return tuData;
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