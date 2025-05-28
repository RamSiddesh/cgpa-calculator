import React, { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore'; // Updated: removed getDoc, added onSnapshot
import { db, auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth'; // Added this import
// SRMCalculator import removed as it will be handled in App.js
// Removed: import Semester from './Semester'; as it's defined below
import './CGPACalculator.css';

// Removed unused subjectOptions variable

// Replace the subjectOptions array with this subjectCredits object
const subjectCredits = {
  'M1': 3,
  'M2': 3,
  'English': 3,
  'Chemistry': 3,
  'Physics': 3,
  'EEE': 3,
  'C Program': 4,
  'Python': 4,
  'DS': 3,
  'ED': 2,
  'DS Lab': 2,
  'Physics Lab': 1,
  'Chemistry Lab': 1
};

const Semester = ({ semester, onUpdate, onRemove }) => {
  const handleAddSubject = () => {
    const newSubjects = [
      ...semester.subjects,
      { id: semester.subjects.length + 1, name: '', marks: '', credits: '' }
    ];
    onUpdate({ ...semester, subjects: newSubjects });
  };

  const handleRemoveSubject = (id) => {
    if (semester.subjects.length > 1) {
      const newSubjects = semester.subjects.filter(subject => subject.id !== id);
      onUpdate({ ...semester, subjects: newSubjects });
    }
  };

  const handleInputChange = (id, field, value) => {
    // Show popup for lab subjects that need conversion to 100-point scale
    if (field === 'name' && (value === 'Physics Lab' || value === 'Chemistry Lab')) {
      alert('Convert it to 100 and enter the mark');
    }
    
    const newSubjects = semester.subjects.map(subject => {
      if (subject.id === id) {
        // If the field is 'name', auto-fill credits
        if (field === 'name' && subjectCredits[value]) {
          return { 
            ...subject, 
            [field]: value,
            credits: subjectCredits[value].toString()
          };
        }
        return { ...subject, [field]: value };
      }
      return subject;
    });
    onUpdate({ ...semester, subjects: newSubjects });
  };

  return (
    <div className="semester-container">
      <div className="semester-header">
        <h2>Semester {semester.number}</h2>
        {semester.number > 1 && (
          <button className="remove-btn" onClick={() => onRemove(semester.id)}>×</button>
        )}
      </div>
      
      <div className="subjects-container">
        <div className="subject-header">
          <span>Subject Name</span>
          <span>Marks</span>
          <span>Credits</span>
        </div>
        {semester.subjects.map(subject => (
          <div key={subject.id} className="subject-row">
            <select
              className="subject-select"
              value={subject.name}
              onChange={(e) => handleInputChange(subject.id, 'name', e.target.value)}
            >
              <option value="">Select Subject</option>
              {Object.keys(subjectCredits).map((subjectName, index) => (
                <option key={index} value={subjectName}>
                  {subjectName}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Marks"
              value={subject.marks}
              onChange={(e) => handleInputChange(subject.id, 'marks', e.target.value)}
              min="0"
              max="100"
            />
            <input
              type="number"
              placeholder="Credits"
              value={subject.credits}
              onChange={(e) => handleInputChange(subject.id, 'credits', e.target.value)}
              min="1"
              max="6"
            />
            <button 
              className="remove-btn"
              onClick={() => handleRemoveSubject(subject.id)}
              disabled={semester.subjects.length === 1}
            >×</button>
          </div>
        ))}
      </div>

      <button className="action-btn add-btn" onClick={handleAddSubject}>
        Add Subject
      </button>

      {semester.cgpa !== null && (
        <div className="semester-result">
          <h3>Semester CGPA: {semester.cgpa}</h3>
        </div>
      )}
    </div>
  );
};

const CGPACalculator = ({ onSave }) => {
  const [semesters, setSemesters] = useState([
    { id: 1, number: 1, subjects: [{ id: 1, name: '', marks: '', credits: '' }], cgpa: null }
  ]);
  const [overallCGPA, setOverallCGPA] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Added isLoading state
  // calculatorType state removed as it will be handled in App.js

  useEffect(() => {
    const loadUserData = (user) => {
      setIsLoading(true);
      try {
        const docRef = doc(db, 'users', user.uid);
        
        const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
          const defaultSemesters = [{ id: 1, number: 1, subjects: [{id: 1, name: '', marks: '', credits: ''}], cgpa: null }];
          if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.marksData) {
              const loadedSemesters = (userData.marksData.semesters && userData.marksData.semesters.length > 0)
                ? userData.marksData.semesters.map(semester => ({
                    ...semester,
                    subjects: semester.subjects ? semester.subjects.map(subject => ({
                      ...subject,
                      marks: subject.marks || '',
                      credits: subject.credits || ''
                    })) : [{id: 1, name: '', marks: '', credits: ''}]
                  }))
                : defaultSemesters;
              setSemesters(loadedSemesters);
              setOverallCGPA(userData.marksData.overallCGPA || null);
            } else {
              setSemesters(defaultSemesters);
              setOverallCGPA(null);
            }
          } else {
            setSemesters(defaultSemesters);
            setOverallCGPA(null);
          }
          setIsLoading(false);
        }, (error) => {
          console.error('Error loading marks data:', error);
          const defaultSemestersOnError = [{ id: 1, number: 1, subjects: [{id: 1, name: '', marks: '', credits: ''}], cgpa: null }];
          setSemesters(defaultSemestersOnError);
          setOverallCGPA(null);
          setIsLoading(false);
        });
        
        return unsubscribeSnapshot;
      } catch (error) {
        console.error('Error setting up data listener:', error);
        setIsLoading(false);
        return () => {};
      }
    };
    
    let unsubscribeAuth = null;
    let unsubscribeSnapshot = null;
    
    unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (unsubscribeSnapshot) unsubscribeSnapshot();
        unsubscribeSnapshot = loadUserData(user);
      } else {
        const defaultSemestersOnLogout = [{ id: 1, number: 1, subjects: [{id: 1, name: '', marks: '', credits: ''}], cgpa: null }];
        setSemesters(defaultSemestersOnLogout);
        setOverallCGPA(null);
        setIsLoading(false);
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
    });
    
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="calculator-container">
        <div className="calculator-card">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  const handleAddSemester = () => {
    setSemesters([
      ...semesters,
      {
        id: semesters.length + 1,
        number: semesters.length + 1,
        subjects: [{ id: 1, name: '', marks: '', credits: '' }],
        cgpa: null
      }
    ]);
  };

  const handleRemoveSemester = (id) => {
    setSemesters(semesters.filter(sem => sem.id !== id));
  };

  const handleUpdateSemester = (updatedSemester) => {
    setSemesters(semesters.map(sem => 
      sem.id === updatedSemester.id ? updatedSemester : sem
    ));
  };

  const handleCalculate = async () => {
    const updatedSemesters = semesters.map(semester => {
      const validSubjects = semester.subjects.filter(
        subject => subject.name && 
        !isNaN(subject.marks) && 
        subject.marks >= 0 && 
        subject.marks <= 100 &&
        !isNaN(subject.credits) &&
        subject.credits > 0
      );
      
      return {
        ...semester,
        cgpa: calculateGradePointsForMarksBasedCGPA(validSubjects) // Use defined helper function
      };
    });
  
    const allValidSubjectsForOverall = updatedSemesters.reduce((acc, sem) => {
        const validSubjectsInSem = sem.subjects.filter(
            subject => subject.name &&
            !isNaN(subject.marks) &&
            subject.marks >= 0 &&
            subject.marks <= 100 &&
            !isNaN(subject.credits) &&
            subject.credits > 0
        );
        return acc.concat(validSubjectsInSem);
    }, []);

    const overallResult = calculateGradePointsForMarksBasedCGPA(allValidSubjectsForOverall); // Use defined helper function
  
    setSemesters(updatedSemesters);
    setOverallCGPA(overallResult);
  
    // Save to Firebase with proper data structure
    if (auth.currentUser) {
      try {
        const marksData = { // Changed variable name and structure
          semesters: updatedSemesters.map(sem => ({
            ...sem,
            subjects: sem.subjects.map(sub => ({
              id: sub.id,
              name: sub.name,
              marks: sub.marks,
              credits: sub.credits
            }))
          })),
          overallCGPA: overallResult,
          updatedAt: new Date().toISOString()
        };
  
        await setDoc(doc(db, 'users', auth.currentUser.uid), { marksData }, { merge: true }); // Save under marksData and use merge:true
        console.log('Marks data saved successfully');
      } catch (error) {
        console.error('Error saving marks data:', error);
      }
    }
  };

  const handleReset = async () => {
    setSemesters([{
      id: 1,
      number: 1,
      subjects: [{ id: 1, name: '', marks: '', credits: '' }],
      cgpa: null
    }]);
    setOverallCGPA(null);
  
    // Clear data from Firebase
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          marksData: { // Clear under marksData
            semesters: [],
            overallCGPA: null,
            updatedAt: new Date().toISOString()
          }
        }, { merge: true }); // Use merge:true
        console.log('Marks data cleared successfully');
      } catch (error) {
        console.error('Error clearing marks data:', error);
      }
    }
  };

  return (
    <div className="calculator-container">
      <div className="calculator-card">
          <>
            {/* Header container with title and buttons removed */}
            
            {semesters.map(semester => (
              <Semester
                key={semester.id}
                semester={semester}
                onUpdate={handleUpdateSemester}
                onRemove={handleRemoveSemester}
              />
            ))}

            <div className="button-group">
              <button className="action-btn add-btn" onClick={handleAddSemester}>
                Add Semester
              </button>
              <button className="action-btn calculate-btn" onClick={handleCalculate}>
                Calculate CGPA
              </button>
              <button className="action-btn reset-btn" onClick={handleReset}>
                Reset
              </button>
            </div>

            {overallCGPA !== null && (
              <div className="overall-result">
                <h2>Overall CGPA: {overallCGPA}</h2>
              </div>
            )}

            <div className="footer">
              <p></p>
            </div>
          </>
        {/* Conditional rendering for SRMCalculator removed */}
      </div>
    </div>
  );
};

export default CGPACalculator;

// Helper function to calculate CGPA based on marks
const calculateGradePointsForMarksBasedCGPA = (subjects) => {
  let totalPoints = 0;
  let totalCredits = 0;

  subjects.forEach(subject => {
    // Ensure subject has valid marks and credits before processing
    if (subject.name && subject.marks && subject.credits) {
      const marksNum = parseFloat(subject.marks);
      const creditsNum = parseFloat(subject.credits);
      let gradePoint = 0;

      // Check if marksNum is a valid number between 0 and 100
      if (!isNaN(marksNum) && marksNum >= 0 && marksNum <= 100) {
        if (marksNum >= 90) gradePoint = 10;
        else if (marksNum >= 80) gradePoint = 9;
        else if (marksNum >= 70) gradePoint = 8;
        else if (marksNum >= 60) gradePoint = 7;
        else if (marksNum >= 50) gradePoint = 6;
        else gradePoint = 0; // Marks below 50 get 0 grade points
      }

      // Check if creditsNum is a valid positive number and gradePoint is determined
      if (!isNaN(creditsNum) && creditsNum > 0) {
        totalCredits += creditsNum;
        totalPoints += (gradePoint * creditsNum);
      }
    }
  });

  return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : null;
};