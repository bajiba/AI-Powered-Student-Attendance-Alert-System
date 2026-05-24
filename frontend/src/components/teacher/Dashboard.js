import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTeacherCourses, getCourseSessions } from '../../utils/api';

const TeacherDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch teacher's courses
        const coursesData = await getTeacherCourses();
        setCourses(coursesData);
        
        // Get upcoming sessions for each course
        if (coursesData.length > 0) {
          const sessionsPromises = coursesData.map(course => getCourseSessions(course.id));
          const sessionsResults = await Promise.all(sessionsPromises);
          
          // Flatten the sessions array and sort by start time
          const allSessions = [].concat(...sessionsResults)
            .filter(session => new Date(session.start_time) > new Date()) // Only future sessions
            .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
            .slice(0, 5); // Get only 5 upcoming sessions
          
          setUpcomingSessions(allSessions);
        }
      } catch (error) {
        console.error('Error fetching teacher data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Teacher Dashboard</h1>
        <p className="dashboard-subtitle">
          Manage your courses and track student attendance
        </p>
      </div>

      {/* My Courses */}
      <h2>My Courses</h2>
      <div className="card-container">
        {courses.length === 0 ? (
          <p>You are not assigned to any courses yet.</p>
        ) : (
          courses.map(course => (
            <div className="card" key={course.id}>
              <h3 className="card-title">{course.name}</h3>
              <p>{course.code}</p>
              <p>{course.students_count || 0} students enrolled</p>
              <div className="card-footer">
                <Link to={`/teacher/course/${course.id}`} className="btn">
                  Manage Course
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upcoming Sessions */}
      <h2>Upcoming Sessions</h2>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Course</th>
              <th>Room</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {upcomingSessions.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>
                  No upcoming sessions found
                </td>
              </tr>
            ) : (
              upcomingSessions.map(session => {
                const startDate = new Date(session.start_time);
                const endDate = new Date(session.end_time);
                const course = courses.find(c => c.id === session.course_id);
                
                return (
                  <tr key={session.id}>
                    <td>{startDate.toLocaleDateString()}</td>
                    <td>
                      {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                      {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>{course ? course.name : 'Unknown Course'}</td>
                    <td>{session.room || 'Not specified'}</td>
                    <td>
                      <Link to={`/teacher/generate-qr/${session.id}`} className="btn">
                        Generate Code
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Quick Actions */}
      <h2>Quick Actions</h2>
      <div className="card-container">
        <div className="card">
          <h3 className="card-title">Attendance Reports</h3>
          <p>View and download attendance reports for your courses</p>
          <div className="card-footer">
            <Link to="/teacher/reports" className="btn">
              View Reports
            </Link>
          </div>
        </div>
        
        <div className="card">
          <h3 className="card-title">Attendance Verification</h3>
          <p>Verify student attendance for previous sessions</p>
          <div className="card-footer">
            <Link to="/teacher/verify" className="btn">
              Verify Attendance
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard; 