import React, { useState, useEffect } from 'react';
import { calculateCGPA } from '../utils/gradeUtils';
import './CGPACalculator.css';

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
          <span>Action</span>
        </div>
        {semester.subjects.map(subject => (
          <div key={subject.id} className="subject-row">
            <input
              type="text"
              placeholder="Subject Name"
              value={subject.name}
              onChange={(e) => handleInputChange(subject.id, 'name', e.target.value)}
            />
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

  const handleCalculate = () => {
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
        <h1>RAM'S CGPA CALCULATOR</h1>
        
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
      </div>
    </div>
  );
};

export default CGPACalculator;