import { initializeApp } from 'firebase/app'; 
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'; 
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'; 

// Make sure your API key is properly configured 
const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;

if (!apiKey) {
  console.error("CRITICAL: Firebase API Key is missing. Please ensure REACT_APP_FIREBASE_API_KEY is set in your environment variables.");
  // Depending on the app's desired behavior, you might want to prevent further Firebase initialization
  // or throw an error here to stop the app from running in a broken state.
}

const firebaseConfig = { 
  apiKey: apiKey, // API key is now sourced only from environment variable
  authDomain: "cgpa-calculator-new-ce209.firebaseapp.com", 
  projectId: "cgpa-calculator-new-ce209", 
  storageBucket: "cgpa-calculator-new-ce209.firebasestorage.app", 
  messagingSenderId: "935877576411", 
  appId: "1:935877576411:web:0199bb8c2e723074606efe" 
}; 

const app = initializeApp(firebaseConfig); 
export const auth = getAuth(app); 

// Set persistence to LOCAL for better offline support 
setPersistence(auth, browserLocalPersistence) 
  .then(() => { 
    console.log("Auth persistence set to LOCAL"); 
  }) 
  .catch((error) => { 
    console.error("Error setting auth persistence:", error); 
  }); 

export const db = getFirestore(app); 

// Enable offline persistence for Firestore 
enableIndexedDbPersistence(db) 
  .then(() => { 
    console.log("Firestore persistence enabled"); 
  }) 
  .catch((err) => { 
    if (err.code === 'failed-precondition') { 
      console.error("Multiple tabs open, persistence can only be enabled in one tab at a time"); 
    } else if (err.code === 'unimplemented') { 
      console.error("The current browser doesn't support all of the features required for Firestore persistence"); 
    } 
  });