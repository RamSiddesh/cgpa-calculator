import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { calculateCGPA } from '../utils/gradeUtils';
import './CGPACalculator.css';

// Add subject options array
const subjectOptions = [
  'M1', 'M2', 'English', 'Chemistry', 'Physics', 'EEE', 
  'C Program', 'Python', 'DS', 'Python Lab', 'DS Lab', 
  'Physics Lab', 'Chemistry Lab'
];

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

const CGPACalculator = () => {
  const [semesters, setSemesters] = useState([{
    id: 1,
    number: 1,
    subjects: [{ id: 1, name: '', marks: '', credits: '' }],
    cgpa: null
  }]);
  const [overallCGPA, setOverallCGPA] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Optimized useEffect hook
  useEffect(() => {
    const loadUserData = async () => {
      if (!auth.currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'cgpa', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.semesters && data.semesters.length > 0) {
            setSemesters(data.semesters);
            setOverallCGPA(data.overallCGPA);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();

    // Add auth state listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadUserData();
      }
    });

    return () => unsubscribe();
  }, []); // Remove auth.currentUser dependency

  // Add loading indicator in the return statement
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
        cgpa: calculateCGPA(validSubjects)
      };
    });

    const allSubjects = updatedSemesters.flatMap(sem => sem.subjects);
    const overallResult = calculateCGPA(allSubjects);

    setSemesters(updatedSemesters);
    setOverallCGPA(overallResult);

    // Save to Firebase
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'cgpa', auth.currentUser.uid), {
          semesters: updatedSemesters,
          overallCGPA: overallResult,
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error saving data:', error);
      }
    }
  };

  const handleReset = () => {
    setSemesters([{
      id: 1,
      number: 1,
      subjects: [{ id: 1, name: '', marks: '', credits: '' }],
      cgpa: null
    }]);
    setOverallCGPA(null);
  };

  return (
    <div className="calculator-container">
      <div className="calculator-card">
        <div className="header-container">
          <h1>CGPA Calculator</h1>
          <button className="logout-btn" onClick={() => auth.signOut()}>Logout</button>
        </div>
        
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
          <p>by ramsid :)</p>
        </div>
      </div>
    </div>
  );
};

export default CGPACalculator;