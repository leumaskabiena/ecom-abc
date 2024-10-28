// routes/cartRoutes.js
import express from 'express';
import { 
    addToCart,
    getCartContents,
    updateCartItem,
    removeCartItem,
    clearCart
} from '../controllers/cartController.js';

const router = express.Router();

// Middleware to set user variable for GET requests only
const setUserForGet = (req, res, next) => {
    if (req.method === 'GET') {
        res.locals.user = req.session.userId ? { id: req.session.userId, isAuthenticated: true } : null;
    }
    next();
};

// Apply middleware for all GET requests
router.use(setUserForGet);

// Routes
router.post('/add', addToCart);
router.get('/', getCartContents);
router.put('/:itemId', updateCartItem);
router.delete('/:itemId', removeCartItem);
router.delete('/', clearCart);

export default router;
