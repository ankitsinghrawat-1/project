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
const port = 3000;

app.use(cors({
    origin: 'http://localhost:5500', 
    credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

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

// Create 'uploads' directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

// Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

// API Endpoints

// Login endpoint
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

// Logout endpoint
app.post('/api/logout', (req, res) => {
    res.clearCookie('loggedIn');
    res.status(200).json({ message: 'Logout successful' });
});

// Endpoint to check login status
app.get('/api/check-login', (req, res) => {
    if (req.cookies.loggedIn) {
        res.status(200).json({ isLoggedIn: true });
    } else {
        res.status(200).json({ isLoggedIn: false });
    }
});

// Signup endpoint
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

// Onboarding endpoint
app.post('/api/onboard', async (req, res) => {
    const { email, university, university_email, city, graduation_year, major, degree, current_company, job_title, bio, linkedin } = req.body;
    
    // Server-side validation
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

// Get user profile for a logged-in user
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

// Update user profile
app.put('/api/profile/:email', upload.single('profile_picture'), async (req, res) => {
    const { email } = req.params;
    const { bio, university, major, graduation_year, degree, current_company, job_title, city, linkedin } = req.body;
    let profile_pic_url = req.file ? `uploads/${req.file.filename}` : null;

    try {
        if (profile_pic_url) {
            const [rows] = await pool.query('SELECT profile_pic_url FROM users WHERE email = ?', [email]);
            if (rows.length > 0 && rows[0].profile_pic_url) {
                const oldPicPath = path.join(__dirname, 'public', rows[0].profile_pic_url);
                try {
                    await fs.unlink(oldPicPath);
                } catch (unlinkError) {
                    console.error('Failed to delete old profile picture:', unlinkError);
                }
            }
            await pool.query('UPDATE users SET bio = ?, university = ?, major = ?, graduation_year = ?, degree = ?, current_company = ?, job_title = ?, city = ?, linkedin = ?, profile_pic_url = ? WHERE email = ?', 
            [bio, university, major, graduation_year, degree, current_company, job_title, city, linkedin, profile_pic_url, email]);
        } else {
            await pool.query('UPDATE users SET bio = ?, university = ?, major = ?, graduation_year = ?, degree = ?, current_company = ?, job_title = ?, city = ?, linkedin = ? WHERE email = ?', 
            [bio, university, major, graduation_year, degree, current_company, job_title, city, linkedin, email]);
        }

        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get recent events for the dashboard
app.get('/api/events/recent', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT title, date, location FROM events ORDER BY date DESC LIMIT 3');
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

// Get recent jobs for the dashboard
app.get('/api/jobs/recent', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT title, company, location FROM jobs ORDER BY created_at DESC LIMIT 3');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching recent jobs:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get all events for the events page
app.get('/api/events', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT title, description, date, location FROM events ORDER BY date DESC');
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

// Get all jobs for the jobs page
app.get('/api/jobs', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT title, company, location, description FROM jobs ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching all jobs:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Add new job posting
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

// Add new event
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

// Admin login endpoint (for a dedicated admin user)
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
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});