/*
============================================================
AuraNode :: Main Server File (server.js / index.js)
============================================================
Created By: SAYAM + ZAYYAN
*/

// --- 1. DEPENDENCIES & INITIAL SETUP ---
require('dotenv').config(); // MUST be at the top to load .env variables
const express = require('express');
const path = require('path');
const axios = require('axios'); // For making API requests
const session = require('express-session'); // For user login sessions
const flash = require('connect-flash'); // For showing one-time messages
const { features } = require('process');
const { name } = require('ejs');

const app = express();
const PORT = process.env.PORT || 3000;


async function getServersForUser(userId) {
    try {
        // We use `include=servers` to tell Pterodactyl to give us the server data along with the user data.
        const response = await pteroApi.get(`/api/application/users/${userId}?include=servers`);
        return { success: true, servers: response.data.attributes.relationships.servers.data };
    } catch (error) {
        console.error("Error fetching servers for user:", error);
        return { success: false, message: 'Could not fetch server list.' };
    }
}

// --- 2. PTERODACTYL API CONFIGURATION ---
// This creates a reusable 'axios' instance for all our Pterodactyl API calls.
const pteroApi = axios.create({
    baseURL: process.env.PTERO_URL,
    headers: {
        'Authorization': `Bearer ${process.env.PTERO_API_KEY}`,
        'Accept': 'Application/vnd.pterodactyl.v1+json',
        'Content-Type': 'application/json'
    }
});


// --- 3. MIDDLEWARE CONFIGURATION ---
// EJS View Engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, client-side JS) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Body Parser to read data from HTML forms
app.use(express.urlencoded({ extended: false }));

// Express Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));

// Connect Flash middleware for messages
app.use(flash());

// Global Variables middleware - passes data to all templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null; // User session data
    res.locals.success_msg = req.flash('success_msg'); // Success messages
    res.locals.error_msg = req.flash('error_msg'); // Error messages
    next();
});


// --- 4. GAME PRICING DATA ---
// A simple object acting as our database for game plans.
// Easy to add new games and plans here.
const gamePlans = {
    minecraft_budget: {
        title: 'Minecraft Budget Plans',
        data: [
            { name: '𝗚𝗥𝗔𝗦𝗦', price: 30, popular: false, features: ['<strong>1GB</strong> DDR4 RAM', '<strong>50%</strong> CPU', '<strong>5GB</strong> Disk', '<strong>20</strong> Player Slots', 'Basic DDoS Protection'] },
            { name: '𝗗𝗜𝗥𝗧 𝗣𝗟𝗔𝗡', price: 60, popular: true, features: ['<strong>2GB</strong> DDR4 RAM', '<strong>80%</strong> CPU', '<strong>10GB</strong> Disk', '<strong>40</strong> Player Slots', 'Advanced DDoS Protection'] },
            { name: '𝗦𝗧𝗢𝗡𝗘 𝗣𝗟𝗔𝗡', price: 100, popular: false, features: ['<strong>3GB</strong> DDR4 RAM', '<strong>110% </strong>CPU', '<strong>15GB</strong> Disk', '<strong>Unlimited</strong> Player Slots', 'Advanced DDoS Protection', 'Dedicated IP Included'] },
            { name: '𝗜𝗥𝗢𝗡 𝗣𝗟𝗔𝗡', price: 130, popular: false, features: ['<strong> 4GB</strong> DDR4 RAM', '<strong>140% </strong>CPU', '<strong> 20GB</strong> Disk', '<strong>Unlimited</strong> Player Slots', 'Advanced DDoS Protection', 'Dedicated IP Included']},
            { name: '𝗚𝗢𝗟𝗗 𝗣𝗟𝗔𝗡', price: 180, popular: false, features: ['<strong> 5GB</strong> DDR4 RAM', '<strong>170% </strong>CPU', '<strong> 25GB</strong> Disk', '<strong>Unlimited</strong> Player Slots', 'Advanced DDoS Protection', 'Dedicated IP Included']},
            { name: '𝗗𝗜𝗔𝗠𝗢𝗡𝗗 𝗣𝗟𝗔𝗡', price: 250, popular: false, features: ['<strong> 6GB</strong> DDR4 RAM', '<strong>200% </strong>CPU', '<strong> 30GB</strong> Disk', '<strong>Unlimited</strong> Player Slots', 'Advanced DDoS Protection', 'Dedicated IP Included']}
        ]
    },
    minecraft_plans: {
        title: 'Minecraft Plans',
        data: [
            { name: '𝗚𝗥𝗔𝗦𝗦', price: 350, popular: false, features: ['<strong>8GB</strong> DDR4 RAM', '<strong>200%</strong> AMD 7 CPU', '<strong>20GB</strong> Disk', '<strong> Delhi,Singapore,Dubai </strong> Location'] },
            { name: '𝗜𝗥𝗢𝗡 𝗣𝗟𝗔𝗡', price: 60, popular: true, features: ['<strong>16GB</strong> DDR4 RAM', '<strong>400%</strong> AMD 7 CPU', '<strong>10GB</strong> Disk', '<strong>40</strong> Player Slots', 'Advanced DDoS Protection'] },
            { name: 'Gold 𝗣𝗟𝗔𝗡', price: 1250, popular: false, features: ['<strong>32GB</strong> DDR4 RAM', '<strong>800% </strong>AMD 7 CPU', '<strong>250GB</strong> Disk', '<strong>Delhi,Singapore,Dubai</strong> Location'] },
            { name: 'Diamond 𝗣𝗟𝗔𝗡', price: 1500, popular: false, features: ['<strong> 48GB</strong> DDR4 RAM', '<strong>1200% </strong>AMD 7 CPU', '<strong> 384GB</strong> Disk', '<strong> Delhi,Singapore,Dubai </strong> Location']},
            { name: 'Netherite Plan 𝗣𝗟𝗔𝗡', price: 1700, popular: false, features: ['<strong> 64GB</strong> DDR4 RAM', '<strong>2400% </strong>AMD 7 CPU', '<strong> 512GB</strong> Disk', '<strong>Delhi,Singapore,Dubai</strong> Location']}
        ]
    },
    offers: {
        title: 'Special Offers',
        data: [
            { name: 'Minecraft Server 6GB', price: 199, popular: false, features: ['<strong>6 gb</strong> RAM', '<strong>170%</strong> AMD RYZEN 7 CPU', '<strong>15gb</strong> DISK', '<strong> 1 </strong> Backup', '<spoiler> DRAGONOP</spoiler> For 10% Of'] },
            { name: 'Coming Soon More Offers', popular: false, features: [] }
        ]
    }
};


