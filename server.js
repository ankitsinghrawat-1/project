/* --- server.js --- */
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: 'http://localhost:5500', 
    credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create a connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'ankit@54328',
    database: 'alumni_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Create 'uploads' directories if they don't exist
const uploadDir = path.join(__dirname, 'uploads');
const resumeDir = path.join(__dirname, 'uploads', 'resumes');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);
fs.mkdir(resumeDir, { recursive: true }).catch(console.error);

// Multer for file uploads (handles both profile pics and resumes)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'resume') {
            cb(null, resumeDir);
        } else {
            cb(null, uploadDir);
        }
    },
    filename: (req, file, cb) => {
        const userIdentifier = req.body.email ? req.body.email.split('@')[0] : 'user';
        cb(null, `${file.fieldname}-${userIdentifier}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

// --- NEW JOB APPLICATION ENDPOINTS ---

app.post('/api/jobs/:job_id/apply', upload.single('resume'), async (req, res) => {
    const { job_id } = req.params;
    const { email, full_name, cover_letter } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ message: 'A resume file is required.' });
    }
    const resume_path = `uploads/resumes/${req.file.filename}`;

    try {
        await pool.query(
            'INSERT INTO job_applications (job_id, user_email, full_name, resume_path, cover_letter) VALUES (?, ?, ?, ?, ?)',
            [job_id, email, full_name, resume_path, cover_letter]
        );
        res.status(201).json({ message: 'Application submitted successfully!' });
    } catch (error) {
        console.error('Error submitting application:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/admin/applications', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                ja.full_name,
                ja.user_email,
                ja.resume_path,
                ja.application_date,
                j.title AS job_title
            FROM job_applications ja
            JOIN jobs j ON ja.job_id = j.job_id
            ORDER BY ja.application_date DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching applications for admin:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// --- ADMIN ENDPOINTS ---

app.get('/api/admin/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT user_id, full_name, email, role FROM users');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching users for admin:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE user_id = ?', [req.params.id]);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.delete('/api/admin/events/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM events WHERE event_id = ?', [req.params.id]);
        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.delete('/api/admin/jobs/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM jobs WHERE job_id = ?', [req.params.id]);
        res.status(200).json({ message: 'Job deleted successfully' });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// --- GENERAL API ENDPOINTS ---

app.get('/api/alumni', async (req, res) => {
    const { query } = req.query;
    try {
        let sql = 'SELECT * FROM users';
        const params = [];
        if (query) {
            sql += ' WHERE full_name LIKE ? OR current_company LIKE ? OR major LIKE ?';
            params.push(`%${query}%`, `%${query}%`, `%${query}%`);
        }
        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching alumni:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (isMatch) {
            res.cookie('loggedIn', 'true', { httpOnly: true, maxAge: 3600000 });
            res.status(200).json({ message: 'Login successful', role: user.role, email: user.email });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('loggedIn');
    res.status(200).json({ message: 'Logout successful' });
});

app.get('/api/check-login', (req, res) => {
    if (req.cookies.loggedIn) {
        res.status(200).json({ isLoggedIn: true });
    } else {
        res.status(200).json({ isLoggedIn: false });
    }
});

app.post('/api/signup', async (req, res) => {
    const { full_name, email, password } = req.body;
    try {
        const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Email already registered' });
        }
        const password_hash = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)', [full_name, email, password_hash]);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/onboard', async (req, res) => {
    const { email, university, university_email, city, graduation_year, major, degree, current_company, job_title, bio, linkedin } = req.body;
    
    if (!university || !university_email || !city || !graduation_year || !major || !degree || !current_company || !job_title || !bio || !linkedin) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    
    try {
        await pool.query(
            'UPDATE users SET university = ?, university_email = ?, city = ?, graduation_year = ?, major = ?, degree = ?, current_company = ?, job_title = ?, bio = ?, linkedin = ?, onboarding_complete = TRUE WHERE email = ?',
            [university, university_email, city, graduation_year, major, degree, current_company, job_title, bio, linkedin, email]
        );
        res.status(200).json({ message: 'Onboarding complete' });
    } catch (error) {
        console.error('Onboarding error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/profile/:email', async (req, res) => {
    const { email } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.put('/api/profile/:email', upload.single('profile_picture'), async (req, res) => {
    const { email } = req.params;
    const linkedin = req.body.linkedin ? req.body.linkedin : null;
    const { bio, university, major, graduation_year, degree, current_company, job_title, city } = req.body;
    let profile_pic_url = req.file ? `uploads/${req.file.filename}` : null;

    try {
        const updateFields = { bio, university, major, graduation_year, degree, current_company, job_title, city, linkedin };
        let sql = 'UPDATE users SET ';
        const params = [];
        
        Object.keys(updateFields).forEach((key, index) => {
            sql += `${key} = ?`;
            params.push(updateFields[key]);
            if (index < Object.keys(updateFields).length - 1) {
                sql += ', ';
            }
        });

        if (profile_pic_url) {
            const [rows] = await pool.query('SELECT profile_pic_url FROM users WHERE email = ?', [email]);
            if (rows.length > 0 && rows[0].profile_pic_url) {
                const oldPicPath = path.join(__dirname, rows[0].profile_pic_url);
                fs.unlink(oldPicPath).catch(err => console.error("Failed to delete old profile pic:", err));
            }
            sql += ', profile_pic_url = ?';
            params.push(profile_pic_url);
        }

        sql += ' WHERE email = ?';
        params.push(email);
        
        await pool.query(sql, params);

        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Internal Server Error', sqlMessage: error.sqlMessage });
    }
});


app.get('/api/events/recent', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT event_id, title, date, location FROM events ORDER BY date DESC LIMIT 3');
        const events = rows.map(row => ({
            ...row,
            date: new Date(row.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
        }));
        res.json(events);
    } catch (error) {
        console.error('Error fetching recent events:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/jobs/recent', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT job_id, title, company, location FROM jobs ORDER BY created_at DESC LIMIT 3');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching recent jobs:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/events', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT event_id, title, description, date, location FROM events ORDER BY date DESC');
        const events = rows.map(row => ({
            ...row,
            date: new Date(row.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
        }));
        res.json(events);
    } catch (error) {
        console.error('Error fetching all events:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/jobs', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT job_id, title, company, location, description, contact_email FROM jobs ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching all jobs:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/jobs', async (req, res) => {
    const { title, company, location, description, contact_email } = req.body;
    try {
        await pool.query('INSERT INTO jobs (title, company, location, description, contact_email) VALUES (?, ?, ?, ?, ?)', [title, company, location, description, contact_email]);
        res.status(201).json({ message: 'Job added successfully' });
    } catch (error) {
        console.error('Error adding job:', error);
        res.status(500).json({ message: 'Failed to add job' });
    }
});

app.post('/api/events', async (req, res) => {
    const { title, date, location, organizer, description } = req.body;
    try {
        await pool.query('INSERT INTO events (title, date, location, organizer, description) VALUES (?, ?, ?, ?, ?)', [title, date, location, organizer, description]);
        res.status(201).json({ message: 'Event added successfully' });
    } catch (error) {
        console.error('Error adding event:', error);
        res.status(500).json({ message: 'Failed to add event' });
    }
});

app.post('/api/admin-login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND role = "admin"', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (isMatch) {
            res.cookie('loggedIn', 'true', { httpOnly: true, maxAge: 3600000 });
            res.status(200).json({ message: 'Admin login successful' });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});