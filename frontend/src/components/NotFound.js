import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h1 style={{ fontSize: '6rem', marginBottom: '1rem', color: '#2c3e50' }}>404</h1>
      <h2 style={{ marginBottom: '2rem', color: '#2c3e50' }}>Page Not Found</h2>
      <p style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>
        The page you are looking for might have been removed, had its name changed,
        or is temporarily unavailable.
      </p>
      <Link to="/" className="btn">
        Return to Homepage
      </Link>
    </div>
  );
};

export default NotFound; 