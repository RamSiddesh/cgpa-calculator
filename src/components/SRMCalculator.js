import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import './CGPACalculator.css';

const gradePoints = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'U': 0,
  'RA': 0
};

const subjectCredits = {
  'English': 3,
  'M1': 4,
  'PPS': 4,
  'EEE': 4,
  'Semiconductors Physics': 5,
  'EGD': 2,
  'M2': 4,
  'Biology': 2,
  'PoE': 2,
  'Chemistry': 5,
  'Japanese': 3,
  'OODP': 3,
  'Civil': 2
};

const SRMCalculator = ({ onBack }) => {
  const initialSemesterId = Date.now();
  const [semesters, setSemesters] = useState([{
    id: initialSemesterId,
    number: 1,
    subjects: [{ id: Date.now() + 1, name: '', grade: '', credits: '' }],
    cgpa: null
  }]);
  const [overallCGPA, setOverallCGPA] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = (user) => {
      setIsLoading(true);
      try {
        const docRef = doc(db, 'users', user.uid);
        
        const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
          const defaultSrmState = {
            semesters: [{ id: Date.now(), number: 1, subjects: [{ id: Date.now() + 1, name: '', grade: '', credits: '' }], cgpa: null }],
            overallCGPA: null
          };
          if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData && userData.srmData) {
              const srmSemesters = userData.srmData.semesters;
              if (srmSemesters && srmSemesters.length > 0) {
                const mappedSemesters = srmSemesters.map((semester, semIdx) => {
                  let subjectsToSet;
                  if (semester.subjects && semester.subjects.length > 0) {
                    subjectsToSet = semester.subjects.map((subject, subIdx) => ({
                      id: subject.id != null ? subject.id : (Date.now() + semIdx * 10000 + subIdx + 1),
                      name: subject.name || '',
                      grade: subject.grade || '',
                      credits: subject.credits || ''
                    }));
                  } else {
                    subjectsToSet = [{ id: Date.now() + semIdx * 10000 + 1000, name: '', grade: '', credits: '' }];
                  }
                  return {
                    ...semester,
                    id: semester.id != null ? semester.id : (Date.now() - semIdx * 100000 - 500000), // Ensure distinct base for semester IDs
                    number: semester.number != null ? semester.number : semIdx + 1,
                    subjects: subjectsToSet,
                    cgpa: semester.cgpa !== undefined ? semester.cgpa : null
                  };
                });
                setSemesters(mappedSemesters);
                setOverallCGPA(userData.srmData.overallCGPA !== undefined ? userData.srmData.overallCGPA : null);
              } else {
                setSemesters(defaultSrmState.semesters);
                setOverallCGPA(defaultSrmState.overallCGPA);
              }
            } else {
              setSemesters(defaultSrmState.semesters);
              setOverallCGPA(defaultSrmState.overallCGPA);
            }
          } else {
            setSemesters(defaultSrmState.semesters);
            setOverallCGPA(defaultSrmState.overallCGPA);
          }
          setIsLoading(false);
        }, (error) => {
          console.error('Error loading SRM data:', error);
          const defaultSrmStateOnError = {
            semesters: [{ id: Date.now(), number: 1, subjects: [{ id: Date.now() + 1, name: '', grade: '', credits: '' }], cgpa: null }],
            overallCGPA: null
          };
          setSemesters(defaultSrmStateOnError.semesters);
          setOverallCGPA(defaultSrmStateOnError.overallCGPA);
          setIsLoading(false);
        });
        
        return unsubscribeSnapshot;
      } catch (error) {
        console.error('Error setting up SRM data listener:', error);
        setIsLoading(false);
        return () => {};
      }
    };
    
    let unsubscribeAuthListener = null;
    let unsubscribeSnapshotListener = null;
    
    unsubscribeAuthListener = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (unsubscribeSnapshotListener) unsubscribeSnapshotListener();
        unsubscribeSnapshotListener = loadUserData(user);
      } else {
        const defaultSrmStateOnLogout = {
          semesters: [{ id: Date.now(), number: 1, subjects: [{ id: Date.now() + 1, name: '', grade: '', credits: '' }], cgpa: null }],
          overallCGPA: null
        };
        setSemesters(defaultSrmStateOnLogout.semesters);
        setOverallCGPA(defaultSrmStateOnLogout.overallCGPA);
        setIsLoading(false);
        if (unsubscribeSnapshotListener) unsubscribeSnapshotListener();
      }
    });
    
    return () => {
      if (unsubscribeAuthListener) unsubscribeAuthListener();
      if (unsubscribeSnapshotListener) unsubscribeSnapshotListener();
    };
  }, []);

  // Add these handler functions before handleCalculate
  const handleAddSemester = () => {
    const newSemesterId = Date.now();
    const nextSemesterNumber = semesters.length > 0 ? Math.max(...semesters.map(s => s.number)) + 1 : 1;
    setSemesters([
      ...semesters,
      {
        id: newSemesterId,
        number: nextSemesterNumber,
        subjects: [{ id: Date.now() + 1, name: '', grade: '', credits: '' }],
        cgpa: null
      }
    ]);
  };

  const handleRemoveSemester = (id) => {
    setSemesters(prevSemesters => prevSemesters.filter(sem => sem.id !== id));
    setOverallCGPA(null); 
  };

  const handleAddSubject = (semesterId) => {
    setSemesters(semesters.map(semester => {
      if (semester.id === semesterId && semester.subjects.length < 10) {
        return {
          ...semester,
          subjects: [
            ...semester.subjects,
            { id: Date.now(), name: '', grade: '', credits: '' }
          ]
        };
      }
      return semester;
    }));
  };

  const handleRemoveSubject = (semesterId, subjectId) => {
    setSemesters(prevSemesters =>
      prevSemesters.map(semester => {
        if (semester.id === semesterId && semester.subjects.length > 1) {
          return {
            ...semester,
            subjects: semester.subjects.filter(subject => subject.id !== subjectId),
            cgpa: null // Semester CGPA becomes stale
          };
        }
        return semester;
      })
    );
    setOverallCGPA(null); // Overall CGPA also becomes stale
  };

  const handleInputChange = (semesterId, subjectId, field, value) => {
    setSemesters(prevSemesters =>
      prevSemesters.map(semester => {
        if (semester.id === semesterId) {
          return {
            ...semester,
            subjects: semester.subjects.map(subject => {
              if (subject.id === subjectId) {
                if (field === 'name') {
                  const newCredits = subjectCredits.hasOwnProperty(value) ? subjectCredits[value].toString() : '';
                  return { ...subject, name: value, credits: newCredits };
                }
                // For 'grade' field
                return { ...subject, [field]: value };
              }
              return subject;
            }),
            cgpa: null // Mark semester CGPA as stale
          };
        }
        return semester;
      })
    );
    setOverallCGPA(null); // Mark overall CGPA as stale
  };

  const handleCalculate = async () => {
    const updatedSemesters = semesters.map(semester => {
      let totalPoints = 0;
      let totalCredits = 0;
  
      semester.subjects.forEach(subject => {
        if (subject.name && subject.grade && subject.credits) { // Ensure basic fields are present
          const creditsNum = parseFloat(subject.credits);
          const gradePoint = gradePoints[subject.grade];
          // Ensure credits is a valid positive number and gradePoint is defined
          if (gradePoint !== undefined && !isNaN(creditsNum) && creditsNum > 0) {
            totalCredits += creditsNum;
            totalPoints += (gradePoint * creditsNum);
          }
        }
      });
  
      return {
        ...semester,
        cgpa: totalCredits ? (totalPoints / totalCredits).toFixed(2) : null
      };
    });
  
    let overallPoints = 0;
    let overallCredits = 0;
    updatedSemesters.forEach(semester => {
      semester.subjects.forEach(subject => {
        if (subject.name && subject.grade && subject.credits) { // Ensure basic fields are present
          const creditsNum = parseFloat(subject.credits);
          const gradePoint = gradePoints[subject.grade];
          // Ensure credits is a valid positive number and gradePoint is defined
          if (gradePoint !== undefined && !isNaN(creditsNum) && creditsNum > 0) {
            overallCredits += creditsNum;
            overallPoints += (gradePoint * creditsNum);
          }
        }
      });
    });
  
    const newOverallCGPA = overallCredits ? (overallPoints / overallCredits).toFixed(2) : null;
    
    setSemesters(updatedSemesters);
    setOverallCGPA(newOverallCGPA);

    if (auth.currentUser) {
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        
        let retryCount = 0;
        const maxRetries = 3;
        
        const saveData = async () => {
          try {
            await setDoc(docRef, {
              srmData: { 
                semesters: updatedSemesters, 
                overallCGPA: newOverallCGPA, 
                updatedAt: new Date().toISOString()
              }
            }, { merge: true });
            console.log('SRM data saved successfully');
          } catch (error) {
            console.error(`Error saving SRM data (attempt ${retryCount + 1}):`, error);
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying... (${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              return saveData();
            } else {
              throw error; 
            }
          }
        };
        
        await saveData();
      } catch (error) {
        console.error('Fatal error saving SRM data:', error);
        alert('Failed to save your data. Please check your connection and try again.');
      }
    } else {
      console.warn('Attempted to save data while not logged in');
    }
  };

  // Modified handleReset
  const handleReset = async () => {
    const resetData = [{
      id: Date.now(),
      number: 1,
      subjects: [{ id: Date.now() + 1, name: '', grade: '', credits: '' }],
      cgpa: null
    }];

    setSemesters(resetData);
    setOverallCGPA(null);

    try {
      if (auth.currentUser) {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          srmData: {
            semesters: resetData,
            overallCGPA: null,
            updatedAt: new Date().toISOString()
          }
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error resetting SRM data:', error);
    }
  };

  // Add loading state
  if (isLoading) {
    return <div className="calculator-container">Loading...</div>;
  }

  return (
    <div className="calculator-container">
      <div className="calculator-card">
        <div className="header-container">
          {/* <h1>SRM-CGPA Calculator</h1> */}
          {/* <button className="back-btn" onClick={onBack}>EXIT</button> */}
        </div>

        {semesters.map(semester => (
          <div key={semester.id} className="semester-container">
            <div className="semester-header">
              <h2>Semester {semester.number}</h2>
              {semesters.length > 1 && (
                <button className="remove-btn" onClick={() => handleRemoveSemester(semester.id)}>×</button>
              )}
            </div>

            <div className="subjects-container">
              <div className="subject-header">
                <span>Subject Name</span>
                <span>Grade</span>
                <span>Credits</span>
              </div>
              
              {semester.subjects.map(subject => (
                <div key={subject.id} className="subject-row">
                  <select
                    className="subject-select"
                    value={subject.name || ''}
                    onChange={(e) => {
                      const selectedSubject = e.target.value;
                      handleInputChange(semester.id, subject.id, 'name', selectedSubject);
                    }}
                  >
                    <option value="">Select Subject</option>
                    {Object.keys(subjectCredits).map(subjectName => (
                      <option key={subjectName} value={subjectName}>
                        {subjectName}
                      </option>
                    ))}
                  </select>
                  <select
                    className="subject-select"
                    value={subject.grade || ''}
                    onChange={(e) => handleInputChange(semester.id, subject.id, 'grade', e.target.value)}
                  >
                    <option value="">Select Grade</option>
                    {Object.keys(gradePoints).map(grade => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={subject.credits || ''}
                    readOnly
                    className="subject-input"
                  />
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveSubject(semester.id, subject.id)}
                    disabled={semester.subjects.length === 1}
                  >×</button>
                </div>
              ))}
            </div>

            {semester.subjects.length < 10 && (
              <button className="action-btn add-btn" onClick={() => handleAddSubject(semester.id)}>
                Add Subject
              </button>
            )}

            {semester.cgpa !== null && (
              <div className="semester-result">
                <h3>Semester CGPA: {semester.cgpa}</h3>
              </div>
            )}
          </div>
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
      </div>
    </div>
  );
};

export default SRMCalculator;