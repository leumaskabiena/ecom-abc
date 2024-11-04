import MessagingUtility from '../config/messaging-utility.js';
import { validationResult } from 'express-validator';
import { firestore } from '../config/db.js';
import { getDoc, doc, addDoc, updateDoc, collection, query, where, getDocs, orderBy, limit, deleteDoc } from 'firebase/firestore';

// Initialize MessagingUtility with your Gmail credentials
const messaging = new MessagingUtility(
    'leumaskabiena@gmail.com',
    'wdvl itbf rots ohpt'
);

// Rest of your utility functions remain the same
const getCartIdentifier = (req) => {
    if (req.session.userId) {
        return { userId: req.session.userId, isGuest: false };
    } else {
        if (!req.session.cartId) {
            req.session.cartId = Date.now();
        }
        return { cartId: req.session.cartId, isGuest: true };
    }
};

export const placeOrder = async (req, res) => {
    console.log('Starting placeOrder function');

    try {
        const { userId, cartId, isGuest } = getCartIdentifier(req);
        console.log('Cart Identifier Details:', { userId, cartId, isGuest });
    
        const cartRef = collection(firestore, 'carts');
        const cartQuery = query(cartRef, where(isGuest ? 'guestId' : 'userId', '==', isGuest ? cartId : userId));
        const cartSnapshot = await getDocs(cartQuery);
        console.log('Cart Snapshot:', { empty: cartSnapshot.empty, size: cartSnapshot.size });
    
        let cartItems = [];
        let totalSum = 0;
    
        if (!cartSnapshot.empty) {
            const cartData = cartSnapshot.docs[0].data();
            const cartDocId = cartSnapshot.docs[0].id;
            cartItems = Array.isArray(cartData.items) ? cartData.items : [];
    
            if (cartItems.length > 0) {
                const uniqueCartItems = Array.from(new Map(cartItems.map(item => [item.productId, item])).values());
                const totalPromises = uniqueCartItems.map(async (item) => {
                    const productRef = doc(firestore, 'products', item.productId);
                    const productSnap = await getDoc(productRef);
    
                    if (!productSnap.exists()) {
                        console.log(`Product with ID ${item.productId} does not exist.`);
                        return { name: null, total: 0, qty: 0 };
                    }
    
                    const productData = productSnap.data();
                    const productPrice = productData.price || 0;
                    const itemTotal = productPrice * item.quantity;
    
                    return {
                        name: productData.name,
                        total: itemTotal,
                        qty: item.quantity,
                        price: productPrice,
                        category: productData.category,
                        color: item.color || '',
                        size: item.size || ''
                    };
                });
    
                const totalArray = await Promise.all(totalPromises);
                totalSum = totalArray.reduce((sum, item) => sum + item.total, 0);
    
                cartItems = totalArray.map(item => ({
                    name: item.name,
                    quantity: item.qty,
                    price: item.price,
                    category: item.category,
                    total: item.total,
                    size: item.size,
                    color: item.color
                }));
            }
        }
    
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
    
        const { name, phone, email } = req.body;
    
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }
    
        const emailSubject = `New Order from ${name}`;
        const emailBody = 
        `Total Price: R ${totalSum.toFixed(2)}\n` +
        cartItems.map((item, index) => {
            // Log item details to confirm price and quantity
            console.log(`Processing item #${index + 1}`, item);

            const itemName = item.name || 'Unknown';
            const itemQuantity = item.quantity || 1;
            const itemPrice = Number(item.price) || 0;  // Ensures item.price is a number or defaults to 0

            console.log(`Item Details:`, { itemName, itemQuantity, itemPrice });

            return `Order #${index + 1}:\n` +
                `Name: ${itemName}\n` +
                `Quantity: ${itemQuantity}\n` +
                `Price: R ${itemPrice.toFixed(2)}\n` +  // Formats price to 2 decimal places
                `Category: ${item.category || 'N/A'}\n` +
                `Size: ${item.size || 'N/A'}\n` +
                `Color: ${item.color || 'N/A'}\n` +
                `=====================\n`;
        }).join('') +
        `Time: ${new Date().toLocaleString()}`;

    
        const emailResult = await messaging.sendEmail(email, emailSubject, emailBody);
        if (!emailResult.success) {
            console.error('Email sending failed:', emailResult.error);
        }
    
        let whatsappResult = null;
        if (phone) {
            if (messaging.isWhatsAppReady()) {
                whatsappResult = await messaging.sendWhatsAppMessage(
                    phone,
                    `Hello ${name}, Thank you for your order!\n\nOrder Details:\n${emailBody}`
                );
    
                if (!whatsappResult.success && whatsappResult.queued) {
                    console.log('WhatsApp message queued - client not ready');
                } else if (!whatsappResult.success) {
                    console.error('WhatsApp sending failed:', whatsappResult.error);
                }
            } else {
                console.log('WhatsApp is not ready yet. Please scan the QR code in the server console.');
                whatsappResult = {
                    success: false,
                    error: 'WhatsApp client not ready. Please try again in a few moments.'
                };
            }
        }
    
        if (cartSnapshot.docs.length > 0) {
            const cartDocRef = doc(firestore, 'carts', cartSnapshot.docs[0].id);
            await deleteDoc(cartDocRef);
            console.log('Cart deleted successfully after order placement');
        }
    
        // Set a session message for the successful order
        req.session.message = 'Order placed successfully!';
    
        // Redirect to home page
        res.redirect('/');
    
    } catch (error) {
        console.error('Error processing order:', error);
        res.status(500).json({
            success: false,
            error: 'Error processing your request. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
    
};