import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import CGPACalculator from './components/CGPACalculator';
import SRMCalculator from './components/SRMCalculator'; // Import SRMCalculator
import Login from './components/Login';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculatorType, setCalculatorType] = useState('cgpa'); // 'cgpa' or 'srm'

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
          <header className="app-header">
            <h1 className="app-title">{calculatorType === 'cgpa' ? 'CGPA Calculator' : 'SRM Calculator'}</h1>
            <div className="app-header-buttons">
              <button onClick={() => setCalculatorType(calculatorType === 'cgpa' ? 'srm' : 'cgpa')} className="srm-btn">
                {calculatorType === 'cgpa' ? 'SRM' : 'CGPA'}
              </button>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </header>
          {calculatorType === 'cgpa' ? (
            <CGPACalculator onSave={handleSaveData} />
          ) : (
            <SRMCalculator onBack={() => setCalculatorType('cgpa')} />
          )}
        </div>
      ) : (
        <Login onLogin={() => {}} />
      )}
    </div>
  );
}

export default App;
