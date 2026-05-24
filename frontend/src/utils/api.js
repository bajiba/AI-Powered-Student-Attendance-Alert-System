import { authFetch, setToken, getUserId } from './auth';

const API_URL = process.env.REACT_APP_API_URL || '';

// Authentication APIs
export const login = async (username, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }
    
    const data = await response.json();
    setToken(data.access_token);
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Registration failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// User APIs
export const getUserProfile = async () => {
  try {
    const userId = getUserId();
    const response = await authFetch(`${API_URL}/users/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

// Student Attendance APIs
export const markAttendance = async (sessionId, verificationCode, coordinates) => {
  try {
    const payload = {
      session_id: sessionId,
      verification_code: verificationCode,
    };
    
    // Add coordinates if available
    if (coordinates && coordinates.latitude && coordinates.longitude) {
      payload.latitude = coordinates.latitude;
      payload.longitude = coordinates.longitude;
    }
    
    const response = await authFetch(`${API_URL}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to mark attendance');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Mark attendance error:', error);
    throw error;
  }
};

export const getStudentAttendance = async () => {
  try {
    const response = await authFetch(`${API_URL}/attendance/student`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch attendance records');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get student attendance error:', error);
    throw error;
  }
};

// Teacher Attendance APIs
export const generateVerificationCode = async (sessionId) => {
  try {
    const response = await authFetch(`${API_URL}/attendance/generate-code/${sessionId}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate verification code');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Generate verification code error:', error);
    throw error;
  }
};

export const getSessionAttendance = async (sessionId) => {
  try {
    const response = await authFetch(`${API_URL}/attendance/verify-session/${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch session attendance');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get session attendance error:', error);
    throw error;
  }
};

export const verifyStudentAttendance = async (attendanceId) => {
  try {
    const response = await authFetch(`${API_URL}/attendance/teacher-verify/${attendanceId}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to verify attendance');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Verify attendance error:', error);
    throw error;
  }
};

// Course APIs
export const getTeacherCourses = async () => {
  try {
    const response = await authFetch(`${API_URL}/courses/teacher`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch teacher courses');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get teacher courses error:', error);
    throw error;
  }
};

export const getStudentCourses = async () => {
  try {
    const response = await authFetch(`${API_URL}/courses/student`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch student courses');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get student courses error:', error);
    throw error;
  }
};

export const getCourseSessions = async (courseId) => {
  try {
    const response = await authFetch(`${API_URL}/courses/${courseId}/sessions`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch course sessions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get course sessions error:', error);
    throw error;
  }
}; 