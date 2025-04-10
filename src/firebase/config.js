import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "cgpa-calculator-new-ce209.firebaseapp.com",
  projectId: "cgpa-calculator-new-ce209",
  storageBucket: "cgpa-calculator-new-ce209.firebasestorage.app",
  messagingSenderId: "935877576411",
  appId: "1:935877576411:web:0199bb8c2e723074606efe"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);