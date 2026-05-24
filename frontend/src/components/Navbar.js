import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ isAuthenticated, userRole, logout }) => {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        AI Attendance System
      </Link>
      
      <ul className="navbar-nav">
        {isAuthenticated ? (
          <>
            {userRole === 'student' && (
              <>
                <li className="nav-item">
                  <Link to="/student/dashboard" className="nav-link">
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/student/scan-qr" className="nav-link">
                    Scan QR
                  </Link>
                </li>
              </>
            )}
            
            {userRole === 'teacher' && (
              <>
                <li className="nav-item">
                  <Link to="/teacher/dashboard" className="nav-link">
                    Dashboard
                  </Link>
                </li>
              </>
            )}
            
            {userRole === 'admin' && (
              <>
                <li className="nav-item">
                  <Link to="/admin/dashboard" className="nav-link">
                    Dashboard
                  </Link>
                </li>
              </>
            )}
            
            <li className="nav-item">
              <Link to="/profile" className="nav-link">
                Profile
              </Link>
            </li>
            
            <li className="nav-item">
              <button onClick={logout} className="logout-btn">
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li className="nav-item">
              <Link to="/" className="nav-link">
                Login
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/register" className="nav-link">
                Register
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar; 