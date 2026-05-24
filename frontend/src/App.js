import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import StudentDashboard from './components/student/Dashboard';
import TeacherDashboard from './components/teacher/Dashboard';
import AdminDashboard from './components/admin/Dashboard';
import ScanQR from './components/student/ScanQR';
import GenerateQR from './components/teacher/GenerateQR';
import VerifyAttendance from './components/teacher/VerifyAttendance';
import UserProfile from './components/UserProfile';
import NotFound from './components/NotFound';

// Auth utilities
import { getToken, removeToken, getUserRole } from './utils/auth';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = getToken();
    if (token) {
      setIsAuthenticated(true);
      setUserRole(getUserRole());
    }
    setLoading(false);
  }, []);

  const logout = () => {
    removeToken();
    setIsAuthenticated(false);
    setUserRole(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <Navbar isAuthenticated={isAuthenticated} userRole={userRole} logout={logout} />
        <main className="content">
          <Routes>
            {/* Public routes */}
            <Route 
              path="/" 
              element={
                isAuthenticated ? 
                  userRole === 'student' ? <Navigate to="/student/dashboard" /> :
                  userRole === 'teacher' ? <Navigate to="/teacher/dashboard" /> :
                  <Navigate to="/admin/dashboard" />
                : 
                  <Login setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole} />
              } 
            />
            <Route 
              path="/register" 
              element={!isAuthenticated ? <Register /> : <Navigate to="/" />} 
            />

            {/* Student routes */}
            <Route 
              path="/student/dashboard" 
              element={
                isAuthenticated && userRole === 'student' ? 
                  <StudentDashboard /> : 
                  <Navigate to="/" />
              } 
            />
            <Route 
              path="/student/scan-qr" 
              element={
                isAuthenticated && userRole === 'student' ? 
                  <ScanQR /> : 
                  <Navigate to="/" />
              } 
            />

            {/* Teacher routes */}
            <Route 
              path="/teacher/dashboard" 
              element={
                isAuthenticated && userRole === 'teacher' ? 
                  <TeacherDashboard /> : 
                  <Navigate to="/" />
              } 
            />
            <Route 
              path="/teacher/generate-qr/:sessionId" 
              element={
                isAuthenticated && userRole === 'teacher' ? 
                  <GenerateQR /> : 
                  <Navigate to="/" />
              } 
            />
            <Route 
              path="/teacher/verify/:sessionId" 
              element={
                isAuthenticated && userRole === 'teacher' ? 
                  <VerifyAttendance /> : 
                  <Navigate to="/" />
              } 
            />

            {/* Admin routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                isAuthenticated && userRole === 'admin' ? 
                  <AdminDashboard /> : 
                  <Navigate to="/" />
              } 
            />

            {/* Common authenticated routes */}
            <Route 
              path="/profile" 
              element={
                isAuthenticated ? 
                  <UserProfile /> : 
                  <Navigate to="/" />
              } 
            />

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App; 