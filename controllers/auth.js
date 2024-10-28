import { getDoc, doc } from 'firebase/firestore';
import { firestore } from '../config/db.js';// Ensure this imports your Firestore instance correctly

const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/login'); // Redirect to login if not authenticated
};

const isAdmin = async (req, res, next) => {
    if (req.session.userId) {
        // Check if the user is an admin in Firestore
        try {
            const userDoc = await getDoc(doc(firestore, 'users', req.session.userId)); // Adjust the collection name if needed
            
            if (!userDoc.exists()) {
                return res.redirect('/login'); // Redirect to login if user not found
            }

            const user = userDoc.data();
            if (user.isAdmin) { // Assuming `isAdmin` is a field in the `users` collection
                return next();
            } else {
                return res.status(403).send('You do not have permission to create products');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            return res.redirect('/login'); // Redirect to login on error
        }
    } else {
        res.redirect('/login'); // Redirect to login if not authenticated
    }
};

// Export both middleware functions
export {
    isAuthenticated,
    isAdmin
};
