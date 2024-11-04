import { firestore } from '../config/db.js'; // Ensure this path is correct
import { check, validationResult } from 'express-validator';
import { collection, getDocs, addDoc, doc, getDoc, query, where, orderBy, limit, deleteDoc, updateDoc  } from 'firebase/firestore';

// Fetch all products and related data for the homepage
export const getAllProducts = async (req, res) => {
    try {
        const productsSnapshot = await getDocs(collection(firestore, 'products'));
        const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const categoriesSnapshot = await getDocs(collection(firestore, 'categories'));
        const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch last items added by category
        const lastItems = await Promise.all(products.reduce((acc, product) => {
            if (!acc.includes(product.category)) {
                acc.push(product.category);
            }
            return acc;
        }, []).map(async (category) => {
            const lastItem = products.filter(product => product.category === category).pop();
            return lastItem ? { category, description: lastItem.description, imageUrl: lastItem.imageUrl } : null;
        }));

        res.render('layout', {
            title: 'Home',
            currentPage: 'home',
            products,
            categories,
            lastItems: lastItems.filter(item => item !== null), // Filter out nulls
            bodyPathProducts: 'partial/products.ejs',
            bodyPathForm: 'partial/index.ejs'
        });
    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Fetch the create product page
// Fetch products, categories, and last added items for the create product page
export const getCreateProductPage = async (req, res) => {
    try {
        // Calculate the timestamp for 1 hour ago
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        // Fetch products created within the last hour
        const productsRef = collection(firestore, 'products');
        const recentProductsQuery = query(productsRef, where('createdAt', '>=', oneHourAgo));
        const productsSnapshot = await getDocs(recentProductsQuery);
        const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Check if there are any products found
        const categoryNames = products.map(prod => prod.category).filter(Boolean); // Get category names from recent products

        // Fetch categories associated with recent products only if categoryNames is not empty
        const categories = [];
        if (categoryNames.length > 0) {
            const categoriesRef = collection(firestore, 'categories');
            const categoriesQuery = query(categoriesRef, where('name', 'in', categoryNames));
            const categoriesSnapshot = await getDocs(categoriesQuery);
            categories.push(...categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }

        // Fetch all categories
        const allCategoriesRef = collection(firestore, 'categories');
        const allCategoriesSnapshot = await getDocs(allCategoriesRef);
        const categoriesAll = allCategoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch a random product (you can modify this query if necessary)
        const randomProductQuery = query(productsRef, orderBy('createdAt'), limit(1));
        const randomProductSnapshot = await getDocs(randomProductQuery);
        const randomProduct = randomProductSnapshot.docs[0]?.data() || null;

        // Render the page with the data
        res.render('layout', {
            title: 'Create Product',
            currentPage: 'create-product',
            products,
            categories,
            categoriesAll,
            randomProduct,
            bodyPathProducts: 'partial/products.ejs',
            bodyPathForm: 'partial/create-product.ejs',
            productErrors: [],
            product: {}
        });
    } catch (err) {
        console.error('Error fetching create product page:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// Create a new product
export const createProduct = async (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.render('createProductAndCategory', {
            title: 'Create Product and Category',
            productErrors: errors.array(),
            categoryErrors: [],
            product: req.body,
            category: {}
        });
    }

    const { name, price, category, color, size, description, imageUrl } = req.body;
    try {
        await addDoc(collection(firestore, 'products'), {
            name,
            price,
            category,
            color,
            size,
            description,
            imageUrl,
            createdAt: new Date() // Add createdAt timestamp if needed
        });
        res.redirect('/create-product');
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).send('Error creating product');
    }
};

// Fetch the create category page
export const getCreateCategoryPage = async (req, res) => {
    try {
        // Fetch categories
        const categoriesSnapshot = await getDocs(collection(firestore, 'categories'));
        const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch products added in the last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const productsQuery = collection(firestore, 'products');
        const productsSnapshot = await getDocs(productsQuery);
        const products = productsSnapshot.docs
            .filter(doc => doc.data().createdAt.toDate() >= oneHourAgo)
            .map(doc => ({ id: doc.id, ...doc.data() }));

        // Get a random product
        const randomProduct = products[Math.floor(Math.random() * products.length)] || null;

        res.render('layout', {
            title: 'Create Product',
            currentPage: 'create-product',
            products,
            categories,
            randomProduct,
            bodyPathProducts: 'partial/products.ejs',
            bodyPathForm: 'partial/create-category.ejs',
            categoryErrors: [],
            category: {}
        });
    } catch (error) {
        console.error('Error fetching create category page:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Create a new category
export const createCategory = async (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.render('createProductAndCategory', {
            title: 'Create Product and Category',
            productErrors: [],
            categoryErrors: errors.array(),
            product: {},
            category: req.body
        });
    }

    // Log req.body to check incoming data
    console.log('Request body:', req.body);

    const name = req.body.categoryName;

    
    // Check if name is valid
    if (!name) {
        console.error('Name field is missing or undefined.');
        return res.status(400).send('Category name is required.');
    }

    try {
        await addDoc(collection(firestore, 'categories'), { name });
        res.redirect('/create-category');
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).send('Error creating category');
    }
};

// Fetch product details
export const getProductDetails = async (req, res) => {
    const productId = req.params.id;
    try {
        const docRef = doc(firestore, 'products', productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            let product = docSnap.data();

            // Process sizes if available
            if (product.size) {
                product.sizes = product.size.split(',').map(size => size.trim());
            }

            // Process colors if available
            if (product.color) {
                product.colors = product.color.split(',').map(color => color.trim());
            }

            // Add the document ID to the product object
            product.id = docSnap.id;
            console.log('Server-side cartData received:', product);
            // Render the product details modal with the updated product object
            res.render('partial/product-details-modal', { product });
        } else {
            res.status(404).send('Product not found');
        }
    } catch (error) {
        console.error('Error fetching product:', error.message);
        res.status(500).send('Error fetching product');
    }
};

// Fetch product details
export const getEditProduct = async (req, res) => {
    const productId = req.params.id;
    try {
        const docRef = doc(firestore, 'products', productId);
        const docSnap = await getDoc(docRef);
        // Fetch all categories
        const allCategoriesRef = collection(firestore, 'categories');
        const allCategoriesSnapshot = await getDocs(allCategoriesRef);
        const categoriesAll = allCategoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (docSnap.exists()) {
            let product = docSnap.data();

            // Process sizes if available
            if (product.size) {
                product.sizes = product.size.split(',').map(size => size.trim());
            }

            // Process colors if available
            if (product.color) {
                product.colors = product.color.split(',').map(color => color.trim());
            }

            // Add the document ID to the product object
            product.id = docSnap.id;
            console.log('Server-side cartData received:', product);

           


            // Render the product details modal with the updated product object
            res.render('partial/update-product', { 
                product,
                categoriesAll
            });
        } else {
            res.status(404).send('Product not found');
        }
    } catch (error) {
        console.error('Error fetching product:', error.message);
        res.status(500).send('Error fetching product');
    }
};


//Edit product based on ID
export const editProduct = async (req, res) => {
    const productId = req.params.id;
    const { name, price, category, size, color, description, imageUrl  } = req.body; // Adjust fields as necessary
    try {
        const productRef = doc(firestore, 'products', productId);

        // Check if the product exists before updating
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) {
            return res.status(404).send('Product not found');
        }

        // Prepare the updated product data
        const updatedData = {
            ...(name && { name }),
            ...(price && { price }),
            ...(category && { category }),
            ...(size && { size }), // Convert array to comma-separated string if size is provided
            ...(color && { color }), // Convert array to comma-separated string if color is provided
            ...(description && { description }),
            ...(imageUrl && { imageUrl }),
        };

        console.log('Server-side cartData to be updated :', updatedData);

        // Update the product document in Firestore
        await updateDoc(productRef, updatedData);

        // Redirect to the home page after a successful update
        res.redirect('/');
    } catch (error) {
        console.error('Error updating product:', error.message);
        res.status(500).send('Error updating product');
    }
};

//Delete Product based on ID
export const deleteProduct = async (req, res) => {
    const productId = req.params.id;
    try {
        const productRef = doc(firestore, 'products', productId);

        // Check if the product exists before deleting
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) {
            return res.status(404).send('Product not found');
        }

        // Delete the product document in Firestore
        await deleteDoc(productRef);

        res.status(200).send('Product deleted successfully');
    } catch (error) {
        console.error('Error deleting product:', error.message);
        res.status(500).send('Error deleting product');
    }
};


// Get registration page
export const getAbout = async (req, res) => {
    try {
        // Fetch products created within the last hour
        const productsRef = collection(firestore, 'products');
        const productsSnapshot = await getDocs(collection(firestore, 'products'));
        const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Fetch categories
        const categoriesSnapshot = await getDocs(collection(firestore, 'categories'));
        const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        
        // Fetch a random product (you can modify this query if necessary)
        const randomProductQuery = query(productsRef, orderBy('createdAt'), limit(1));
        const randomProductSnapshot = await getDocs(randomProductQuery);
        const randomProduct = randomProductSnapshot.docs[0]?.data() || null;

        res.render('layout', {
            title: 'About',
            currentPage: 'about',
            products,
            categories,
            bodyPathProducts: 'partial/products.ejs',
            bodyPathForm: 'partial/about.ejs',
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


