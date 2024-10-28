// controllers/cartController.js
import { firestore } from '../config/db.js';
import { collection, addDoc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';

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
    const { productId, quantity, size, color } = req.body;

    if (!productId || !quantity) {
        return res.status(400).json({ error: 'Invalid input', missing: !productId ? 'productId' : 'quantity' });
    }

    const { userId, cartId, isGuest } = getCartIdentifier(req);

    try {
        const productRef = collection(firestore, 'products');
        const productQuery = query(productRef, where('id', '==', productId));
        const productSnapshot = await getDocs(productQuery);

        if (productSnapshot.empty) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const product = productSnapshot.docs[0].data();

        // Assuming product has a stock field
        if (product.stock < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        const cartRef = collection(firestore, 'carts');
        const cartItemRef = query(cartRef, where(isGuest ? 'guestId' : 'userId', '==', isGuest ? cartId : userId));
        const cartSnapshot = await getDocs(cartItemRef);

        if (cartSnapshot.empty) {
            // Insert new cart item
            await addDoc(cartRef, {
                [isGuest ? 'guestId' : 'userId']: isGuest ? cartId : userId,
                productId,
                quantity,
                size,
                color,
            });
            return res.json({ message: 'Product added to cart', action: 'inserted' });
        } else {
            // Update existing cart item
            const cartItemDoc = cartSnapshot.docs[0];
            await updateDoc(cartItemDoc.ref, {
                quantity: cartItemDoc.data().quantity + quantity,
                size,
                color,
            });
            return res.json({ message: 'Product updated in cart', action: 'updated' });
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Server error' });
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
