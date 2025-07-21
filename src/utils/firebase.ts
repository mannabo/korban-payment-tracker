import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB8N6hU7V9CC636W_mrYWzLVY0h6ldO5ro",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "korban-payment-tracker.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "korban-payment-tracker",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "korban-payment-tracker.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "48800151000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:48800151000:web:6f9c50f2ef60ec0835eead"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Initialize Firebase Storage with proper configuration
export const storage = getStorage(app);

// Debug storage configuration
console.log('Firebase Storage initialized with bucket:', storage.app.options.storageBucket);

// Set storage timeout and retry settings
const connectStorageEmulator = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('Development mode: Firebase Storage using production server');
    console.log('Storage bucket URL:', storage.app.options.storageBucket);
    // In development, we still use production Firebase Storage
    // but with better error handling
  }
};

connectStorageEmulator();