import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { authFetch } from '../../utils/auth';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch users and courses in parallel
        const [usersResponse, coursesResponse] = await Promise.all([
          authFetch('/admin/users'),
          authFetch('/admin/courses')
        ]);

        const usersData = await usersResponse.json();
        const coursesData = await coursesResponse.json();
        
        setUsers(usersData);
        setCourses(coursesData);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate statistics
  const calculateStats = () => {
    if (!users.length) return { students: 0, teachers: 0, admins: 0 };
    
    const students = users.filter(user => user.role === 'student').length;
    const teachers = users.filter(user => user.role === 'teacher').length;
    const admins = users.filter(user => user.role === 'admin').length;
    
    return { students, teachers, admins };
  };

  const stats = calculateStats();

  if (loading) {
    return <div>Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Admin Dashboard</h1>
        <p className="dashboard-subtitle">
          System management and overview
        </p>
      </div>

      {/* System Stats Cards */}
      <h2>System Overview</h2>
      <div className="card-container">
        <div className="card">
          <h3 className="card-title">Total Students</h3>
          <div className="card-value">{stats.students}</div>
          <p>Registered students in the system</p>
        </div>
        
        <div className="card">
          <h3 className="card-title">Total Teachers</h3>
          <div className="card-value">{stats.teachers}</div>
          <p>Registered teachers in the system</p>
        </div>
        
        <div className="card">
          <h3 className="card-title">Courses</h3>
          <div className="card-value">{courses.length}</div>
          <p>Active courses in the system</p>
        </div>
        
        <div className="card">
          <h3 className="card-title">Administrators</h3>
          <div className="card-value">{stats.admins}</div>
          <p>System administrators</p>
        </div>
      </div>

      {/* Recent Users */}
      <h2>Recent Users</h2>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Last Login</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>
                  No users found
                </td>
              </tr>
            ) : (
              users.slice(0, 5).map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`status-badge status-${user.role === 'admin' ? 'present' : user.role === 'teacher' ? 'late' : 'absent'}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>{user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Recent Courses */}
      <h2>Recent Courses</h2>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Teacher</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center' }}>
                  No courses found
                </td>
              </tr>
            ) : (
              courses.slice(0, 5).map(course => (
                <tr key={course.id}>
                  <td>{course.code}</td>
                  <td>{course.name}</td>
                  <td>{course.teacher}</td>
                  <td>{new Date(course.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Quick Actions */}
      <h2>Administrative Functions</h2>
      <div className="card-container">
        <div className="card">
          <h3 className="card-title">User Management</h3>
          <p>Add, edit, or delete system users</p>
          <div className="card-footer">
            <Link to="/admin/users" className="btn">
              Manage Users
            </Link>
          </div>
        </div>
        
        <div className="card">
          <h3 className="card-title">Course Management</h3>
          <p>Create and manage courses</p>
          <div className="card-footer">
            <Link to="/admin/courses" className="btn">
              Manage Courses
            </Link>
          </div>
        </div>
        
        <div className="card">
          <h3 className="card-title">Attendance Reports</h3>
          <p>View system-wide attendance reports</p>
          <div className="card-footer">
            <Link to="/admin/reports" className="btn">
              View Reports
            </Link>
          </div>
        </div>
        
        <div className="card">
          <h3 className="card-title">System Settings</h3>
          <p>Configure system parameters and settings</p>
          <div className="card-footer">
            <Link to="/admin/settings" className="btn">
              System Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 