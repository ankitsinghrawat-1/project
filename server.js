const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// --- SECURITY SETUP ---
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const app = express();
const PORT = process.env.PORT || 3000;

// Rate Limiter for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login attempts from this IP, please try again after 15 minutes' }
});

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || origin.startsWith('http://localhost')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};
app.use(cors(corsOptions));


app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('docs'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- DATABASE SETUP ---
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'ankit@54328',
    database: 'alumni_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- FILE UPLOAD SETUP ---
const uploadDir = path.join(__dirname, 'uploads');
const resumeDir = path.join(__dirname, 'uploads', 'resumes');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);
fs.mkdir(resumeDir, { recursive: true }).catch(console.error);

// Secure File Filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, PDF, and DOC files are allowed.'), false);
    }
};

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
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB file size limit
});

// --- ENDPOINTS ---
// (All endpoints remain the same, but the security middleware is now active)

// Example of sanitization within an endpoint (apply this pattern to all endpoints handling user-generated HTML content)
app.post('/api/blogs', async (req, res) => {
    const { title, content, author_email } = req.body;
    try {
        const cleanContent = DOMPurify.sanitize(content); // Sanitize content
        const [user] = await pool.query('SELECT user_id FROM users WHERE email = ?', [author_email]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'Author not found' });
        }
        const author_id = user[0].user_id;
        await pool.query('INSERT INTO blogs (title, content, author_id) VALUES (?, ?, ?)', [title, cleanContent, author_id]);
        res.status(201).json({ message: 'Blog post created successfully' });
    } catch (error) {
        console.error('Error creating blog post:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.put('/api/profile/:email', upload.single('profile_picture'), async (req, res) => {
    const { email } = req.params;
    const { full_name, bio, current_company, job_title, city, linkedin, university, major, graduation_year, degree } = req.body;
    let profile_pic_url = req.file ? `uploads/${req.file.filename}` : undefined;
    try {
        const [userRows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userRows[0];
        const updateData = {};
        if (full_name !== undefined) updateData.full_name = DOMPurify.sanitize(full_name);
        if (bio !== undefined) updateData.bio = DOMPurify.sanitize(bio);
        if (current_company !== undefined) updateData.current_company = DOMPurify.sanitize(current_company);
        if (job_title !== undefined) updateData.job_title = DOMPurify.sanitize(job_title);
        if (city !== undefined) updateData.city = DOMPurify.sanitize(city);
        if (linkedin !== undefined) updateData.linkedin = linkedin || null;
        if (university !== undefined) updateData.university = DOMPurify.sanitize(university);
        if (major !== undefined) updateData.major = DOMPurify.sanitize(major);
        if (graduation_year !== undefined) updateData.graduation_year = DOMPurify.sanitize(graduation_year);
        if (degree !== undefined) updateData.degree = DOMPurify.sanitize(degree);

        if (profile_pic_url) {
            updateData.profile_pic_url = profile_pic_url;
            if (user.profile_pic_url) {
                const oldPicPath = path.join(__dirname, user.profile_pic_url);
                fs.unlink(oldPicPath).catch(err => console.error("Failed to delete old profile pic:", err));
            }
        }
        if (Object.keys(updateData).length > 0) {
            await pool.query('UPDATE users SET ? WHERE email = ?', [updateData, email]);
        }
        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Internal Server Error', sqlMessage: error.sqlMessage });
    }
});


// Apply rate limiter to login endpoints
app.post('/api/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (isMatch) {
            res.cookie('loggedIn', 'true', { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 3600000 });
            res.status(200).json({ message: 'Login successful', role: user.role, email: user.email });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/admin-login', loginLimiter, async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND role = "admin"', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (isMatch) {
            res.cookie('loggedIn', 'true', { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 3600000 });
            res.status(200).json({ message: 'Admin login successful' });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// ... (The rest of your endpoints like GET /api/users, GET /api/events, etc., remain unchanged)
// ... (Make sure to include ALL your other endpoints here)
// ... The file is very long, so I'm omitting the unchanged parts for brevity.
// ... Please ensure you merge these security updates into your complete server.js file.


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});