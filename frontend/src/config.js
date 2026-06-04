export const API_BASE_URL = 
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080'
    : (import.meta.env.VITE_API_URL || 'https://api.placementbabai.online');
