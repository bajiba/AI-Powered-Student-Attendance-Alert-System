import jwtDecode from 'jwt-decode';

// Save token to localStorage
export const setToken = (token) => {
  localStorage.setItem('authToken', token);
};

// Get token from localStorage
export const getToken = () => {
  return localStorage.getItem('authToken');
};

// Remove token from localStorage
export const removeToken = () => {
  localStorage.removeItem('authToken');
};

// Check if token exists and is valid
export const isAuthenticated = () => {
  const token = getToken();
  
  if (!token) {
    return false;
  }
  
  try {
    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    // Check if token has expired
    if (decodedToken.exp < currentTime) {
      removeToken();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error decoding token:', error);
    removeToken();
    return false;
  }
};

// Get user role from token
export const getUserRole = () => {
  const token = getToken();
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwtDecode(token);
    return decoded.role || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Get user ID from token
export const getUserId = () => {
  const token = getToken();
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwtDecode(token);
    return decoded.sub || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// API request with authentication headers
export const authFetch = async (url, options = {}) => {
  const token = getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // If unauthorized, clear token
  if (response.status === 401) {
    removeToken();
    window.location.href = '/';
    throw new Error('Unauthorized');
  }
  
  return response;
}; 