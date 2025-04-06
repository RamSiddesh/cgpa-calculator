import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Copy and paste your config from Firebase Console here
  apiKey: "AIzaSyAw7bBPJP1x3DGVPW7q_LzHn8A5hTRWIrM",
  authDomain: "cgpa-calculator-381d2.firebaseapp.com",
  projectId: "cgpa-calculator-381d2",
  storageBucket: "cgpa-calculator-381d2.firebasestorage.app",
  messagingSenderId: "526949063848",
  appId: "1:526949063848:web:8cdb889676b4f99139769d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);