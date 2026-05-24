import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionAttendance, verifyStudentAttendance } from '../../utils/api';

const VerifyAttendance = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const attendanceData = await getSessionAttendance(sessionId);
        setStudents(attendanceData);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        setError('Failed to load attendance data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [sessionId]);

  const handleVerifyAttendance = async (attendanceId) => {
    try {
      setVerifying(true);
      setError('');
      setSuccess('');
      
      await verifyStudentAttendance(attendanceId);
      
      // Update the students array to reflect verification
      setStudents(students.map(student => {
        if (student.id === attendanceId) {
          return { ...student, verified: true };
        }
        return student;
      }));
      
      setSuccess('Attendance verified successfully');
    } catch (error) {
      console.error('Error verifying attendance:', error);
      setError(error.message || 'Failed to verify attendance. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyAll = async () => {
    try {
      setVerifying(true);
      setError('');
      setSuccess('');
      
      // Get all unverified attendance records
      const unverifiedAttendances = students.filter(student => !student.verified);
      
      // Verify each attendance one by one
      for (const student of unverifiedAttendances) {
        await verifyStudentAttendance(student.id);
      }
      
      // Update all students to verified
      setStudents(students.map(student => ({ ...student, verified: true })));
      
      setSuccess('All attendance records verified successfully');
    } catch (error) {
      console.error('Error verifying all attendance:', error);
      setError(error.message || 'Failed to verify all attendance records. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <div>Loading attendance data...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Verify Attendance</h1>
        <p className="dashboard-subtitle">
          Verify student attendance for this session
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Email</th>
              <th>Time</th>
              <th>Verification Method</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>
                  No attendance records found for this session
                </td>
              </tr>
            ) : (
              students.map(student => (
                <tr key={student.id}>
                  <td>{student.username}</td>
                  <td>{student.email}</td>
                  <td>{new Date(student.timestamp).toLocaleTimeString()}</td>
                  <td>{student.verification_method}</td>
                  <td>
                    {student.verified ? (
                      <span className="status-badge status-present">Verified</span>
                    ) : (
                      <span className="status-badge status-late">Pending</span>
                    )}
                  </td>
                  <td>
                    {!student.verified && (
                      <button 
                        onClick={() => handleVerifyAttendance(student.id)} 
                        className="btn"
                        disabled={verifying}
                      >
                        Verify
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {students.length > 0 && students.some(student => !student.verified) && (
        <div className="text-center" style={{ marginTop: '1rem' }}>
          <button 
            onClick={handleVerifyAll} 
            className="btn"
            disabled={verifying}
          >
            {verifying ? 'Verifying...' : 'Verify All'}
          </button>
        </div>
      )}

      <div className="text-center" style={{ marginTop: '2rem' }}>
        <button 
          onClick={() => navigate(`/teacher/generate-qr/${sessionId}`)} 
          className="btn"
          style={{ marginRight: '1rem' }}
        >
          Back to QR Code
        </button>
        <button 
          onClick={() => navigate('/teacher/dashboard')} 
          className="btn"
          style={{ background: 'transparent', color: '#3498db', border: 'none' }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default VerifyAttendance; 