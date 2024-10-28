import express from 'express';
import { getLoginPage, postLogin, getRegisterPage, postRegister, logout } from '../controllers/authController.js';
import { isAuthenticated } from '../controllers/auth.js'; 

const router = express.Router();

// Login routes
router.get('/login', getLoginPage);
router.post('/login', postLogin);

// Registration routes
router.get('/register', isAuthenticated, getRegisterPage);
router.post('/register', isAuthenticated, postRegister);

// Logout route
router.post('/logout', logout);
router.get('/logout', logout);


export default router;
