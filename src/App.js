import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import CGPACalculator from './components/CGPACalculator';
import Login from './components/Login';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveData = async (data) => {
    if (user) {
      try {
        await setDoc(doc(db, 'cgpa', user.uid), {
          semesters: data,
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error saving data:', error);
      }
    }
  };

  const handleLogout = () => {
    auth.signOut();
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      {user ? (
        <div className="authenticated">
          <button onClick={handleLogout} className="logout-btn">Logout</button>
          <CGPACalculator onSave={handleSaveData} />
        </div>
      ) : (
        <Login onLogin={() => {}} />
      )}
    </div>
  );
}

export default App;
