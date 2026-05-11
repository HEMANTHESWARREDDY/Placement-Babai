// Using the direct EC2 IP since Amplify does not allow proxying to HTTP endpoints
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://13.201.100.52:8080/api';
