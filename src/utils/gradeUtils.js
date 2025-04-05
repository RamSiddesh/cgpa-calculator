export const calculateGradePoint = (marks) => {
  if (marks >= 90) return 10;
  if (marks >= 80) return 9;
  if (marks >= 70) return 8;
  if (marks >= 60) return 7;
  if (marks >= 50) return 6;
  if (marks >= 45) return 5;
  if (marks >= 40) return 4;
  return 0;
};

export const calculateCGPA = (subjects) => {
  if (!subjects.length) return 0;
  
  const totalCredits = subjects.reduce((sum, subject) => sum + Number(subject.credits), 0);
  const totalGradePoints = subjects.reduce((sum, subject) => {
    return sum + (calculateGradePoint(subject.marks) * Number(subject.credits));
  }, 0);
  
  return totalCredits ? (totalGradePoints / totalCredits).toFixed(2) : 0;
};