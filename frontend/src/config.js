// In production, we use a relative path to take advantage of Amplify Rewrites
// This avoids "Mixed Content" errors (HTTPS calling HTTP)
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
