'use strict';

import express from 'express';
import path from 'path';
import session from 'express-session';
import cors from 'cors';
import bodyParser from 'body-parser';
import config from '../config/config.js'; // Ensure this is the correct path and name
import productRoutes from '../routes/product-routes.js';
import authRoutes from '../routes/auth-routes.js';
///import cartItemsRoutes from '../routes/cartRoutes.js';
///import { router as studentRoutes } from '../routes/student-routes.js';

const app = express();
const PORT = config.port || 3002;

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(path.resolve(), 'views/theme')); // Set views directory

// Middleware to serve static files (for public assets like CSS, JS)
app.use(express.static(path.join(path.resolve(), 'views/theme')));

// Middleware for parsing request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// Set session middleware
app.use(session({
    secret: 'yourSecretKey', // Change this to a strong secret
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 180 * 60 * 1000 }  // Session duration (3 hours in this case)
}));

// Middleware to set user variable for all requests
// Middleware to set user and session variable for GET requests only
const setUserForGet = (req, res, next) => {
    if (req.method === 'GET') {
        res.locals.user = req.session.userId ? { id: req.session.userId, isAuthenticated: true } : null;
        res.locals.errorMessage = req.session.errorMessage; // Pass error message to views
        req.session.errorMessage = null; // Clear the error message after passing it
    }
    next();
};

// Apply middleware for all GET requests
app.use(setUserForGet);


// Define routes
app.use('/', productRoutes);
app.use('/', authRoutes);
///app.use('/api/cart', cartItemsRoutes);
///app.use('/api', studentRoutes); // Use the student routes here

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
