const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'public', 'uploads');
        // Create the uploads directory if it doesn't exist
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Unique filename to prevent collisions
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// MySQL Connection Pool
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'ankit@54328',
    database: 'alumni_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test DB connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Successfully connected to the database.');
    connection.release();
});

// --- API Endpoints ---

// POST /api/signup
app.post('/api/signup', async (req, res) => {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    try {
        const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(409).json({ message: 'Email already in use.' });
        }
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        await db.promise().query(
            'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
            [fullName, email, passwordHash]
        );
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
            console.error('Error during signup:', error);
            res.status(500).json({ message: 'Server error during registration.' });
    }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        const onboardingComplete = user.onboarding_complete;
        res.status(200).json({ message: 'Login successful!', onboardingComplete });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// POST /api/forgot-password
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(200).json({ message: 'If that email is in our system, we have sent a password reset link.' });
        }
        res.status(200).json({ message: 'If that email is in our system, we have sent a password reset link.' });
    } catch (error) {
        console.error('Error during forgot password request:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// GET /api/profile/:email
app.get('/api/profile/:email', async (req, res) => {
    const userEmail = req.params.email;
    try {
        const [rows] = await db.promise().query(
            'SELECT full_name, email, university, university_email, city, graduation_year, major, degree, current_company, job_title, bio, linkedin, profile_pic_url FROM users WHERE email = ?',
            [userEmail]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Profile not found.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching profile data:', error);
        res.status(500).json({ message: 'Server error fetching profile data.' });
    }
});

// GET /api/public-profile/:email
app.get('/api/public-profile/:email', async (req, res) => {
    const userEmail = req.params.email;
    try {
        const [rows] = await db.promise().query(
            'SELECT full_name, university, city, graduation_year, major, degree, current_company, job_title, bio, linkedin, profile_pic_url FROM users WHERE email = ? AND onboarding_complete = 1',
            [userEmail]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found or profile not public.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching public profile:', error);
        res.status(500).json({ message: 'Server error fetching public profile.' });
    }
});


// PUT /api/profile/:email
app.put('/api/profile/:email', upload.single('profile_picture'), async (req, res) => {
    const userEmail = req.params.email;
    const { fullName, university, universityEmail, city, graduationYear, major, degree, currentCompany, jobTitle, bio, linkedin } = req.body;
    let profilePicUrl = req.file ? `uploads/${req.file.filename}` : null;

    try {
        if (profilePicUrl) {
            const [rows] = await db.promise().query('SELECT profile_pic_url FROM users WHERE email = ?', [userEmail]);
            if (rows.length > 0 && rows[0].profile_pic_url) {
                const oldPath = path.join(__dirname, 'public', rows[0].profile_pic_url);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            await db.promise().query(
                'UPDATE users SET full_name = ?, university = ?, university_email = ?, city = ?, graduation_year = ?, major = ?, degree = ?, current_company = ?, job_title = ?, bio = ?, linkedin = ?, profile_pic_url = ? WHERE email = ?',
                [fullName, university, universityEmail, city, graduationYear, major, degree, currentCompany, jobTitle, bio, linkedin, profilePicUrl, userEmail]
            );
        } else {
            await db.promise().query(
                'UPDATE users SET full_name = ?, university = ?, university_email = ?, city = ?, graduation_year = ?, major = ?, degree = ?, current_company = ?, job_title = ?, bio = ?, linkedin = ? WHERE email = ?',
                [fullName, university, universityEmail, city, graduationYear, major, degree, currentCompany, jobTitle, bio, linkedin, userEmail]
            );
        }
        res.status(200).json({ message: 'Profile updated successfully!' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Server error updating profile.' });
    }
});

// POST /api/onboarding
app.post('/api/onboarding', async (req, res) => {
    const { email, university, universityEmail, city, company, currentJob, note } = req.body;
    if (!email || !university || !universityEmail || !city || !company || !currentJob || !note) {
        return res.status(400).json({ message: 'All mandatory fields are required.' });
    }
    try {
        await db.promise().query(
            'UPDATE users SET university = ?, university_email = ?, city = ?, current_company = ?, job_title = ?, bio = ?, onboarding_complete = 1 WHERE email = ?',
            [university, universityEmail, city, company, currentJob, note, email]
        );
        res.status(200).json({ message: 'Onboarding complete. Profile updated successfully.' });
    } catch (error) {
        console.error('Error during onboarding:', error);
        res.status(500).json({ message: 'Server error during onboarding.' });
    }
});

// GET /api/alumni
app.get('/api/alumni', async (req, res) => {
    const { query } = req.query;
    let sql = 'SELECT full_name, email, job_title, current_company, major, graduation_year, profile_pic_url FROM users WHERE onboarding_complete = 1';
    const params = [];
    if (query) {
        const searchQuery = `%${query}%`;
        sql += ' AND (full_name LIKE ? OR current_company LIKE ? OR major LIKE ?)';
        params.push(searchQuery, searchQuery, searchQuery);
    }
    sql += ' ORDER BY full_name';
    try {
        const [rows] = await db.promise().query(sql, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching alumni directory:', error);
        res.status(500).json({ message: 'Server error fetching directory.' });
    }
});

// GET /api/events/recent
app.get('/api/events/recent', (req, res) => {
    const events = [
        { title: 'Annual Alumni Gala', date: 'Oct 25, 2025', location: 'University Convention Center' },
        { title: 'Tech Career Fair', date: 'Nov 10, 2025', location: 'Engineering Hall' },
        { title: 'Startup Networking Meetup', date: 'Dec 05, 2025', location: 'Downtown Business Hub' }
    ];
    res.status(200).json(events);
});

// GET /api/jobs/recent
app.get('/api/jobs/recent', (req, res) => {
    const jobs = [
        { title: 'Senior Software Engineer', company: 'Innovate Solutions Inc.', location: 'New York, NY' },
        { title: 'Marketing Manager', company: 'Growth Strategies Co.', location: 'Remote' },
        { title: 'Data Scientist', company: 'Analytics Corp.', location: 'San Francisco, CA' }
    ];
    res.status(200).json(jobs);
});

// GET /api/spotlight
app.get('/api/spotlight', async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT full_name, bio, profile_pic_url FROM users WHERE bio IS NOT NULL AND profile_pic_url IS NOT NULL ORDER BY RAND() LIMIT 1');
        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).json({ message: 'No alumni spotlight available.' });
        }
    } catch (error) {
        console.error('Error fetching alumni spotlight:', error);
        res.status(500).json({ message: 'Server error fetching spotlight.' });
    }
});

// GET /api/campaigns
app.get('/api/campaigns', (req, res) => {
    const campaigns = [
        {
            id: 1,
            title: 'Scholarship Fund for Students',
            description: 'Support the next generation of leaders by contributing to our scholarship fund.',
            image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop',
            goal: 50000,
            current_amount: 35000
        },
        {
            id: 2,
            title: 'Library Renovation Project',
            description: 'Help us modernize the university library with new technology and resources.',
            image_url: 'https://images.unsplash.com/photo-1507646221762-b94ad35edc02?q=80&w=2070&auto=format&fit=crop',
            goal: 75000,
            current_amount: 15000
        },
        {
            id: 3,
            title: 'Alumni Mentorship Program',
            description: 'Fund our new initiative to connect current students with alumni mentors.',
            image_url: 'https://images.unsplash.com/photo-1522204523234-8729aa6e3d58?q=80&w=2070&auto=format&fit=crop',
            goal: 25000,
            current_amount: 25000
        }
    ];
    res.status(200).json(campaigns);
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});