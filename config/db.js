import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import config from './config.js'; // Ensure the path is correct

const app = initializeApp(config.firebaseConfig);
const firestore = getFirestore(app); // Initialize Firestore

export { firestore }; // Export Firestore instance
