import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { generateVerificationCode, getCourseSessions } from '../../utils/api';

const GenerateQR = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [verificationCode, setVerificationCode] = useState('');
  const [expiryTime, setExpiryTime] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  // Fetch session details
  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        // This is a simplified approach - in a real app, you'd have a dedicated API
        // to get a single session details rather than all sessions
        const courseId = 1; // This would come from the session details in a real app
        const sessions = await getCourseSessions(courseId);
        const sessionDetails = sessions.find(s => s.id.toString() === sessionId);
        
        if (sessionDetails) {
          setSession(sessionDetails);
        } else {
          setError('Session not found');
        }
      } catch (error) {
        console.error('Error fetching session details:', error);
        setError('Failed to load session details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionId]);

  // Countdown timer for code expiry
  useEffect(() => {
    if (!expiryTime) return;

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(expiryTime);
      const diff = expiry - now;
      
      if (diff <= 0) {
        setTimeLeft(null);
        setVerificationCode('');
        setExpiryTime(null);
        return;
      }
      
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
    };

    // Update immediately
    updateTimer();
    
    // Then update every second
    const timerId = setInterval(updateTimer, 1000);
    
    return () => clearInterval(timerId);
  }, [expiryTime]);

  const handleGenerateCode = async () => {
    try {
      setError('');
      setGenerating(true);
      
      const response = await generateVerificationCode(sessionId);
      setVerificationCode(response.code);
      setExpiryTime(response.expires_at);
    } catch (error) {
      console.error('Error generating code:', error);
      setError(error.message || 'Failed to generate verification code. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div>Loading session details...</div>;
  }

  if (error) {
    return (
      <div>
        <div className="alert alert-danger">{error}</div>
        <button 
          onClick={() => navigate('/teacher/dashboard')} 
          className="btn"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Generate Attendance Code</h1>
        {session && (
          <p className="dashboard-subtitle">
            Session for {session.course_name || 'Course'} on {new Date(session.start_time).toLocaleDateString()} at {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      <div className="qr-container">
        {verificationCode ? (
          <>
            <div className="qr-code">
              <QRCodeSVG 
                value={`${verificationCode}|${sessionId}`} 
                size={250} 
                level="H" 
                includeMargin
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
            <div className="verification-code">
              {verificationCode}
            </div>
            {timeLeft && (
              <div className="expiry-info">
                Code expires in: {timeLeft}
              </div>
            )}
            <p>Show this QR code to your students or have them enter the verification code manually.</p>
            <button 
              onClick={handleGenerateCode} 
              className="btn"
              disabled={generating}
              style={{ marginTop: '1rem' }}
            >
              Generate New Code
            </button>
          </>
        ) : (
          <>
            <p>Generate a verification code for students to mark their attendance.</p>
            <p>The code will expire in 5 minutes for security purposes.</p>
            <button 
              onClick={handleGenerateCode} 
              className="btn"
              disabled={generating}
              style={{ marginTop: '1rem' }}
            >
              {generating ? 'Generating...' : 'Generate Code'}
            </button>
          </>
        )}
      </div>

      <div className="text-center" style={{ marginTop: '2rem' }}>
        <button 
          onClick={() => navigate(`/teacher/verify/${sessionId}`)} 
          className="btn"
          style={{ marginRight: '1rem' }}
        >
          Verify Attendance
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

export default GenerateQR; 