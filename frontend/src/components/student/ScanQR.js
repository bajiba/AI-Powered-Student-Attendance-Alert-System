import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { markAttendance } from '../../utils/api';

const ScanQR = () => {
  const navigate = useNavigate();
  const [verificationCode, setVerificationCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);

  // Get user's location
  useEffect(() => {
    const getLocation = () => {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser');
        setLocationLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationPermission(true);
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationPermission(false);
          setLocationLoading(false);
          
          if (error.code === 1) {
            setError('Location permission denied. Please enable location services to mark attendance.');
          } else {
            setError('Unable to get your location. Please try again.');
          }
        }
      );
    };

    getLocation();
  }, []);

  const handleCodeChange = (e) => {
    setVerificationCode(e.target.value.toUpperCase());
  };

  const handleSessionChange = (e) => {
    setSessionId(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    try {
      if (!verificationCode || !sessionId) {
        setError('Please enter both session ID and verification code');
        setLoading(false);
        return;
      }

      if (!locationPermission || !coordinates) {
        setError('Location access is required to mark attendance');
        setLoading(false);
        return;
      }

      // Attempt to mark attendance
      await markAttendance(sessionId, verificationCode, coordinates);
      setSuccess(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 2000);
    } catch (error) {
      setError(error.message || 'Failed to mark attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (locationLoading) {
    return <div>Accessing your location...</div>;
  }

  return (
    <div className="auth-container">
      <h2 className="form-title">Mark Attendance</h2>
      
      {!locationPermission && (
        <div className="alert alert-warning">
          <p>Location permission is required to mark attendance.</p>
          <button 
            className="btn" 
            style={{ marginTop: '10px' }}
            onClick={() => window.location.reload()}
          >
            Enable Location
          </button>
        </div>
      )}
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">Attendance marked successfully! Redirecting to dashboard...</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="sessionId" className="form-label">Session ID</label>
          <input
            type="text"
            id="sessionId"
            name="sessionId"
            className="form-control"
            value={sessionId}
            onChange={handleSessionChange}
            placeholder="Enter the session ID"
            required
            disabled={loading || success || !locationPermission}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="verificationCode" className="form-label">Verification Code</label>
          <input
            type="text"
            id="verificationCode"
            name="verificationCode"
            className="form-control"
            value={verificationCode}
            onChange={handleCodeChange}
            placeholder="Enter the verification code"
            maxLength={6}
            required
            disabled={loading || success || !locationPermission}
          />
        </div>
        
        {coordinates && (
          <div className="form-group">
            <p><strong>Your current location:</strong></p>
            <p>Latitude: {coordinates.latitude.toFixed(6)}</p>
            <p>Longitude: {coordinates.longitude.toFixed(6)}</p>
          </div>
        )}
        
        <button 
          type="submit" 
          className="btn btn-block" 
          disabled={loading || success || !locationPermission}
        >
          {loading ? 'Marking Attendance...' : 'Mark Attendance'}
        </button>
      </form>
      
      <div className="text-center" style={{ marginTop: '1rem' }}>
        <button 
          onClick={() => navigate('/student/dashboard')} 
          className="btn"
          style={{ background: 'transparent', color: '#3498db', border: 'none' }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ScanQR; 