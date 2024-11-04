// controllers/cartController.js
import { firestore } from '../config/db.js';
import {  getDoc, doc, addDoc, updateDoc, collection, query, where, getDocs, orderBy, limit  } from 'firebase/firestore';

// Middleware to set user variable for GET requests only
const setUserForGet = (req, res, next) => {
    if (req.method === 'GET') {
        res.locals.user = req.session.userId ? { id: req.session.userId, isAuthenticated: true } : null;
    }
    next();
};

// Utility function to get user or guest cart identifier
const getCartIdentifier = (req) => {
    if (req.session.userId) {
        return { userId: req.session.userId, isGuest: false };
    } else {
        if (!req.session.cartId) {
            req.session.cartId = Date.now(); // Generate a cart ID for guest users
        }
        return { cartId: req.session.cartId, isGuest: true };
    }
};

// Add to cart
export const addToCart = async (req, res) => {
    let { productId, quantity, size, color } = req.body;
    console.log('Server-side cartData received:', req.body);

    // Set default values for size and color if not provided
    size = size || "none";
    color = color || "none";

    // Validate input
    if (!productId || !quantity) {
        return res.status(400).json({ error: 'Invalid input', missing: !productId ? 'productId' : 'quantity' });
    }

    const { userId, cartId, isGuest } = getCartIdentifier(req);

    try {
        // Fetch the product directly by document ID
        const productRef = doc(firestore, 'products', productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const product = productSnap.data();

        // Check if product has enough stock
        if (product.stock < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        // Fetch or create user's cart
        const cartRef = collection(firestore, 'carts');
        const cartQuery = query(cartRef, where(isGuest ? 'guestId' : 'userId', '==', isGuest ? cartId : userId));
        const cartSnapshot = await getDocs(cartQuery);

        let totalItemsCount = 0; // Initialize total items count

        if (cartSnapshot.empty) {
            // If no cart exists, create a new cart entry
            await addDoc(cartRef, {
                [isGuest ? 'guestId' : 'userId']: isGuest ? cartId : userId,
                items: [{
                    productId,
                    quantity,
                    size,
                    color,
                }],
            });
            totalItemsCount = quantity; // Set count to the quantity added
            req.session.cartCount = totalItemsCount; // Store count in session
            return res.json({ message: 'Product added to cart', action: 'inserted', cartCount: totalItemsCount });
        } else {
            // Update existing cart item
            const cartItemDoc = cartSnapshot.docs[0];
            const cartData = cartItemDoc.data();

            // Find existing product in the cart with matching productId, size, and color
            const existingItemIndex = cartData.items.findIndex(
                item => item.productId === productId && item.size === size && item.color === color
            );

            if (existingItemIndex >= 0) {
                // If an item with the same productId, size, and color exists, update the quantity
                cartData.items[existingItemIndex].quantity += quantity;
            } else {
                // If it does not exist, add a new item
                cartData.items.push({ productId, quantity, size, color });
            }

            await updateDoc(cartItemDoc.ref, { items: cartData.items });

            // Calculate total items count
            totalItemsCount = cartData.items.reduce((total, item) => total + item.quantity, 0);
            req.session.cartCount = totalItemsCount; // Store count in session

            return res.json({ message: 'Product updated in cart', action: 'updated', cartCount: totalItemsCount });
        }
    } catch (error) {
        console.error('Add to cart error:', error.message);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};




// Get cart contents
export const getCartModalsContents = async (req, res) => {
    console.log('Starting getCartModalsContents function');

    try {
        const { userId, cartId, isGuest } = getCartIdentifier(req);
        console.log('Cart Identifier Details:', { userId, cartId, isGuest });

        const cartRef = collection(firestore, 'carts');
        const cartQuery = query(cartRef, where(isGuest ? 'guestId' : 'userId', '==', isGuest ? cartId : userId));
        console.log('Cart Query Details:', { field: isGuest ? 'guestId' : 'userId', value: isGuest ? cartId : userId });

        const cartSnapshot = await getDocs(cartQuery);
        console.log('Cart Snapshot:', { empty: cartSnapshot.empty, size: cartSnapshot.size, docs: cartSnapshot.docs.map(doc => doc.id) });

        let cartItems = [];
        let totalSum = 0;

        if (!cartSnapshot.empty) {
            const cartData = cartSnapshot.docs[0].data();
            console.log('Cart Data:', cartData);

            cartItems = Array.isArray(cartData.items) ? cartData.items : [];
            console.log('Cart Items:', cartItems);

            if (cartItems.length > 0) {
                const totalPromises = cartItems.map(async (item) => {
                    const productRef = doc(firestore, 'products', item.productId);
                    const productSnap = await getDoc(productRef);

                    if (!productSnap.exists()) {
                        console.log(`Product with ID ${item.productId} does not exist.`);
                        return { name: null, imageUrl: null, total: 0, qty:0 }; // Fallback if product doesn't exist
                    }

                    const productData = productSnap.data();
                    const productPrice = productData.price || 0; // Fallback
                    const productName = productData.name || 'Unknown Product'; // Fallback for name
                    const productCategory = productData.category || 'Unknown category'; // Fallback for name
                    const productImageUrl = productData.imageUrl || ''; // Fallback for Image URL
                    const productQty = item.quantity || 0; // Fallback
                    const itemTotal = productPrice * item.quantity;
                    const productColor = item.color || ''; // Fallback for name
                    const productSize = item.size || ''; // Fallback for name

                    console.log('Price Calculation:', {
                        productPrice,
                        quantity: item.quantity,
                        itemTotal
                    });

                    return {
                        name: productName,
                        imageUrl: productImageUrl,
                        total: itemTotal,
                        qty: productQty,
                        price:productPrice,
                        category:productCategory,
                        color:productColor,
                        size: productSize

                    };
                });

                // Wait for all promises to resolve and sum up total while collecting product details
                const totalArray = await Promise.all(totalPromises);

                // Calculate total sum
                totalSum = totalArray.reduce((sum, item) => sum + item.total, 0);

                // Extract product names and image URLs for rendering
                const productsDetails = totalArray.map(item => ({
                    name: item.name,
                    imageUrl: item.imageUrl,
                    qty: item.qty
                }));

                // Log total calculations and product details
                console.log('Total Calculations:', {
                    totalArray,
                    totalSum,
                    productsDetails
                });

                // Prepare cart items to render with product details
                cartItems = totalArray.map(item => ({
                    name: item.name,
                    imageUrl: item.imageUrl,
                    quantity: item.qty,
                    price: item.price,
                    category: item.category,
                    total: item.total,
                    size:item.size,
                    color:item.color
                }));

            } else {
                console.log('No items found in the cart.');
            }
        } else {
            console.log('No cart found for the given userId or cartId.');
        }

        console.log('Rendering Cart:', { cartItems, total: totalSum });
        res.render('partial/cart', { cartItems, total: parseFloat(totalSum.toFixed(2)) });

    } catch (error) {
        console.error('Get Cart Error:', { message: error.message, stack: error.stack, name: error.name });
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};


export const getShopingCart = async (req, res) => {
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

        const { userId, cartId, isGuest } = getCartIdentifier(req);
        console.log('Cart Identifier Details:', { userId, cartId, isGuest });

        const cartRef = collection(firestore, 'carts');
        const cartQuery = query(cartRef, where(isGuest ? 'guestId' : 'userId', '==', isGuest ? cartId : userId));
        console.log('Cart Query Details:', { field: isGuest ? 'guestId' : 'userId', value: isGuest ? cartId : userId });

        const cartSnapshot = await getDocs(cartQuery);
        console.log('Cart Snapshot:', { empty: cartSnapshot.empty, size: cartSnapshot.size, docs: cartSnapshot.docs.map(doc => doc.id) });

        let cartItems = [];
        let totalSum = 0;
        
        if (!cartSnapshot.empty) {
            const cartData = cartSnapshot.docs[0].data();
            console.log('Cart Data:', cartData);

            cartItems = Array.isArray(cartData.items) ? cartData.items : [];
            console.log('Cart Items:', cartItems);

            if (cartItems.length > 0) {
                // Remove duplicates by productId
                const uniqueCartItems = Array.from(new Map(cartItems.map(item => [item.productId, item])).values());
                console.log('Unique Cart Items:', uniqueCartItems);

                const totalPromises = uniqueCartItems.map(async (item) => {
                    const productRef = doc(firestore, 'products', item.productId);
                    const productSnap = await getDoc(productRef);

                    if (!productSnap.exists()) {
                        console.log(`Product with ID ${item.productId} does not exist.`);
                        return { name: null, imageUrl: null, total: 0, qty: 0 }; // Fallback if product doesn't exist
                    }

                    const productData = productSnap.data();
                    const productPrice = productData.price || 0; // Fallback
                    const productName = productData.name || 'Unknown Product'; // Fallback for name
                    const productCategory = productData.category || 'Unknown category'; // Fallback for name
                    const productImageUrl = productData.imageUrl || ''; // Fallback for Image URL
                    const productQty = item.quantity || 0; // Fallback
                    const itemTotal = productPrice * item.quantity;
                    const productColor = item.color || ''; // Fallback for name
                    const productSize = item.size || ''; // Fallback for name

                    console.log('Price Calculation:', {
                        productPrice,
                        quantity: item.quantity,
                        itemTotal
                    });

                    return {
                        name: productName,
                        imageUrl: productImageUrl,
                        total: itemTotal,
                        qty: productQty,
                        price: productPrice,
                        category: productCategory,
                        color: productColor,
                        size: productSize
                    };
                });

                // Wait for all promises to resolve and sum up total while collecting product details
                const totalArray = await Promise.all(totalPromises);

                // Calculate total sum
                totalSum = totalArray.reduce((sum, item) => sum + item.total, 0);

                // Extract product names and image URLs for rendering
                const productsDetails = totalArray.map(item => ({
                    name: item.name,
                    imageUrl: item.imageUrl,
                    qty: item.qty
                }));

                // Log total calculations and product details
                console.log('Total Calculations:', {
                    totalArray,
                    totalSum,
                    productsDetails
                });

                // Prepare cart items to render with product details
                cartItems = totalArray.map(item => ({
                    name: item.name,
                    imageUrl: item.imageUrl,
                    quantity: item.qty,
                    price: item.price,
                    category: item.category,
                    total: item.total,
                    size: item.size,
                    color: item.color
                }));

            } else {
                console.log('No items found in the cart.');
            }
        } else {
            console.log('No cart found for the given userId or cartId.');
        }

        // Render the page with the data
        res.render('layout', {
            title: 'Shoping Cart',
            currentPage: 'shoping-cart',
            cartItems,
            total: parseFloat(totalSum.toFixed(2)),
            products,
            categories,
            categoriesAll,
            randomProduct,
            bodyPathProducts: 'partial/products.ejs',
            bodyPathForm: 'partial/shoping-cart.ejs',
            productErrors: [],
            product: {}
        });
    } catch (err) {
        console.error('Error fetching create product page:', err.message);
        res.status(500).json({ error: err.message });
    }
};




// Get cart contents
export const getCartContents = async (req, res) => {
    const { userId, cartId, isGuest } = getCartIdentifier(req);

    try {
        const cartRef = collection(firestore, 'carts');
        const cartItemQuery = query(cartRef, where(isGuest ? 'guestId' : 'userId', '==', isGuest ? cartId : userId));
        const cartSnapshot = await getDocs(cartItemQuery);

        const cartItems = cartSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        res.json({ cartItems, total });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update cart item
export const updateCartItem = async (req, res) => {
    const { itemId } = req.params;
    const { quantity, size, color } = req.body;

    const { userId, cartId, isGuest } = getCartIdentifier(req);

    try {
        const cartRef = collection(firestore, 'carts');
        const cartItemDoc = await doc(cartRef, itemId);
        const cartItemData = (await getDoc(cartItemDoc)).data();

        if (!cartItemData) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        // Check stock here if needed
        if (cartItemData.stock < quantity) {
            return res.status(400).json({ error: 'Not enough stock' });
        }

        await updateDoc(cartItemDoc, { quantity, size, color });
        res.json({ message: 'Cart updated' });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Remove item from cart
export const removeCartItem = async (req, res) => {
    const { itemId } = req.params;
    const { userId, cartId, isGuest } = getCartIdentifier(req);

    try {
        const cartRef = collection(firestore, 'carts');
        const cartItemDoc = await doc(cartRef, itemId);
        await deleteDoc(cartItemDoc);
        res.json({ message: 'Item removed from cart' });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Clear cart
export const clearCart = async (req, res) => {
    const { userId, cartId, isGuest } = getCartIdentifier(req);

    try {
        const cartRef = collection(firestore, 'carts');
        const cartItemsQuery = query(cartRef, where(isGuest ? 'guestId' : 'userId', '==', isGuest ? cartId : userId));
        const cartSnapshot = await getDocs(cartItemsQuery);

        const batch = writeBatch(firestore);
        cartSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        res.json({ message: 'Cart cleared' });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


