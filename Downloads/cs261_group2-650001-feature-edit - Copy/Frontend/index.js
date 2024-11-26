const express = require('express');
const path = require('path');
const sql = require('mssql');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database configuration
const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'YourStrong@Passw0rd',
    server: process.env.DB_SERVER || 'sqlserver',
    database: process.env.DB_NAME || 'TUAuthDB',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint สำหรับบันทึกข้อมูล login
app.post('/api/auth/save-login', async (req, res) => {
    try {
        const {
            username,
            type,
            displayname_th,
            displayname_en,
            email,
            department,
            tu_status,
            statusid,
            faculty,
            StatusWork,
            StatusEmp,
            organization
        } = req.body;

        console.log('Received login data:', req.body);

        const pool = await sql.connect(dbConfig);
        
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('type', sql.NVarChar, type)
            .input('displayname_th', sql.NVarChar, displayname_th)
            .input('displayname_en', sql.NVarChar, displayname_en)
            .input('email', sql.NVarChar, email)
            .input('department', sql.NVarChar, department)
            .input('tu_status', sql.NVarChar, tu_status)
            .input('statusid', sql.NVarChar, statusid)
            .input('faculty', sql.NVarChar, faculty)
            .input('StatusWork', sql.NVarChar, StatusWork)
            .input('StatusEmp', sql.NVarChar, StatusEmp)
            .input('organization', sql.NVarChar, organization)
            .query(`
                INSERT INTO UserLogins (
                    username, type, displayname_th, displayname_en,
                    email, department, tu_status, statusid,
                    faculty, StatusWork, StatusEmp, organization
                ) VALUES (
                    @username, @type, @displayname_th, @displayname_en,
                    @email, @department, @tu_status, @statusid,
                    @faculty, @StatusWork, @StatusEmp, @organization
                )
            `);

        res.json({ 
            success: true, 
            message: 'Login saved successfully' 
        });

    } catch (error) {
        console.error('Error saving login:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to save login data',
            details: error.message 
        });
    }
});

// API endpoint สำหรับดูประวัติ login
app.get('/api/auth/login-history/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const pool = await sql.connect(dbConfig);
        
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT * FROM UserLogins 
                WHERE username = @username 
                ORDER BY timestamp DESC
            `);

        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch login history' 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});