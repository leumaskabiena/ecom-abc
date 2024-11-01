import express from 'express';
import { 
    getAllProducts, 
    createProduct, 
    getCreateProductPage, 
    getCreateCategoryPage, 
    createCategory, 
    getProductDetails ,
    getAbout
} from '../controllers/productController.js'; // Ensure this path is correct
import { isAuthenticated } from '../controllers/auth.js'; // Adjust if necessary

const router = express.Router();

// Route to get all products (homepage)
router.get('/', getAllProducts);

// Route to get create product page
router.get('/create-product', isAuthenticated, getCreateProductPage);

// POST route for creating a product
router.post('/create-product', isAuthenticated, createProduct);

// Route to get create category page
router.get('/create-category', isAuthenticated,  getCreateCategoryPage);

// POST route for creating a category
router.post('/create-category', isAuthenticated, createCategory);

// Route to get product details by ID
router.get('/details/:id', getProductDetails);

// route for about
router.get ('/about', getAbout);

// Exporting the router
export default router;