// --- 5. PTERODACTYL API HELPER FUNCTIONS ---
// Function to create a new user on the Pterodactyl Panel
async function createUserOnPterodactyl(email, username, firstName, lastName, password) {
    try {
        const response = await pteroApi.post('/api/application/users', {
            email: email,
            username: username,
            first_name: firstName,
            last_name: lastName,
            password: password,
        });
        return { success: true, data: response.data };
    } catch (error) {
        const errorDetail = error.response?.data?.errors?.[0]?.detail || 'An unknown error occurred creating the user.';
        return { success: false, message: errorDetail };
    }
}

// Function to find a user on Pterodactyl by their email
async function findUserOnPterodactyl(email) {
    try {
        const response = await pteroApi.get(`/api/application/users?filter[email]=${encodeURIComponent(email)}`);
        if (response.data.data.length > 0) {
            return { success: true, user: response.data.data[0] };
        }
        return { success: false, message: 'User not found.' };
    } catch (error) {
        return { success: false, message: 'Could not connect to the panel to verify user.' };
    }
}


// --- 6. WEBSITE ROUTES ---

// == Main Pages ==
app.get('/', (req, res) => res.render('index', { title: 'Home' }));
app.get('/contact', (req, res) => res.render('contact', { title: 'Contact' }));

// == Pricing Pages ==
app.get('/pricing', (req, res) => res.render('pricing-select', { title: 'Select Your Game' }));

app.get('/pricing/:game', (req, res) => {
    const game = req.params.game;
    const planData = gamePlans[game];

    if (!planData) {
        return res.redirect('/pricing'); // Use 'return' to prevent ERR_HTTP_HEADERS_SENT
    }

    res.render('pricing-game', {
        title: `${planData.title} Plans`,
        gameTitle: planData.title,
        plans: planData.data
    });
});

// == Authentication Pages ==
// Show Registration Page
app.get('/register', (req, res) => res.render('register', { title: 'Register' }));

// Handle Registration Form Submission
// Handle Registration Form Submission
app.post('/register', async (req, res) => {
    const { firstName, lastName, username, email, password } = req.body;
    
    // 1. Check if all fields are filled
    if (!firstName || !lastName || !username || !email || !password) {
        req.flash('error_msg', 'Please fill in all fields.');
        return res.redirect('/register');
    }

    // 2. NEW: Server-side username validation
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/; // Allows letters, numbers, _, ., -
    if (username.length < 3 || username.length > 30) {
        req.flash('error_msg', 'Username must be between 3 and 30 characters.');
        return res.redirect('/register');
    }
    if (!usernameRegex.test(username)) {
        req.flash('error_msg', 'Username contains invalid characters. Use only letters, numbers, dashes, underscores, and periods.');
        return res.redirect('/register');
    }
    if (!/^[a-zA-Z0-9]/.test(username) || !/[a-zA-Z0-9]$/.test(username)) {
        req.flash('error_msg', 'Username must start and end with a letter or number.');
        return res.redirect('/register');
    }

    // 3. If all validation passes, attempt to create the user
    const result = await createUserOnPterodactyl(email, username, firstName, lastName, password);

    if (result.success) {
        req.flash('success_msg', 'Registration successful! You can now log in.');
        res.redirect('/login');
    } else {
        req.flash('error_msg', result.message); // Show the error from Pterodactyl (e.g., "email already exists")
        res.redirect('/register');
    }
});


// Show Login Page
app.get('/login', (req, res) => res.render('login', { title: 'Login' }));

// Handle Login Form Submission
app.post('/login', async (req, res) => {
    const { email } = req.body;
    const result = await findUserOnPterodactyl(email);

    if (result.success) {
        req.session.user = result.user; // Store user data in session
        req.flash('success_msg', 'You are now logged in.');
        res.redirect('/dashboard');
    } else {
        req.flash('error_msg', 'No account found with that email.');
        res.redirect('/login');
    }
});

// Handle Logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/dashboard');
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.redirect('/');
    });
});

// == Protected Pages (Client Dashboard) ==
// Middleware to check if the user is logged in
function isLoggedIn(req, res, next) {
    if (req.session.user) {
        return next();
    }
    req.flash('error_msg', 'Please log in to view that resource.');
    res.redirect('/login');
}

app.get('/dashboard', isLoggedIn, async (req, res) => {
    const userId = req.session.user.attributes.id;
    const serverResult = await getServersForUser(userId);

    // We construct the full panel URL here to keep the EJS file clean
    const serversWithPanelUrl = serverResult.servers.map(server => {
        return {
            ...server,
            panel_url: `${process.env.PTERO_URL}/server/${server.attributes.uuid}`
        };
    });

    res.render('dashboard', {
        title: 'Dashboard',
        servers: serverResult.success ? serversWithPanelUrl : [] // Pass the servers to the template
    });
});


// --- 7. START THE SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});