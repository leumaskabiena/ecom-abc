import express from 'express';
import { placeOrder } from '../controllers/orderController.js';

const router = express.Router();

router.post('/sendOrder', placeOrder);

export default router;