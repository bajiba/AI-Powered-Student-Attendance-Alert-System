import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStudentAttendance, getStudentCourses } from '../../utils/api';

const StudentDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch courses and attendance in parallel
        const [coursesData, attendanceData] = await Promise.all([
          getStudentCourses(),
          getStudentAttendance()
        ]);
        
        setCourses(coursesData);
        setAttendanceRecords(attendanceData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate attendance statistics
  const calculateStats = () => {
    if (!attendanceRecords.length) return { total: 0, present: 0, absent: 0, late: 0, rate: 0 };
    
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(record => record.status === 'present').length;
    const absent = attendanceRecords.filter(record => record.status === 'absent').length;
    const late = attendanceRecords.filter(record => record.status === 'late').length;
    const rate = (present / total) * 100;
    
    return { total, present, absent, late, rate: rate.toFixed(1) };
  };

  const stats = calculateStats();
  const recentAttendance = attendanceRecords.slice(0, 5);

  if (loading) {
    return <div>Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Student Dashboard</h1>
        <p className="dashboard-subtitle">
          Welcome to your attendance portal
        </p>
      </div>

      {/* Attendance Stats Cards */}
      <h2>Attendance Overview</h2>
      <div className="card-container">
        <div className="card">
          <h3 className="card-title">Attendance Rate</h3>
          <div className="card-value">{stats.rate}%</div>
          <p>Overall attendance percentage</p>
        </div>
        
        <div className="card">
          <h3 className="card-title">Present</h3>
          <div className="card-value">{stats.present}</div>
          <p>Classes attended</p>
        </div>
        
        <div className="card">
          <h3 className="card-title">Absent</h3>
          <div className="card-value">{stats.absent}</div>
          <p>Classes missed</p>
        </div>
        
        <div className="card">
          <h3 className="card-title">Late</h3>
          <div className="card-value">{stats.late}</div>
          <p>Late arrivals</p>
        </div>
      </div>

      {/* Recent Attendance */}
      <h2>Recent Attendance</h2>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Course</th>
              <th>Status</th>
              <th>Verification</th>
            </tr>
          </thead>
          <tbody>
            {recentAttendance.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center' }}>
                  No attendance records found
                </td>
              </tr>
            ) : (
              recentAttendance.map(record => (
                <tr key={record.id}>
                  <td>{new Date(record.timestamp).toLocaleDateString()}</td>
                  <td>{record.course_name}</td>
                  <td>
                    <span className={`status-badge status-${record.status}`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </td>
                  <td>{record.verified_by_teacher ? 'Verified' : 'Pending'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Enrolled Courses */}
      <h2>My Courses</h2>
      <div className="card-container">
        {courses.length === 0 ? (
          <p>You are not enrolled in any courses yet.</p>
        ) : (
          courses.map(course => (
            <div className="card" key={course.id}>
              <h3 className="card-title">{course.name}</h3>
              <p>{course.code}</p>
              <p>Instructor: {course.teacher}</p>
              <div className="card-footer">
                <Link to={`/student/course/${course.id}`} className="btn">
                  View Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <h2>Quick Actions</h2>
      <div className="card-container">
        <div className="card">
          <h3 className="card-title">Mark Attendance</h3>
          <p>Scan a QR code to mark your attendance for current class</p>
          <div className="card-footer">
            <Link to="/student/scan-qr" className="btn">
              Scan QR
            </Link>
          </div>
        </div>
        
        <div className="card">
          <h3 className="card-title">View Full History</h3>
          <p>View your complete attendance history</p>
          <div className="card-footer">
            <Link to="/student/history" className="btn">
              View History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard; 