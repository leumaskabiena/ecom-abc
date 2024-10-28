import { firestore } from '../config/db.js'; // Assuming you have Firebase setup
import { query, collection, getDocs, where, orderBy, limit, addDoc } from 'firebase/firestore';
import bcrypt from 'bcrypt';

// Get login page
export const getLoginPage = async (req, res) => {
    try {
        // Fetch products created within the last hour
        const productsRef = collection(firestore, 'products');
        const productsSnapshot = await getDocs(collection(firestore, 'products'));
        const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const categoriesSnapshot = await getDocs(collection(firestore, 'categories'));
        const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch a random product (you can modify this query if necessary)
        const randomProductQuery = query(productsRef, orderBy('createdAt'), limit(1));
        const randomProductSnapshot = await getDocs(randomProductQuery);
        const randomProduct = randomProductSnapshot.docs[0]?.data() || null;

        res.render('layout', {
            title: 'Login',
            currentPage: 'login',
            products,
            categories,
            randomProduct,
            bodyPathProducts: 'partial/products.ejs',
            bodyPathForm: 'partial/login.ejs'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Post login
export const postLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const usersRef = collection(firestore, 'users');
        const userQuery = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(userQuery);

        if (querySnapshot.empty) {
            req.session.errorMessage = 'Invalid email or password';
            return res.redirect('/login');
        }

        const user = querySnapshot.docs[0].data();
        const userId = querySnapshot.docs[0].id;

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.session.errorMessage = 'Invalid email or password';
            return res.redirect('/login');
        }

        // Store user info in session
        req.session.userId = userId;
        req.session.userName = user.name;

        res.redirect('/'); // Redirect to a protected page after login
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).send('Internal server error');
    }
};

// Get registration page
export const getRegisterPage = async (req, res) => {
    try {
        // Fetch products created within the last hour
        const productsRef = collection(firestore, 'products');
        const productsSnapshot = await getDocs(collection(firestore, 'products'));
        const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const categoriesSnapshot = await getDocs(collection(firestore, 'categories'));
        const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch a random product (you can modify this query if necessary)
        const randomProductQuery = query(productsRef, orderBy('createdAt'), limit(1));
        const randomProductSnapshot = await getDocs(randomProductQuery);
        const randomProduct = randomProductSnapshot.docs[0]?.data() || null;

        res.render('layout', {
            title: 'Register',
            currentPage: 'register',
            products,
            categories,
            randomProduct,
            bodyPathProducts: 'partial/products.ejs',
            bodyPathForm: 'partial/register.ejs'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Post registration
export const postRegister = async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    let errors = [];

    if (!name || !email || !password || !confirmPassword) {
        errors.push({ msg: 'Please fill in all fields' });
    }

    if (password !== confirmPassword) {
        errors.push({ msg: 'Passwords do not match' });
    }

    if (password.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' });
    }

    if (errors.length > 0) {
        res.render('layout', {
            title: 'Register',
            currentPage: 'register',
            bodyPathForm: 'partial/register.ejs',
            errors,
            name,
            email,
            password,
            confirmPassword
        });
    } else {
        try {
            const usersRef = collection(firestore, 'users');
            const userQuery = query(usersRef, where('email', '==', email));
            const querySnapshot = await getDocs(userQuery);

            if (!querySnapshot.empty) {
                errors.push({ msg: 'Email is already registered' });
                return res.render('layout', {
                    title: 'Register',
                    currentPage: 'register',
                    bodyPathForm: 'partial/register.ejs',
                    errors,
                    name,
                    email,
                    password,
                    confirmPassword
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await addDoc(usersRef, { name, email, password: hashedPassword });

            res.redirect('/login');
        } catch (err) {
            console.error('Error registering user:', err);
            res.status(500).send('Error registering user');
        }
    }
};


// Logout user


export const logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('/'); // Redirect to login page after logout
    });
};
