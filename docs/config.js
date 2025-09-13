
// 1. Define your backend URLs
const PROD_URL = 'https://your-alumni-app.onrender.com'; // Replace with your Other available URL
const DEV_URL = 'http://localhost:3000';                 // Your local server URL

// 2. Check the hostname to see if you are on localhost or a live site
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// 3. Export the correct URL based on the environment
const API_BASE_URL = isDevelopment ? DEV_URL : PROD_URL;