import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '../utils/api';

const UserProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profileData = await getUserProfile();
        setProfile(profileData);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <div>Loading profile data...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!profile) {
    return <div>No profile data found.</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">User Profile</h1>
        <p className="dashboard-subtitle">
          Manage your account and view your information
        </p>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img 
            src={`https://ui-avatars.com/api/?name=${profile.username}&background=random&size=128`} 
            alt="Profile avatar" 
            style={{ borderRadius: '50%' }}
          />
          <h2 style={{ marginTop: '1rem' }}>{profile.username}</h2>
          <span className={`status-badge status-${profile.role === 'admin' ? 'present' : profile.role === 'teacher' ? 'late' : 'absent'}`}>
            {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
          </span>
        </div>

        <div>
          <h3>Account Information</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>Email:</td>
                <td style={{ padding: '0.5rem' }}>{profile.email}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>Username:</td>
                <td style={{ padding: '0.5rem' }}>{profile.username}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>Role:</td>
                <td style={{ padding: '0.5rem' }}>{profile.role}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>Phone Number:</td>
                <td style={{ padding: '0.5rem' }}>{profile.phone_number || 'Not provided'}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>Joined:</td>
                <td style={{ padding: '0.5rem' }}>{new Date(profile.created_at).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>Last Login:</td>
                <td style={{ padding: '0.5rem' }}>
                  {profile.last_login ? new Date(profile.last_login).toLocaleString() : 'Never'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn" onClick={() => navigate('/change-password')}>
            Change Password
          </button>
          <button className="btn" onClick={() => navigate('/edit-profile')}>
            Edit Profile
          </button>
        </div>
      </div>

      <div className="text-center" style={{ marginTop: '2rem' }}>
        <button 
          onClick={() => navigate(-1)} 
          className="btn"
          style={{ background: 'transparent', color: '#3498db', border: 'none' }}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default UserProfile; 